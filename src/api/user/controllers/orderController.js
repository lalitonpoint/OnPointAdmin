const Order = require('../../../api/user/models/paymentModal');
const driverPackageAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const driverModal = require('../../driver/modals/driverModal');
const FTL = require('../models/ftlPaymentModal');


// const getOrderList = async (req, res) => {
//     const userId = req.headers['userid'];

//     try {
//         const [allOrders, completeOrders, cancelledOrders] = await Promise.all([
//             Order.find({ userId }).sort({ createdAt: -1 }).lean(),
//             Order.find({ userId, orderStatus: 4 }).sort({ createdAt: -1 }).lean(),
//             Order.find({ userId, orderStatus: 5 }).sort({ createdAt: -1 }).lean()
//         ]);

//         const transformOrders = async (orders) => {
//             return Promise.all(
//                 orders.map(async (order) => {
//                     const tracking = await driverPackageAssign
//                         .findOne({ packageId: order._id })
//                         .sort({ createdAt: -1 }).populate({ path: 'driverId', select: 'personalInfo' })
//                         .lean();

//                     let driver = tracking.driverId.personalInfo;


//                     const packages = Array.isArray(order.packages) ? order.packages : [];
//                     const packageName = packages.map(p => p.packageName).filter(Boolean).join(', ');

//                     return {
//                         ...order,
//                         packageId: order._id,
//                         packageName,
//                         driverId: driver?._id,
//                         driverName: driver?.name || '',
//                         driverContact: driver?.mobile || '',
//                         driverProfile: driver?.profilePicture || '',
//                         vehicleNumber: driver?.vehicleDetail?.truckNumber || ''
//                     };
//                 })
//             );
//         };

//         const [allOrderData, completeOrderData, cancelledOrderData] = await Promise.all([
//             transformOrders(allOrders),
//             transformOrders(completeOrders),
//             transformOrders(cancelledOrders)
//         ]);

//         res.status(200).json({
//             success: true,
//             data: { allOrderData, completeOrderData, cancelledOrderData }
//         });

//     } catch (err) {
//         console.error('Error fetching Order Detail:', err);
//         res.status(500).json({ success: false, message: 'Server Error', error: err.message });
//     }
// };

