const crypto = require('crypto');
const razorpay = require('../utils/razorpay');
const Wallet = require('../models/walletModal');
const Payment = require('../models/paymentModal');
require('dotenv').config();


const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const walletBalance = async (req, res) => {
    const userId = req.headers['userid'];

    try {
        const wallet = await Wallet.findOne({ userId: userId });

        if (wallet) {
            res.status(200).json({ success: true, balance: wallet.balance });
        } else {
            res.status(404).json({ success: false, message: 'Wallet not found' });
        }
    } catch (error) {
        console.error('Wallet Balance Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Add Money to Wallet
const addMoney = async (req, res) => {
    const { amount } = req.body;
    const userId = req.headers['userid'];


    if (amount === undefined || amount === null) {
        return res.json({ success: false, message: "Amount is required" });
    }

    if (isNaN(amount)) {
        return res.json({ success: false, message: "Amount must be a number" });
    }

    if (amount <= 0) {
        return res.json({ success: false, message: "Amount must be greater than zero" });
    }

    const options = {
        amount: amount * 100, // convert to paise
        currency: 'INR',
        receipt: `wallet_${Date.now()}`,
        notes: {
            userId: userId,
            isWalletPay: 1
        }
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order_id: order.id, razorpay_key: razorpay.key_id, amount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating Razorpay order', error });
    }
};

const walletVerify = async (req, res) => {

    const { razorPayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;
    const userId = req.headers['userid'];

    const missingFields = [];

    if (!razorPayOrderId) missingFields.push('razorPayOrderId');
    if (!razorpayPaymentId) missingFields.push('razorpayPaymentId');
    if (!razorpaySignature) missingFields.push('razorpaySignature');
    if (!amount) missingFields.push('amount');

    if (typeof amount === 'string') {
        return res.status(200).json({ success: false, message: 'Amount Must Be Number' });
    }


    if (missingFields.length > 0) {
        return res.status(200).json({
            success: false,
            message: `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required`
        });
    }


    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorPayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (generatedSignature !== razorpaySignature) {
        return res.status(200).json({ success: false, message: 'Invalid Signature' });
    }

    try {
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        if (payment.status === 'captured' && payment.order_id === razorPayOrderId) {
            let wallet = await Wallet.findOne({ userId: userId });

            const transaction = {
                type: "credit",
                amount: amount,
                method: "UPI",
                orderId: razorPayOrderId,
                transactionStatus: 1
            };

            if (!wallet) {
                wallet = new Wallet({
                    userId,
                    balance: amount,
                    transactions: [transaction]
                });

                await wallet.save();
            } else {

                const existingTransaction = wallet.transactions.find(txn =>
                    txn.orderId === razorPayOrderId && txn.transactionStatus === 1
                );

                if (existingTransaction) {
                    // Transaction already added
                    return res.status(200).json({ success: false, message: 'Amount already added to wallet' });
                }
                existBalance = parseFloat(wallet.balance, 2)

                wallet.balance = existBalance + amount;
                wallet.transactions.push(transaction);
                await wallet.save();
            }
            return res.status(200).json({ success: true, message: 'Amount Successfully Added To Wallet' });
        } else {
            return res.status(200).json({ success: false, message: 'Payment not captured or mismatched order ID' });
        }
    } catch (error) {
        console.error('Wallet Verify Error:', error);
        return res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
    }
};

const walletUse = async (req, res) => {
    const { packageId, amount } = req.body;

    if (typeof amount !== 'number') {
        return res.status(200).json({ success: false, message: 'Amount must be a number' });
    }

    const userId = req.headers['userid'];
    if (!userId) {
        return res.status(200).json({ success: false, message: 'User ID missing in headers' });
    }

    try {
        const packageDetail = await Payment.findById(packageId);
        if (!packageDetail) {
            return res.status(200).json({ success: false, message: 'Package not found' });
        }

        const wallet = await Wallet.findOne({ userId: userId });
        if (!wallet) {
            return res.status(200).json({ success: false, message: 'Wallet not found' });
        }

        if (wallet.balance < amount) {
            return res.status(200).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const order_id = generateWalletOrderId();

        // Deduct balance and record transaction
        wallet.balance -= amount;
        wallet.transactions.push({
            type: 'debit',
            amount,
            method: 'Wallet_Pay',
            order_id,
            date: new Date()
        });
        await wallet.save();

        // Update package/payment details
        packageDetail.transactionStatus = 1;
        packageDetail.preTransactionId = order_id;
        packageDetail.postTransactionId = order_id;
        packageDetail.paymentId = order_id;
        packageDetail.isWalletPay = 1;
        await packageDetail.save();

        return res.json({
            success: true,
            message: 'Wallet amount applied successfully',
            remaining_balance: wallet.balance,
            order_id
        });

    } catch (err) {
        console.error('Error processing wallet transaction:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Refund to Wallet

const walletRefund = async (req, res) => {
    const { order_id, amount } = req.body;

    if (typeof amount === 'string') {
        return res.status(200).json({ success: false, message: 'Amount Must Be Number' });
    }

    const userId = req.headers['userid'];

    try {
        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found' });
        }

        wallet.balance += amount;

        wallet.transactions.push({ type: 'credit', amount, method: 'refund', order_id });

        await wallet.save();

        res.json({ success: true, message: 'Amount refunded to wallet', balance: wallet.balance });
    } catch (err) {
        console.error('Error processing wallet refund:', err);
        res.status(500).json({ success: false, message: 'An error occurred while processing the wallet refund' });
    }
};

// Transaction History

const walletTransaction = async (req, res) => {
    const userId = req.headers['userid'];

    try {
        const wallet = await Wallet.findOne({ userId: userId });

        if (wallet) {
            res.status(200).json({ success: true, balance: wallet.balance, data: wallet.transactions.reverse() });
        } else {
            res.status(200).json({ success: false, message: 'Wallet not found' });
        }
    } catch (error) {
        console.error('Wallet Transaction Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Razorpay Webhook Handler
const webhookHandler = async (req, res) => {
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature === razorpaySignature) {
        const payload = req.body;

        if (payload.event === 'payment.captured') {
            const payment = payload.payload.payment.entity;
            const { order_id, amount } = payment;

            const user_id = 'user1'; // Replace with actual user identification logic
            let wallet = await Wallet.findOne({ user_id });
            if (!wallet) {
                wallet = await Wallet.create({ user_id });
            }

            wallet.balance += amount / 100;
            wallet.transactions.push({
                type: 'credit',
                amount: amount / 100,
                method: 'razorpay_webhook',
                order_id,
                created_at: new Date()
            });

            await wallet.save();
            return res.status(200).json({ success: true });
        }

        res.status(200).json({ success: true }); // Acknowledge other events
    } else {
        res.status(200).json({ success: false, message: 'Invalid webhook signature' });
    }
}


const generateWalletOrderId = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14); // e.g., 20250429142530
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();  // e.g., 5CHAR
    return `WALLET-${timestamp}-${randomPart}`;
};

module.exports = { walletBalance, addMoney, walletTransaction, webhookHandler, walletRefund, walletVerify, walletUse };
