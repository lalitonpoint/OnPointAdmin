const InitiatePayment = require('../models/paymentModal');
const { packageCalculation } = require('../controllers/packageController');
const generateOrderId = require('../utils/generateOrderId');

const razorpay = require('../utils/rajorpay');
const crypto = require('crypto');
require('dotenv').config(); // at the top of your file



const addPaymentDetail = async (req, res) => {
    try {
        const {
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            pickupPincode,
            dropPincode,
            pickupAddress,
            dropAddress,
            pickupNote,
            packages,
        } = req.body;

        const userId = req.headers['userid'];
        if (!userId) return res.status(400).json({ success: false, message: "User ID is required in headers." });

        const requiredFields = {
            pickupLatitude, pickupLongitude,
            dropLatitude, dropLongitude,
            pickupPincode, dropPincode,
            pickupAddress, dropAddress,
            pickupNote
        };

        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || typeof value !== 'string') {
                return res.status(400).json({ success: false, message: `${key} is required and must be a string.` });
            }
        }

        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({ success: false, message: "At least one package is required." });
        }

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const { packageName, packageType, numberOfPackages, totalWeight, length, width, height } = pkg;

            if (
                typeof packageName !== 'string' || !packageName ||
                typeof packageType !== 'string' || !packageType
            ) {
                return res.status(400).json({ success: false, message: `packageName and packageType must be strings (Package ${i + 1}).` });
            }

            if (
                typeof numberOfPackages !== 'number' || numberOfPackages <= 0 ||
                typeof totalWeight !== 'number' || totalWeight <= 0 ||
                typeof length !== 'number' || length <= 0 ||
                typeof width !== 'number' || width <= 0 ||
                typeof height !== 'number' || height <= 0
            ) {
                return res.status(400).json({ success: false, message: `numberOfPackages , totalWeight , height ,width & width must be positive numbers (Package ${i + 1}).` });
            }

        }

        const orderId = await generateOrderId();

        const costResult = await packageCalculation(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, packages);
        if (!costResult || costResult.success === false) {
            return res.status(400).json({ success: false, message: costResult.message || 'Failed to calculate delivery charges.' });
        }

        const { subTotal, shippingCost, specialHandling, gstAmount, totalPayment, distance, duration } = costResult;

        let razorpayOrderIdResponse = await initiateRazorpayOrderId(totalPayment);

        let razorpayOrderId = 0;
        if (razorpayOrderIdResponse && razorpayOrderIdResponse.success === true) {
            razorpayOrderId = razorpayOrderIdResponse.orderId;
        }

        const initiatePayment = new InitiatePayment({
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            pickupPincode,
            dropPincode,
            pickupAddress,
            dropAddress,
            pickupNote,
            packages,
            distance,
            duration,
            subTotal,
            shippingCost,
            specialHandling,
            gst: gstAmount,
            totalPayment,
            userId,
            orderId,
            preTransactionId: razorpayOrderId,
            transactionDate: new Date()
        });

        await initiatePayment.save();

        return res.status(201).json({
            success: true,
            message: "Payment details saved successfully.",
            data: initiatePayment
        });

    } catch (error) {
        console.error("Error in addPaymentDetail:", error);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

const completePayment = async (req, res) => {
    try {
        const { paymentId, transactionStatus, transactionId, totalPayment, transactionDate } = req.body;

        if (!paymentId || !transactionStatus || !transactionId || !totalPayment || !transactionDate) {
            return res.status(400).json({ success: false, message: "Missing required payment completion details." });
        }

        const existingTransaction = await InitiatePayment.findOne({ postTransactionId: transactionId });
        if (existingTransaction) {
            return res.status(409).json({ success: false, message: "Transaction already recorded." });
        }


        const paymentRecord = await InitiatePayment.findOne({ preTransactionId: transactionId });

        if (!paymentRecord) {
            return res.status(404).json({ success: false, message: "Payment record not found." });
        }

        paymentRecord.transactionStatus = transactionStatus;
        paymentRecord.postTransactionId = transactionId;
        paymentRecord.paymentId = paymentId;
        paymentRecord.totalPayment = totalPayment;
        paymentRecord.transactionDate = new Date(transactionDate);

        const existing = await InitiatePayment.findOne({ postTransactionId: transactionId });
        if (existing) {
            return res.status(409).json({ success: false, message: "Transaction already recorded." });
        }

        await paymentRecord.save();

        return res.status(200).json({ success: true, message: "Payment completed successfully.", data: paymentRecord });

    } catch (error) {
        console.error("Error in completePayment:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// routes/payment.js
const initiateRazorpayOrderId = async (amount) => {
    try {
        if (!amount || isNaN(amount)) {
            return { success: false, error: 'Invalid amount' };
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                packageType: 'Fragile'
            }
        };

        const order = await razorpay.orders.create(options);

        if (order && order.id) {
            return { success: true, orderId: order.id, order };
        } else {
            return { success: false, error: 'Order creation failed' };
        }

    } catch (error) {
        return { success: false, error: error.message || 'Something went wrong' };
    }
};


const verifyPayment = (req, res) => {
    const { razorPayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorPayOrderId) {
        return res.status(400).json({ success: false, message: 'Missing razorPayOrderId' });
    }

    if (!razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Missing razorpayPaymentId' });
    }

    if (!razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Missing razorpaySignature' });
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorPayOrderId + '|' + razorpayPaymentId)
        .digest('hex');

    if (generatedSignature === razorpaySignature) {
        res.status(200).json({ success: true, message: 'Payment Verified' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid Signature' });
    }
};





module.exports = { addPaymentDetail, completePayment, verifyPayment };