const getOrderList = async (req, res) => {
    const userId = req.headers['userid'];



    try {
        const orders = await Order.find({ userId, transactionStatus: 1 }).sort({ createdAt: -1 }).lean();

        if (!orders.length) {
            return res.status(200).json({
                success: true,
                data: {
                    allOrderData: [],
                    completeOrderData: [],
                    cancelledOrderData: []
                }
            });
        }

        const orderIds = orders.map(order => order._id);

        const assignments = await driverPackageAssign.find({
            packageId: { $in: orderIds }
        })
            .sort({ createdAt: 1 })
            .populate({ path: 'driverId', select: 'personalInfo vehicleDetail' })
            // .populate({ path: 'warehouseId', select: 'Warehousename' }) // For orderStatus
            .lean();

        // Group all assignments by packageId
        const assignmentsMap = new Map();
        const statusMap = new Map();

        for (const assign of assignments) {
            const idStr = assign.packageId.toString();

            // Keep latest assignment only
            if (!assignmentsMap.has(idStr)) {
                assignmentsMap.set(idStr, assign);
            }

            // Store all status=4 for buildOrderStatus
            if (assign.status === 4) {
                if (!statusMap.has(idStr)) {
                    statusMap.set(idStr, []);
                }
                statusMap.get(idStr).push(assign);
            }
        }

        // Build order status steps from cached statusMap
        const buildOrderStatus = (trackingIdStr) => {
            const orderDetails = statusMap.get(trackingIdStr) || [];
            const steps = [];

            for (let i = 0; i < orderDetails.length; i++) {
                const detail = orderDetails[i];
                const label = detail.assignType == 2
                    ? 'Delivered'
                    : ('Warehouse');

                if (i === 0) {
                    steps.push({ orderStatus: 'Pick Up', Address: detail.pickupAddress });
                }
                steps.push({ orderStatus: label, Address: detail.dropAddress });
            }

            return steps;
        };

        // Transform all orders
        const transformOrders = (ordersToTransform) => {
            return ordersToTransform.map((order) => {
                const idStr = order._id.toString();
                const tracking = assignmentsMap.get(idStr);
                const driver = tracking?.driverId || {};
                const packages = Array.isArray(order.packages) ? order.packages : [];

                const packageName = packages.map(p => p.packageName).filter(Boolean).join(', ');
                const orderStatus = tracking ? buildOrderStatus(tracking.packageId.toString()) : [];
                // console.log('456789p[', order)
                // process.exit()
                return {
                    ...order,
                    packageId: order._id,
                    packageName,
                    driverId: driver._id || '',
                    driverName: driver.personalInfo?.name || '',
                    driverContact: driver.personalInfo?.mobile || '',
                    driverProfile: driver.personalInfo?.profilePicture || '',
                    vehicleNumber: driver.vehicleDetail?.truckNumber || '',
                    orderTracking: orderStatus
                };
            });
        };

        const allOrderData = transformOrders(orders);
        const completeOrderData = transformOrders(orders.filter(o => o.orderStatus === 4));
        const cancelledOrderData = transformOrders(orders.filter(o => o.orderStatus === 5));

        res.status(200).json({
            success: true,
            data: {
                allOrderData,
                completeOrderData,
                cancelledOrderData
            },
            message: 'My Order Fetch Successfully'
        });

    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
const singleOrderDetail = async (req, res) => {
    const { packageid } = req.body;

    if (!packageid) {
        return res.status(400).json({
            success: false,
            message: 'packageid is required'
        });
    }

    try {
        const order = await Order.findById(packageid).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // 🔍 Fetch all assignments for building orderTracking
        const allAssignments = await driverPackageAssign.find({
            packageId: packageid
        })
            .sort({ createdAt: 1 })
            .populate({ path: 'driverId', select: 'personalInfo vehicleDetail' })
            .lean();

        // ✅ Get latest assignment for driver info
        const latestAssignment = allAssignments[allAssignments.length - 1] || null;
        const driver = latestAssignment?.driverId || {};

        // 🧠 Build orderTracking steps
        const buildOrderStatus = (assignmentList) => {
            const steps = [];

            assignmentList.forEach((detail, index) => {
                if (index === 0) {
                    steps.push({
                        orderStatus: 'Pick Up',
                        address: detail.pickupAddress || '',
                        dateTime: detail.createdAt || null
                    });
                }

                const label = detail.assignType === 2 ? 'Delivered' : 'Warehouse';

                steps.push({
                    orderStatus: label,
                    address: detail.dropAddress || '',
                    dateTime: detail.createdAt || null
                });
            });

            return steps;
        };

        const orderTracking = buildOrderStatus(allAssignments);

        const packages = Array.isArray(order.packages) ? order.packages : [];
        const packageName = packages.map(p => p.packageName).filter(Boolean).join(', ');

        const enrichedOrder = {
            ...order,
            packageId: order._id,
            packageName,
            driverId: driver._id || '',
            driverName: driver.personalInfo?.name || '',
            driverContact: driver.personalInfo?.mobile || '',
            driverProfile: driver.personalInfo?.profilePicture || '',
            vehicleNumber: driver.vehicleDetail?.truckNumber || '',
            orderTracking
        };

        return res.status(200).json({
            success: true,
            data: enrichedOrder
        });

    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

const ftlOrderCancel = async (req, res) => {
    const { status, requestId } = req.body;

    // Validate inputs
    if (status != 5 || !requestId) {
        return res.status(200).json({
            success: false,
            message: 'requestId is required and status must be 5',
        });
    }

    try {
        // Find the latest order by requestId (assuming orderId === requestId or adjust accordingly)
        const order = await FTL.findOne({ _id: requestId }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(200).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Update the FtlPayment status to 5 (cancelled)
        const result = await FTL.findOneAndUpdate(
            { _id: requestId },
            { $set: { orderStatus: 5 } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Order Cancel Successfully"
        });
    } catch (err) {
        console.error('Error processing order cancel:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message,
        });
    }
};


const ftlOrderList = async (req, res) => {
    const userId = req.headers['userid'];

    const transformOrders = (orders) => {
        return orders.map((order) => {
            const driver = order?.driverId || {};
            return {
                requestId: order._id?.toString() || '',
                vehicleName: order.vehicleName || '',
                vehicleImage: order.vehicleImage || '',
                vehicleBodyType: order.vehicleBodyType || '',
                orderId: order.orderId || '',

                pickupAddress: order.pickupAddress || '',
                dropAddress: order.dropAddress || '',
                pickupLatitude: order.pickupLatitude || '',
                pickupLongitude: order.pickupLongitude || '',
                dropLatitude: order.dropLatitude || '',
                dropLongitude: order.dropLongitude || '',
                orderStatus: order.orderStatus || 0,
                distance: order.distance ? order.distance.toString() : '',
                duration: order.duration || '',
                orderDate: order.createdAt || '',

                driverId: driver._id || '',
                driverName: driver.personalInfo?.name || '',
                driverContact: driver.personalInfo?.mobile || '',
                driverProfile: driver.personalInfo?.profilePicture || '',
                vehicleNumber: driver.vehicleDetail?.truckNumber || '',

                isBidding: order.isBidding || 0,
                isPartialPayment: order.isPartialPayment || 0,
                unloadingTime: order.unloadingTime || '',
            };
        });
    };

    try {
        const orders = await FTL.find({
            userId,
            transactionStatus: 1,
            // driverId: { $ne: null }
        })
            .populate({
                path: 'driverId',
                select: 'personalInfo vehicleDetail'
            })
            .sort({ createdAt: -1 })
            .lean();

        const allOrderData = transformOrders(orders);
        const completeOrderData = transformOrders(orders.filter(o => o.orderStatus === 4));
        const cancelledOrderData = transformOrders(orders.filter(o => o.orderStatus === 5));

        return res.status(200).json({
            success: true,
            message: 'My Order Fetch Successfully',
            data: {
                allOrderData,
                completeOrderData,
                cancelledOrderData
            }
        });

    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};


const ftlSingleOrderDetail = async (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(200).json({
            success: false,
            message: 'requestId is required'
        });
    }

    try {
        const order = await FTL.findById(requestId)
            .populate({
                path: 'driverId',
                select: 'personalInfo vehicleDetail'
            })
            .lean();

        if (!order) {
            return res.status(200).json({
                success: false,
                message: 'Order not found'
            });
        }

        const driver = order.driverId || {};

        return res.status(200).json({
            success: true,
            data: {
                requestId: order._id?.toString() || '',
                vehicleName: order.vehicleName || '',
                vehicleImage: order.vehicleImage || '',
                vehicleBodyType: order.vehicleBodyType || '',
                orderId: order.orderId || 0,

                pickupAddress: order.pickupAddress || '',
                dropAddress: order.dropAddress || '',
                pickupLatitude: order.pickupLatitude || '',
                pickupLongitude: order.pickupLongitude || '',
                dropLatitude: order.dropLatitude || '',
                dropLongitude: order.dropLongitude || '',
                orderStatus: order.orderStatus,
                distance: order.distance || '',
                duration: order.duration || '',
                orderDate: order.createdAt || '',

                driverId: driver._id || '',
                driverName: driver.personalInfo?.name || '',
                driverContact: driver.personalInfo?.mobile || '',
                driverProfile: driver.personalInfo?.profilePicture || '',
                vehicleNumber: driver.vehicleDetail?.truckNumber || '',

                isBidding: order.isBidding || 0,
                isPartialPayment: order.isPartialPayment || 0,
                unloadingTime: order.unloadingTime || '',
            }
        });

    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};



module.exports = { getOrderList, singleOrderDetail, ftlOrderCancel, ftlOrderList, ftlSingleOrderDetail };
