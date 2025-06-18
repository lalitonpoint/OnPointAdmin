const InitiatePayment = require('../models/paymentModal');
const FtlPayment = require('../models/ftlPaymentModal');
const { packageCalculation, ftlPackageCalculation } = require('../controllers/packageController');
const generateOrderId = require('../utils/generateOrderId');
const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'
const Vehicle = require('../../../admin/models/vehcileManagement/truckManagementModel');
const Rating = require('../../user/models/ratingModal'); // Adjust path as per your project
const Bidding = require('../../driver/modals/biddingModal'); // Adjust path as per your project
// const Rating = require('../models/ratingModal'); // Adjust path as per your project
const mongoose = require('mongoose');

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
            vehcileId,
            estimatePrice
        } = req.body;

        const userId = req.headers['userid'];
        if (!userId) {
            return res.status(200).json({
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
            vehcileId,
            estimatePrice
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value || typeof value !== 'string') {
                return res.status(200).json({
                    success: false,
                    message: `${field} is required and must be a string.`
                });
            }
        }

        const isBiddingNum = parseInt(isBidding);
        if (![0, 1].includes(isBiddingNum)) {
            return res.status(200).json({
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

        const orderId = await generateOrderId();

        const costResult = await ftlPackageCalculation(
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            res,
            isBiddingNum
        );

        if (!costResult || !costResult.totalPayment) {
            return res.status(200).json({
                success: false,
                message: costResult?.message || 'Failed to calculate delivery charges.'
            });
        }

        let razorpayOrderId = 0;

        if (isBidding == 0) {
            let razorpayOrderIdResponse = await initiateRazorpayOrderId(req, costResult.totalPayment);

            if (razorpayOrderIdResponse && razorpayOrderIdResponse.success === true) {
                razorpayOrderId = razorpayOrderIdResponse.orderId;
            }
        }


        const {
            subTotal,
            shippingCost,
            specialHandling,
            gstPercentage,
            prePaymentPercentage,
            gstAmount,
            totalPayment,
            distance,
            duration
        } = costResult;

        let prePayment = 0, postPayment = 0;

        if (isBidding && typeof totalPayment === 'number' && typeof prePaymentPercentage === 'number') {
            prePayment = (totalPayment * prePaymentPercentage) / 100;
            postPayment = totalPayment - prePayment;
        }

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
            isAccepted: 0,
            estimatePrice,
            gstPercentage: costResult.gstPercentage,
            loadingTime: costResult.loadingTime,
            unloadingTime: costResult.unloadingTime,
            prePaymentPercentage: isBidding == 1 ? costResult.prePaymentPercentage : 0,
            prePayment: isBidding == 1 ? prePayment : 0,
            postPayment: isBidding == 1 ? postPayment : 0,

            vehcileName: vehicleDetail.name,
            vehicleImage: vehicleDetail.vehicleImage,
            vehcileBodyType: vehicleDetail.bodyType,
            vehcileCapacity: vehicleDetail.capacity,
            vehcileTireType: vehicleDetail.tireType,

            subTotal,
            gst: gstAmount,
            totalPayment,
            preTransactionId: razorpayOrderId,

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



const ftlVerifyPayment = async (req, res) => {
    const { razorPayOrderId, razorpayPaymentId, razorpaySignature, isPartialPayment } = req.body;

    if (!razorPayOrderId || !razorpayPaymentId || !razorpaySignature || isPartialPayment == undefined) {
        return res.status(200).json({ success: false, message: 'Missing required fields' });
    }

    if (![0, 1, 2].includes(isPartialPayment)) {
        return res.status(200).json({ success: false, message: 'Invaild isPartialPayment Value' });
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

            const paymentRecord = await FtlPayment.findOne({ preTransactionId: razorPayOrderId });

            if (!paymentRecord) {
                return res.status(200).json({ success: false, message: 'Payment order not found' });
            }

            // if (paymentRecord.transactionStatus === 1) {
            //     return res.status(200).json({ success: true, message: 'Payment is Already Verified' });
            // }

            paymentRecord.transactionStatus = 1;
            paymentRecord.postTransactionId = payment.order_id;
            paymentRecord.paymentId = payment.id;
            paymentRecord.isPartialPayment = isPartialPayment;


            await paymentRecord.save();

            return res.status(200).json({ success: true, message: 'Payment Done Successfully', payment });
        } else {
            return res.status(200).json({ success: false, message: 'Payment not captured or mismatched order ID' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
    }
};

const biddingDetail = async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(200).json({ success: false, message: 'requestId is required' });
    }

    try {
        // Step 1: Fetch FTL data
        const ftlData = await FtlPayment.findById(requestId).lean();
        if (!ftlData) {
            return res.status(404).json({ success: false, message: 'FTL request not found' });
        }

        // Step 2: Fetch all biddings with driver info
        const allBidding = await Bidding.find({ requestId })
            .populate({ path: 'driverId', select: 'personalInfo' })
            .select('driverId biddingAmount')
            .lean();

        const driverIds = allBidding.map(bid => bid.driverId?._id).filter(Boolean);

        // Step 3: Get average ratings
        const ratingAggregation = await Rating.aggregate([
            {
                $match: {
                    driverId: { $in: driverIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $group: {
                    _id: '$driverId',
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        const ratingMap = {};
        ratingAggregation.forEach(r => {
            ratingMap[r._id.toString()] = {
                averageRating: r.averageRating.toFixed(2),
                totalRatings: r.totalRatings
            };
        });

        // Step 4: Distance & Duration
        const drop = await getDistanceAndDuration(
            ftlData.pickupLatitude,
            ftlData.pickupLongitude,
            ftlData.dropLatitude,
            ftlData.dropLongitude
        );

        // Step 5: Format bidding array
        const bidding = allBidding.map(bid => {
            const driverIdStr = bid.driverId?._id?.toString();
            const rating = ratingMap[driverIdStr] || { averageRating: null };

            return {
                averageRating: rating.averageRating,
                biddingAmount: bid.biddingAmount,
                driverName: bid.driverId?.personalInfo?.name || 'N/A',
                driverProfile: bid.driverId?.personalInfo?.profilePicture || null,
                driverId: driverIdStr || null
            };
        });

        // Step 6: Construct final output
        const result = {
            pickupAddress: ftlData.pickupAddress,
            dropAddress: ftlData.dropAddress,
            pickupLatitude: ftlData.pickupLatitude,
            pickupLongitude: ftlData.pickupLongitude,
            dropLatitude: ftlData.dropLatitude,
            orderStatus: ftlData.orderStatus,
            vehcileName: ftlData.vehcileName,
            vehicleImage: ftlData.vehicleImage,
            estimatePrice: ftlData.estimatePrice || 0,
            userId: ftlData.userId,
            orderId: ftlData._id,
            createdAt: ftlData.createdAt,
            dropDistance: drop.distanceInKm,
            dropDuration: drop.duration,
            bidding: bidding
        };

        return res.status(200).json({
            success: true,
            data: result,
            message: "Bidding Fetch Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching bidding details',
            error: error.message
        });
    }
};

const acceptingRequest = async (req, res) => {
    const { requestId, driverId, isAccepted, amount } = req.body;

    // Validate required fields
    if (!requestId || !driverId || typeof isAccepted === 'undefined' || !amount) {
        return res.status(400).json({
            success: false,
            message: 'requestId, isAccepted, driverId, and amount are required',
        });
    }

    try {
        const reqDetail = await FtlPayment.findById(requestId);

        if (!reqDetail) {
            return res.status(404).json({
                success: false,
                message: 'FtlPayment request not found',
            });
        }

        const prePaymentPercentage = reqDetail.prePaymentPercentage || 0;
        const prePayment = (amount * prePaymentPercentage) / 100;
        const postPayment = amount - prePayment;
        // const gst = reqDetail.gst || 0;
        const gst = (amount * reqDetail.gstPercentage) / 100;

        const specialHandling = reqDetail.specialHandling || 0;
        const shippingCost = reqDetail.shippingCost || 0;
        const finalPayment = prePayment + gst + specialHandling + shippingCost;

        // Create Razorpay order
        const razorpayOrderIdResponse = await initiateRazorpayOrderId(req, finalPayment);

        let razorpayOrderId = '';
        if (razorpayOrderIdResponse?.success) {
            razorpayOrderId = razorpayOrderIdResponse.orderId;
        }

        let result = null;

        if (Number(isAccepted) === 1) {
            result = await FtlPayment.findOneAndUpdate(
                { _id: requestId },
                {
                    $set: {
                        isAccepted: 1,
                        driverId,
                        preTransactionId: razorpayOrderId,
                        finalPreTransactionId: 0,
                        postPayment,
                        subTotal: amount,
                        gst: gst,
                        totalPayment: finalPayment
                    }
                },
                { new: true }
            );
        }

        return res.status(200).json({
            success: true,
            data: result,
            message: Number(isAccepted) === 1 ? 'Request accepted successfully' : 'No update performed',
        });

    } catch (error) {
        console.error('Error in acceptingRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};


const ftlIntiatePayment = async (req, res) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(200).json({
                success: false,
                message: 'requestId is required',
            });
        }

        const result = await FtlPayment.findOne({ _id: requestId })
            .populate({ path: 'driverId', select: 'personalInfo vehicleDetail' })
            .lean();
        // console.log(result);
        // process.exit()

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'FTL Payment data not found',
            });
        }

        const driverId = result.driverId?._id;

        // Aggregate to calculate average rating
        const ratingData = await Rating.aggregate([
            { $match: { driverId } },
            {
                $group: {
                    _id: '$driverId',
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const averageRating = ratingData[0]?.avgRating || 0;
        const totalReviews = ratingData[0]?.totalReviews || 0;

        return res.status(200).json({
            success: true,
            data: {
                vehicleName: result.vehcileName || '',
                vehicleImage: result.vehicleImage || '',
                vehicleBodyType: result.vehcileBodyType || '',
                vehicleCapacity: result.vehcileCapacity || '',
                numberPlate: result.driverId?.vehicleDetail?.plateNumber || '',
                pickupAddress: result.pickupAddress || '',
                dropAddress: result.dropAddress || '',
                driverName: result.driverId?.personalInfo?.name || '',
                preTransactionId: result.preTransactionId || '',
                averageRating: parseFloat(averageRating.toFixed(1)),
                subtotal: result.subTotal || 0,
                shippingCost: result.shippingCost || 0,
                specialHandling: result.specialHandling || 0,
                gst: result.gst || 0,
                gstPercentage: 18,
                paymentPercentage: 80,
                totalPayment: result.totalPayment || 0,
                initialPayment: 5678,
                postPayment: 197,
            },
            message: 'FTL Payment details fetched successfully',
        });
    } catch (error) {
        console.error('Error in ftlIntiatePayment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};


const ftlFinalPayment = async (req, res) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'requestId is required',
            });
        }

        const result = await FtlPayment.findOne({ _id: requestId })
            .populate({ path: 'driverId', select: 'personalInfo vehicleDetail' })
            .lean();

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'FTL Payment data not found',
            });
        }

        const driverId = result.driverId?._id;

        // Aggregate to calculate average rating
        const ratingData = await Rating.aggregate([
            { $match: { driverId } },
            {
                $group: {
                    _id: '$driverId',
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const averageRating = ratingData[0]?.avgRating || 0;
        const totalReviews = ratingData[0]?.totalReviews || 0;
        const unloadingFee = 100;
        const finalPaymentAmount = (result.postPayment || 0) + unloadingFee;

        // Initiate Razorpay order
        const razorpayOrderIdResponse = await initiateRazorpayOrderId(req, finalPaymentAmount);

        let razorpayOrderId = '';

        if (razorpayOrderIdResponse?.success) {
            razorpayOrderId = razorpayOrderIdResponse.orderId;

            await FtlPayment.findOneAndUpdate(
                { _id: requestId },
                {
                    $set: {
                        finalPreTransactionId: razorpayOrderId,
                        totalPayment: finalPaymentAmount
                    }
                }
            );
        }

        return res.status(200).json({
            success: true,
            data: {
                vehicleName: result.vehcileName || '',
                vehicleImage: result.vehicleImage || '',
                vehicleBodyType: result.vehcileBodyType || '',
                vehicleCapacity: result.vehcileCapacity || '',
                numberPlate: result.driverId?.vehicleDetail?.plateNumber || '',
                pickupAddress: result.pickupAddress || '',
                dropAddress: result.dropAddress || '',
                driverName: result.driverId?.personalInfo?.name || '',
                finalPreTransactionId: razorpayOrderId,
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalReviews,
                subtotal: result.subTotal || 0,
                shippingCost: result.shippingCost || 0,
                specialHandling: result.specialHandling || 0,
                gst: result.gst || 0,
                gstPercentage: 18,
                paymentPercentage: 80,
                prePayment: result.prePayment || 0,
                postPayment: result.postPayment || 0,
                unloadingFee,
                finalPayment: finalPaymentAmount
            },
            message: 'FTL Payment details fetched successfully',
        });

    } catch (error) {
        console.error('Error in ftlFinalPayment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};


//////////////////////////////FTL Order Initiate///////////////////////////////////

module.exports = { addPaymentDetail, verifyPayment, estimatePriceCalculation, ftlOrderInitiate, ftlVerifyPayment, biddingDetail, acceptingRequest, ftlIntiatePayment, ftlFinalPayment };
