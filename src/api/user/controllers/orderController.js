const Order = require('../../../api/user/models/paymentModal');
const driverPackageAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const driverModal = require('../../driver/modals/driverModal');

const getOrderList = async (req, res) => {
    const userId = req.headers['userid'];

    try {
        const [allOrders, completeOrders, cancelledOrders] = await Promise.all([
            Order.find({ userId }).sort({ createdAt: -1 }).lean(),
            Order.find({ userId, orderStatus: 4 }).sort({ createdAt: -1 }).lean(),
            Order.find({ userId, orderStatus: 5 }).sort({ createdAt: -1 }).lean()
        ]);

        const transformOrders = async (orders) => {
            return Promise.all(
                orders.map(async (order) => {
                    const tracking = await driverPackageAssign
                        .findOne({ packageId: order._id })
                        .sort({ createdAt: -1 })
                        .lean();

                    let driver = null;
                    if (tracking?.driverId) {
                        driver = await driverModal.findById(tracking.driverId).lean();
                    }

                    const packages = Array.isArray(order.packages) ? order.packages : [];
                    const packageName = packages.map(p => p.packageName).filter(Boolean).join(', ');

                    return {
                        ...order,
                        packageId: order._id,
                        packageName,
                        driverName: driver?.personalInfo?.name || '',
                        driverProfile: driver?.personalInfo?.profilePicture || '',
                        vehicleNumber: driver?.vehicleDetail?.truckNumber || ''
                    };
                })
            );
        };

        const [allOrderData, completeOrderData, cancelledOrderData] = await Promise.all([
            transformOrders(allOrders),
            transformOrders(completeOrders),
            transformOrders(cancelledOrders)
        ]);

        res.status(200).json({
            success: true,
            data: { allOrderData, completeOrderData, cancelledOrderData }
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
