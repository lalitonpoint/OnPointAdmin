const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const DriverModal = require('../../../api/driver/modals/driverModal');
const { getDriverLocation } = require('./serviceController');
const { getDistanceAndDuration } = require('../utils/distanceCalculate');

const masterDetail = async (req, res) => {
    const isPtl = 1;

    try {
        const driverId = req.header('driverid');
        if (!driverId) {
            return res.status(200).json({ success: false, message: "Driver ID is required in headers." });
        }

        // Find latest active request
        const pendingRequest = await DriverAssign.findOne({
            driverId,
            pickupStatus: { $ne: 0 },
            status: { $nin: [4, 5] }
        }).sort({ createdAt: -1 })
            .populate({ path: 'userId', select: 'fullName' });

        const tripHistory = await DriverAssign.find({ driverId, status: { $in: [4, 5] } });

        const completedCount = tripHistory.filter(trip => trip.status === 4).length;
        const cancelledCount = tripHistory.filter(trip => trip.status === 5).length;

        const driverData = await DriverModal.findOne({ _id: driverId, status: 1 }).lean();
        const approvalStatus = driverData?.approvalStatus || 0;


        if (!pendingRequest) {
            return res.status(200).json({
                success: true,
                message: 'No pending requests',
                data: {
                    driverApprovalStatus: approvalStatus,
                    pendingRequest: 0,
                    assignId: '',
                    isPtl,
                    isWallet: 0,
                    request: {},
                    tripCount: {
                        completedCount,
                        cancelledCount
                    }
                }
            });
        }

        const driverLocation = await getDriverLocation(driverId);
        if (!driverLocation.success) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }

        const { lat, long } = driverLocation;
        const { pickupLatitude, pickupLongitude, dropLatitude = '', dropLongitude = '', pickupAddress = '', userId, assignType, step = 0 } = pendingRequest;

        const { distanceInKm: pickupDistance, duration: pickupDuration } =
            await getDistanceAndDuration(lat, long, pickupLatitude, pickupLongitude);

        const headersByStep = {
            1: { top: 'Arriving', bottom: 'Way to Pickup', buttonText: 'Arriving to Pickup', message: "Driver Go For Pickup" },
            2: { top: 'Arrived', bottom: 'Arrived at Pickup Location', buttonText: 'Arrived', message: "Driver Arrived At Pickup Location" },
            3: { top: 'Start', bottom: assignType == 1 ? 'Way To Warehouse' : 'Way to Drop-off', buttonText: 'Go Now', message: "Order In Transit" },
            4: { top: 'Arriving', bottom: assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location', buttonText: assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location', message: "Order Out For Delivery" },
            5: { top: 'Delivered', bottom: assignType == 1 ? 'Delivered to Warehouse' : 'Delivered to User', buttonText: 'Delivered', message: assignType == 1 ? 'Order Delivered To Warehouse' : 'Order Delivered To User Location' }
        };

        const headerData = headersByStep[step] || { top: '', bottom: '', message: '' };

        const driverRequestData = {
            topHeader: headerData.top,
            bottomHeader: headerData.bottom,
            buttonText: headerData.buttonText,
            pickupDistance,
            pickupDuration,
            userName: userId?.fullName || 'N/A',
            pickupAddress: pendingRequest.pickupAddress,
            dropAddress: pendingRequest.dropAddress,
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            step,
            assignType: pendingRequest.assignType,

        };


        res.status(200).json({
            success: true,
            message: 'Master Data',
            data: {
                driverApprovalStatus: approvalStatus,
                pendingRequest: 1,
                assignId: pendingRequest._id,
                isPtl,
                isWallet: 0,

                request: driverRequestData,
                tripCount: {
                    completedCount,
                    cancelledCount
                }
            }
        });

    } catch (error) {
        console.error("Error in masterDetail:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

module.exports = { masterDetail };
