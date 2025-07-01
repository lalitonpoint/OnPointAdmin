const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const FTL = require('../../user/models/ftlPaymentModal');
const Service = require('../../../admin/models/vehicleManagement/serviceManagementModel');
const DriverModal = require('../modals/driverModal');
const { getDriverLocation } = require('./serviceController');
const { getDistanceAndDuration } = require('../utils/distanceCalculate');

const masterDetail = async (req, res) => {

    const serviceId = req.header('serviceid');

    let serviceType = await Service.findById(serviceId).select('value');

    serviceType = serviceType.serviceType;

    try {
        const driverId = req.header('driverid');
        if (!driverId) {
            return res.status(200).json({ success: false, message: "Driver ID is required in headers." });
        }

        const driverData = await DriverModal.findOne({ _id: driverId, status: 1 }).lean();
        const approvalStatus = driverData?.approvalStatus || 0;

        // Get all active/pending requests

        if (serviceType == 1) {
            const pendingRequests = await DriverAssign.find({
                driverId,
                pickupStatus: { $ne: 0 },
                status: { $nin: [4, 5] }
            }).sort({ createdAt: -1 }).populate({ path: 'userId', select: 'fullName' })
                .populate({ path: 'packageId', select: 'packages' });



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
                        serviceType,
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



            // let topHeader = '', bottomHeader = '', buttonText = '', message = '';

            const driverRequestData = await Promise.all(pendingRequests.map(async (request) => {


                const {
                    pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
                    pickupAddress = '', dropAddress = '', assignType, step = 0, userId, _id, status
                } = request;


                const headersByStep = {
                    1: { top: 'Arriving', bottom: 'Way to Pickup', buttonText: 'Arriving to Pickup', message: "Driver Go For Pickup" },
                    2: { top: 'Arrived', bottom: 'Arrived at Pickup Location', buttonText: 'Arrived', message: "Driver Arrived At Pickup Location" },
                    3: { top: 'Start Trip', bottom: assignType == 1 ? 'Way To Warehouse' : 'Way To User Location', buttonText: 'Go Now', message: "Order In Transit" },
                    4: { top: 'Arriving', bottom: assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to Drop-off', buttonText: 'Arriving', message: "Order Out For Delivery" },
                    5: { top: 'Delivered', bottom: 'Delivered', buttonText: 'Delivered', message: "Order Delivered" }
                };

                // switch (status) {
                //     case 0:
                //         topHeader = 'Start Trip';
                //         bottomHeader = 'Way To Pick Up';
                //         buttonText = 'Go Now'
                //         message = "Way To Pick Up";
                //         break;
                //     case 1:
                //         topHeader = 'Arriving';
                //         bottomHeader = 'Way To Pick Up';
                //         buttonText = 'Arriving to Pick Up'
                //         message = "Arriving to Pickup";
                //         break;
                //     case 2:
                //         topHeader = 'Start Trip';
                //         bottomHeader = request.assignType == 1 ? 'Way To Warehouse' : 'Way to Drop-off';
                //         buttonText = 'Go Now'
                //         message = "Order In Transit";
                //         break;
                //     case 3:
                //         topHeader = 'Arriving';
                //         bottomHeader = request.assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                //         buttonText = request.assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                //         message = "Order Out For Delivery";

                //         break;
                //     case 4:
                //         topHeader = 'Deliver';
                //         bottomHeader = request.assignType == 1 ? 'Delivered to Warehouse' : 'Delivered to User';
                //         buttonText = 'Delivered';
                //         message = request.assignType == 1 ? 'Order Delivered To Warehouse' : 'Order Delivered To User Location';
                //         break;
                //     default:
                //         message = 'Order status updated successfully';
                // }


                const pickup = await getDistanceAndDuration(lat, long, pickupLatitude, pickupLongitude);
                const drop = await getDistanceAndDuration(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude);

                const headerData = headersByStep[step] || { top: '', bottom: '', buttonText: '', message: '' };

                return {
                    assignId: _id,
                    topHeader: headerData.top,
                    bottomHeader: headerData.bottom,
                    buttonText: headerData.buttonText,
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
        }
        else {

            const tripHistory = await FTL.find({ driverId, orderStatus: { $in: [4, 5] } });


            const completedCount = tripHistory.filter(trip => trip.status === 4).length;
            const cancelledCount = tripHistory.filter(trip => trip.status === 5).length;


            const pendingRequests = await FTL.find({
                driverId,
                transactionStatus: 1,
                isAccepted: 1,
                orderStatus: { $nin: [0, 4, 5] }
            }).sort({ createdAt: -1 }).populate({ path: 'userId', select: 'fullName' })

            const driverLocation = await getDriverLocation(driverId);
            if (!driverLocation?.lat || !driverLocation?.long) {
                return res.status(500).json({ success: false, message: 'Unable to retrieve driver location' });
            }

            const pickupResult = await getDistanceAndDuration(driverLocation.lat, driverLocation.long, pendingRequests.pickupLatitude, pendingRequests.pickupLongitude);
            const dropResult = await getDistanceAndDuration(pendingRequests.pickupLatitude, pendingRequests.pickupLongitude, pendingRequests.dropLatitude, pendingRequests.dropLongitude);

            const user = pendingRequests.userId;
            const userContact = user ? `${user.countryCode}${user.mobileNumber}` : '';
            const uiMap = {
                0: { topHeader: 'Start Trip', bottomHeader: 'Way To Pickup', buttonText: 'Go Now', message: 'Order Accepted' },
                1: { topHeader: 'Arriving', bottomHeader: 'Arriving', buttonText: 'Arrived to Pickup Location', message: 'Arriving At Pickup Location' },
                2: { topHeader: 'Arrived', bottomHeader: 'Arrived', buttonText: 'Start Loading', message: 'Arrived At Pickup Location' },
                3: { topHeader: 'Start Loading', bottomHeader: 'Loading... ', buttonText: 'Loading Complete', message: 'Start Loading' },
                4: { topHeader: 'Start Trip', bottomHeader: 'Way To Drop Location', buttonText: 'Go Now', message: 'Way to Drop Location' },
                5: { topHeader: 'Arriving', bottomHeader: 'Arriving', buttonText: 'Arrived at Drop Location', message: 'Arrived at Drop Location' },
                6: { topHeader: 'Start Unloading', bottomHeader: 'Unload', buttonText: 'Start Unloading', message: 'Start Unloading' },
                7: { topHeader: 'Unloading', bottomHeader: 'Unloading', buttonText: 'Mark Delivered', message: 'Unloading Complete' },
                8: { topHeader: 'Confirm Delivery', bottomHeader: 'POD', buttonText: 'Submit', message: 'Accepting Pod' },
                9: { topHeader: 'Delivered', bottomHeader: 'Delivered', buttonText: 'Delivered at User Location', message: 'Delivered at User Location' },
            };

            const ui = uiMap[step] || { message: 'Order status updated successfully' };


            pendingRequests = {
                topHeader: ui.topHeader,
                bottomHeader: ui.bottomHeader,
                buttonText: ui.buttonText,
                pickupDistance: pickupResult?.distanceInKm || 0,
                pickupDuration: pickupResult?.duration || 'N/A',
                dropDistance: dropResult?.distanceInKm || 0,
                dropDuration: dropResult?.duration || 'N/A',
                userName: user?.fullName || '',
                userId: user?._id || '',
                userContact,
                pickupAddress: pendingRequests.pickupAddress,
                dropAddress: pendingRequests.dropAddress,
                pickupLatitude: pendingRequests.pickupLatitude,
                pickupLongitude: pendingRequests.pickupLongitude,
                dropLatitude: pendingRequests.dropLatitude,
                dropLongitude: pendingRequests.dropLongitude,
                totalPayment: pendingRequests.totalPayment,
                step,
                orderStatus: pendingRequests.orderStatus,
                vehicleName: pendingRequests.vehicleName,
                vehicleImage: pendingRequests.vehicleImage,
                vehicleBodyType: pendingRequests.vehicleBodyType,
            }

        }

        res.status(200).json({
            success: true,
            message: 'Master Data',
            data: {
                driverApprovalStatus: approvalStatus,
                pendingRequest: driverRequestData.length || 0,
                assignId: driverRequestData[0]?.assignId || '',
                serviceType,
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
