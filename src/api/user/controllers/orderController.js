const Order = require('../../../api/user/models/paymentModal');
const driverPackageAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const driverModal = require('../../driver/modals/driverModal');

const getOrderList = async (req, res) => {
    const { transactionStatus } = req.body;

    if (transactionStatus != 0 && transactionStatus != 1) {
        return res.status(200).json({ success: false, message: "Transaction Status is required." });
    }

    try {
        let orderDetail;

        if (transactionStatus === 0 || transactionStatus === 1) {
            orderDetail = await Order.find({ transactionStatus }).sort({ createdAt: -1 });
        } else {
            orderDetail = await Order.find().sort({ createdAt: -1 });
        }

        let orderData = [];

        for (const singleOrder of orderDetail) {
            const existingTracking = await driverPackageAssign.findOne({ _id: singleOrder._id }).sort({ createdAt: -1 });

            let driverDetail = null;
            if (existingTracking && existingTracking.driverId) {
                driverDetail = await driverModal.findById(existingTracking.driverId);
            }

            let packageName = "";
            if (singleOrder.packages && Array.isArray(singleOrder.packages)) {
                packageName = singleOrder.packages
                    .map(pkg => pkg.packageName)
                    .filter(Boolean)
                    .join(', ');
            }

            const data = {
                packageId: singleOrder._id,
                packageName: packageName,
                orderStatus: singleOrder.orderStatus,
                pickupAddress: singleOrder.pickupAddress,
                dropAddress: singleOrder.dropAddress,
                totalDistance: singleOrder.totalDistance,
                duration: singleOrder.duration,
                pickupLatitude: singleOrder.pickupLatitude,
                pickupLongitude: singleOrder.pickupLongitude,
                dropLatitude: singleOrder.dropLatitude,
                dropLongitude: singleOrder.dropLongitude,
                driverName: driverDetail?.personalInfo?.name || '',
                driverProfile: driverDetail?.personalInfo?.profilePicture || '',
                truckNumber: driverDetail?.vehicleDetail?.truckNumber || '', // Corrected key
            };

            orderData.push(data);
        }

        res.status(200).json({
            success: true,
            data: orderData
        });

    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

const singleOrderDetail = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(200).json({
            success: false,
            message: 'orderId is required'
        });
    }

    try {
        const order = await Order.findOne({ orderId }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(200).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { order }
        });
    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};


module.exports = { getOrderList, singleOrderDetail };
