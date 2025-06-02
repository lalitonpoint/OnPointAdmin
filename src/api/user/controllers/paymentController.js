const InitiatePayment = require('../models/paymentModal');
const FtlPayment = require('../models/ftlPaymentModal');
const { packageCalculation, ftlPackageCalculation } = require('../controllers/packageController');
const generateOrderId = require('../utils/generateOrderId');
const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'
const Vehicle = require('../../../admin/models/vehcileManagement/truckManagementModel');


const razorpay = require('../utils/razorpay');
const crypto = require('crypto');
require('dotenv').config();

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
            transportMode,
        } = req.body;

        const userId = req.headers['userid'];
        if (!userId) return res.status(200).json({ success: false, message: "User ID is required in headers." });

        const requiredFields = {
            pickupLatitude, pickupLongitude,
            dropLatitude, dropLongitude,
            // pickupPincode, dropPincode,
            pickupAddress, dropAddress, transportMode
        };

        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || typeof value !== 'string') {
                return res.status(200).json({ success: false, message: `${key} is required and must be a string.` });
            }
        }

        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(200).json({ success: false, message: "At least one package is required." });
        }

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const { packageName, packageType, numberOfPackages, totalWeight, length, width, height } = pkg;

            if (
                typeof packageName !== 'string' || !packageName ||
                typeof packageType !== 'string' || !packageType
            ) {
                return res.status(200).json({ success: false, message: `packageName and packageType must be strings (Package ${i + 1}).` });
            }

            if (
                typeof numberOfPackages !== 'number' || numberOfPackages <= 0 ||
                typeof totalWeight !== 'number' || totalWeight <= 0 ||
                typeof length !== 'number' || length <= 0 ||
                typeof width !== 'number' || width <= 0 ||
                typeof height !== 'number' || height <= 0
            ) {
                return res.status(200).json({ success: false, message: `numberOfPackages , totalWeight , height ,width & width must be positive numbers (Package ${i + 1}).` });
            }

        }

        const orderId = await generateOrderId();

        const costResult = await packageCalculation(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, packages);
        if (!costResult || costResult.success === false) {
            return res.status(200).json({ success: false, message: costResult.message || 'Failed to calculate delivery charges.' });
        }

        const { subTotal, shippingCost, specialHandling, gstAmount, totalPayment, distance, duration } = costResult;

        let razorpayOrderIdResponse = await initiateRazorpayOrderId(req, totalPayment);

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
            transportMode,
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


// routes/payment.js
const initiateRazorpayOrderId = async (req, amount) => {
    const userId = req.headers['userid'];
    try {
        if (!amount || isNaN(amount)) {
            return { success: false, error: 'Invalid amount' };
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId,
                isWalletPay: 0
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




const verifyPayment = async (req, res) => {
    const { razorPayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorPayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(200).json({ success: false, message: 'Missing required fields' });
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
        // return res.status(200).json({ success: true, message: 'Is', payment: payment });



        if (payment.status === 'captured' && payment.order_id === razorPayOrderId) {

            const paymentRecord = await InitiatePayment.findOne({ preTransactionId: razorPayOrderId });

            if (!paymentRecord) {
                return res.status(200).json({ success: false, message: 'Payment order not found' });
            }

            // if (paymentRecord.transactionStatus === 1) {
            //     return res.status(200).json({ success: true, message: 'Payment is Already Verified' });
            // }

            paymentRecord.transactionStatus = 1;
            paymentRecord.postTransactionId = payment.order_id;
            paymentRecord.paymentId = payment.id;

            await paymentRecord.save();

            return res.status(200).json({ success: true, message: 'Payment Done Successfully', payment });
        } else {
            return res.status(200).json({ success: false, message: 'Payment not captured or mismatched order ID' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
    }
};

const estimatePriceCalculation = async (req, res) => {
    const { pickupLatitude, pickupLongitude, dropLatitude, dropLongitude } = req.body;
    if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
        return res.status(200).json({
            success: false,
            message: 'Pick & Drop Lat Long Are Required',
        });

    }

    try {
        const { distanceInKm, duration } = await getDistanceAndDuration(
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude
        );

        const estimatePrice = parseFloat((distanceInKm * 10).toFixed(2));
        return res.status(200).json({
            success: true,
            message: 'Estimated Payment',
            data: { price: estimatePrice }
        });
    } catch (e) {
        console.error(`Error calculating distance and duration:`, e.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate estimated price',
            error: e.message
        });
    }
};


//////////////////////////////FTL Order Initiate///////////////////////////////////
const ftlOrderInitiate = async (req, res) => {
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
            isBidding,
            vehcileId // Typo retained as per your code; corrected below
        } = req.body;

        const userId = req.headers['userid'];
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required in headers."
            });
        }

        // Validate required string fields
        const requiredFields = {
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            pickupAddress,
            dropAddress,
            vehcileId
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value || typeof value !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required and must be a string.`
                });
            }
        }

        const isBiddingNum = parseInt(isBidding, 10);
        if (![0, 1].includes(isBiddingNum)) {
            return res.status(400).json({
                success: false,
                message: "isBidding must be 0 or 1."
            });
        }

        const vehicleDetail = await Vehicle.findById(vehcileId).lean();
        if (!vehicleDetail) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        const orderId = isBiddingNum === 0 ? await generateOrderId() : null;

        const costResult = await ftlPackageCalculation(
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            res,
            isBiddingNum
        );

        if (!costResult || !costResult.totalPayment) {
            return res.status(400).json({
                success: false,
                message: costResult?.message || 'Failed to calculate delivery charges.'
            });
        }

        const {
            subTotal,
            shippingCost,
            specialHandling,
            gstAmount,
            totalPayment,
            distance,
            duration
        } = costResult;

        const paymentPayload = new FtlPayment({
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            pickupPincode,
            dropPincode,
            pickupAddress,
            dropAddress,
            distance,
            duration,
            isBidding: isBiddingNum,
            userId,
            orderId,
            shippingCost,
            specialHandling,
            transactionDate: new Date(),

            vehcileName: vehicleDetail.name,
            vechileImage: vehicleDetail.vechileImage,
            vehcileBodyType: vehicleDetail.bodyType,
            vehcileCapacity: vehicleDetail.capacity,
            vehcileTireType: vehicleDetail.tireType,

            subTotal,
            gst: gstAmount,
            totalPayment
        });

        await paymentPayload.save();

        return res.status(201).json({
            success: true,
            message: "Payment details saved successfully.",
            data: paymentPayload
        });

    } catch (error) {
        console.error("Error in ftlOrderInitiate:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};


//////////////////////////////FTL Order Initiate///////////////////////////////////

module.exports = { addPaymentDetail, verifyPayment, estimatePriceCalculation, ftlOrderInitiate };
