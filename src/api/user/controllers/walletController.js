const crypto = require('crypto');
const razorpay = require('../utils/razorpay');
const Wallet = require('../models/walletModal');
require('dotenv').config();


const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
require('dotenv').config();

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

    if (!razorPayOrderId || !razorpayPaymentId || !razorpaySignature || !amount) {
        return res.status(400).json({ success: false, message: 'razorPayOrderId, razorpayPaymentId, razorpaySignature & amount are required' });
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorPayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Invalid Signature' });
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
                wallet.balance += amount;
                wallet.transactions.push(transaction);
                await wallet.save();
            }
            return res.status(200).json({ success: true, message: 'Amount Successfully Added To Wallet' });
        } else {
            return res.status(400).json({ success: false, message: 'Payment not captured or mismatched order ID' });
        }
    } catch (error) {
        console.error('Wallet Verify Error:', error);
        return res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
    }
};

// Use Wallet
const walletUse = async (req, res) => {
    const { order_id, amount } = req.body;
    const userId = req.headers['userid'];

    try {
        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found' });
        }

        if (wallet.balance >= amount) {
            wallet.balance -= amount;
            wallet.transactions.push({ type: 'debit', amount, method: 'order', order_id });

            await wallet.save();

            return res.json({ success: true, message: 'Wallet amount applied', remaining_balance: wallet.balance });
        } else {
            return res.status(422).json({ success: false, message: 'Insufficient wallet balance' });
        }

    } catch (err) {
        console.error('Error processing wallet transaction:', err);
        return res.status(500).json({ success: false, message: 'An error occurred while processing the wallet transaction' });
    }
};

// Refund to Wallet

const walletRefund = async (req, res) => {
    const { order_id, amount } = req.body;
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
            res.status(200).json({ success: true, transactions: wallet.transactions.reverse() });
        } else {
            res.status(404).json({ success: false, message: 'Wallet not found' });
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

module.exports = { walletBalance, addMoney, walletTransaction, webhookHandler, walletRefund, walletVerify, walletUse };
