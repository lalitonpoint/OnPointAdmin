const crypto = require('crypto');
const InitiatePayment = require('../models/paymentModal');
require('dotenv').config();


const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const receivedSignature = req.headers['x-razorpay-signature'];
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (receivedSignature !== generatedSignature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
        const paymentData = payload.payment.entity;

        try {
            const paymentRecord = await InitiatePayment.findOne({ preTransactionId: paymentData.order_id });

            if (!paymentRecord) {
                return res.status(200).json({ success: false, message: 'Payment order not found' });
            }
            if (paymentRecord.transactionStatus == 1) {
                return res.status(200).json({ success: false, message: 'Payment Alreadt Done' });
            }


            paymentRecord.transactionStatus = paymentData.status;
            paymentRecord.postTransactionId = paymentData.id;
            paymentRecord.paymentId = paymentData.id;

            await paymentRecord.save();

            return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
        } catch (err) {
            console.error('Webhook DB error:', err);
            return res.status(500).json({ success: false, message: 'Error updating payment' });
        }
    } else {
        return res.status(200).json({ success: true, message: 'Unhandled event type' });
    }
};

module.exports = { razorpayWebhook };
