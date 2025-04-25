const crypto = require('crypto');
const razorpay = require('../utils/razorpay');
const Wallet = require('../models/walletModal');

const RAZORPAY_WEBHOOK_SECRET = 'YOUR_WEBHOOK_SECRET';


// Get Wallet Balance
const walletBalance = async (req, res) => {
    // res.json({ status: true, balance: req.wallet.balance });
}

// Add Money to Wallet
const addMoney = async (req, res) => {
    const { amount } = req.body;
    const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `wallet_${Date.now()}`
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json({ status: true, order_id: order.id, razorpay_key: razorpay.key_id, amount });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error creating Razorpay order', error });
    }
}

// Verify Payment and Credit Wallet
const walletVerify = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', razorpay.key_secret).update(body).digest('hex');

    if (expectedSignature === razorpay_signature) {
        req.wallet.balance += amount;
        req.wallet.transactions.push({ type: 'credit', amount, method: 'razorpay' });
        await req.wallet.save();
        res.json({ status: true, message: 'Wallet funded successfully', balance: req.wallet.balance });
    } else {
        res.status(200).json({ status: false, message: 'Invalid signature' });
    }
}

// Use Wallet
const walletUse = async (req, res) => {
    const { order_id, amount } = req.body;
    if (req.wallet.balance >= amount) {
        req.wallet.balance -= amount;
        req.wallet.transactions.push({ type: 'debit', amount, method: 'order', order_id });
        await req.wallet.save();
        res.json({ status: true, message: 'Wallet amount applied', remaining_balance: req.wallet.balance });
    } else {
        res.status(200).json({ status: false, message: 'Insufficient wallet balance' });
    }
}

// Refund to Wallet
const walletRefund = async (req, res) => {
    const { order_id, amount } = req.body;
    req.wallet.balance += amount;
    req.wallet.transactions.push({ type: 'credit', amount, method: 'refund', order_id });
    await req.wallet.save();
    res.json({ status: true, message: 'Amount refunded to wallet', balance: req.wallet.balance });
}

// Transaction History
const walletTransaction = async (req, res) => {
    res.json({ status: true, transactions: req.wallet.transactions });
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
            return res.status(200).json({ status: true });
        }

        res.status(200).json({ status: true }); // Acknowledge other events
    } else {
        res.status(200).json({ status: false, message: 'Invalid webhook signature' });
    }
}

module.exports = { walletBalance, addMoney, walletTransaction, webhookHandler, walletRefund, walletVerify, walletUse };
