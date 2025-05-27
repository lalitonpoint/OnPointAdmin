const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const DriverModal = require('../modals/driverModal');
const { getDriverLocation } = require('./serviceController');
const { getDistanceAndDuration } = require('../utils/distanceCalculate');

const masterDetail = async (req, res) => {
    const isPtl = 1;

    try {
        const driverId = req.header('driverid');
        if (!driverId) {
            return res.status(400).json({ success: false, message: "Driver ID is required in headers." });
        }

        const driverData = await DriverModal.findOne({ _id: driverId, status: 1 }).lean();
        const approvalStatus = driverData?.approvalStatus || 0;

        // Get all active/pending requests
        const pendingRequests = await DriverAssign.find({
            driverId,
            pickupStatus: { $ne: 0 },
            status: { $nin: [4, 5] }
        }).sort({ createdAt: -1 }).populate({ path: 'userId', select: 'fullName' })
            .populate({ path: 'packageId', select: 'packages' });;

        const tripHistory = await DriverAssign.find({ driverId, status: { $in: [4, 5] } });
        const completedCount = tripHistory.filter(trip => trip.status === 4).length;
        const cancelledCount = tripHistory.filter(trip => trip.status === 5).length;

        if (!pendingRequests.length) {
            return res.status(200).json({
                success: true,
                message: 'No pending requests',
                data: {
                    driverApprovalStatus: approvalStatus,
                    pendingRequest: 0,
                    assignId: '',
                    isPtl,
                    isWallet: 0,
                    request: [],
                    tripCount: { completedCount, cancelledCount }
                }
            });
        }

        // Get driver's live location
        const driverLocation = await getDriverLocation(driverId);
        if (!driverLocation.success) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }
        const { lat, long } = driverLocation;

        const headersByStep = {
            1: { top: 'Arriving', bottom: 'Way to Pickup', buttonText: 'Arriving to Pickup', message: "Driver Go For Pickup" },
            2: { top: 'Arrived', bottom: 'Arrived at Pickup Location', buttonText: 'Arrived', message: "Driver Arrived At Pickup Location" },
            3: { top: 'Start', bottom: 'Way To Destination', buttonText: 'Go Now', message: "Order In Transit" },
            4: { top: 'Arriving', bottom: 'Arriving to Drop-off', buttonText: 'Arriving', message: "Order Out For Delivery" },
            5: { top: 'Delivered', bottom: 'Delivered', buttonText: 'Delivered', message: "Order Delivered" }
        };

        let topHeader = '', bottomHeader = '', buttonText = '', message = '';

        const driverRequestData = await Promise.all(pendingRequests.map(async (request) => {
            const {
                pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
                pickupAddress = '', dropAddress = '', assignType, step = 0, userId, _id, status
            } = request;



            switch (status) {
                case 2:
                    topHeader = 'Start';
                    bottomHeader = request.assignType == 1 ? 'Way To Warehouse' : 'Way to Drop-off';
                    buttonText = 'Go Now'
                    message = "Order In Transit";
                    break;
                case 3:
                    topHeader = 'Arriving';
                    bottomHeader = request.assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                    buttonText = request.assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                    message = "Order Out For Delivery";

                    break;
                case 4:
                    topHeader = 'Deliver';
                    bottomHeader = request.assignType == 1 ? 'Delivered to Warehouse' : 'Delivered to User';
                    buttonText = 'Delivered';
                    message = request.assignType == 1 ? 'Order Delivered To Warehouse' : 'Order Delivered To User Location';
                    break;
                default:
                    message = 'Order status updated successfully';
            }


            const pickup = await getDistanceAndDuration(lat, long, pickupLatitude, pickupLongitude);
            const drop = await getDistanceAndDuration(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude);

            const headerData = headersByStep[step] || { top: '', bottom: '', buttonText: '', message: '' };

            return {
                assignId: _id,
                topHeader: topHeader,
                bottomHeader: bottomHeader,
                buttonText: buttonText,
                pickupDistance: pickup.distanceInKm,
                pickupDuration: pickup.duration,
                dropDistance: drop.distanceInKm,
                dropDuration: drop.duration,
                userName: userId?.fullName || 'N/A',
                userId: userId?._id || 'N/A',
                pickupAddress,
                dropAddress,
                pickupLatitude,
                pickupLongitude,
                dropLatitude,
                dropLongitude,
                step,
                assignType,
                status,
                packageName: await request.packageId?.packages
                    ?.map(p => p.packageName)
                    ?.filter(Boolean)
                    ?.join(', ') || ''

            };
        }));

        res.status(200).json({
            success: true,
            message: 'Master Data',
            data: {
                driverApprovalStatus: approvalStatus,
                pendingRequest: driverRequestData.length,
                assignId: driverRequestData[0]?.assignId || '',
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
