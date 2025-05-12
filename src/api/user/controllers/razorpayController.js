const crypto = require('crypto');
const InitiatePayment = require('../models/paymentModal');
const Wallet = require('../models/walletModal');
require('dotenv').config();

const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const receivedSignature = req.headers['x-razorpay-signature'];
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (receivedSignature !== generatedSignature) {
        return res.status(200).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    if (!event || !payload) {
        return res.status(200).json({ success: false, message: 'Invalid webhook data' });
    }

    if (event === 'payment.captured') {
        const paymentData = payload.payment;

        try {
            if (paymentData.notes.isWalletPay == 0) {
                const paymentRecord = await InitiatePayment.findOne({ preTransactionId: paymentData.order_id });

                if (!paymentRecord) {
                    return res.status(200).json({ success: false, message: 'Payment order not found' });
                }
                if (paymentRecord.transactionStatus == 1) {
                    return res.status(200).json({ success: false, message: 'Payment Already Done' });
                }

                paymentRecord.transactionStatus = paymentData.status;
                paymentRecord.postTransactionId = paymentData.order_id;
                paymentRecord.paymentId = paymentData.id;

                await paymentRecord.save();
            }
            // wallet handling
            else {
                const userId = paymentData.notes.userId;
                const orderId = paymentData.order_id;

                let wallet = await Wallet.findOne({
                    userId: userId,
                    'transactions.orderId': orderId
                });
                const amount = paymentData.amount / 100;  // Convert paisa to rupees

                const transaction = {
                    type: "credit",
                    amount: amount,
                    method: paymentData.method,
                    orderId: paymentData.order_id,
                    transactionStatus: paymentData.status
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
            }
            return res.status(200).json({ success: true, message: 'Webhook processed successfully' });

        } catch (err) {
            console.error('Webhook DB error:', err);
            return res.status(500).json({ success: false, message: 'Error updating payment' });
        }
    } else if (event === 'payment.failed') {
        console.log('Payment failed:', payload.payment);
        return res.status(200).json({ success: true, message: 'Payment failed handled' });
    } else {
        return res.status(200).json({ success: true, message: 'Unhandled event type' });
    }
};

module.exports = { razorpayWebhook };
