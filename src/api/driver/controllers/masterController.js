const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const FTL = require('../../user/models/ftlPaymentModal');
const Service = require('../../../admin/models/vehcileManagement/serviceManagementModel');
const DriverModal = require('../modals/driverModal');
const { getDriverLocation } = require('./serviceController');
const { getDistanceAndDuration } = require('../utils/distanceCalculate');

const masterDetail = async (req, res) => {
    try {
        const serviceId = req.header('serviceid');
        const driverId = req.header('driverid');
        if (!driverId) return res.status(200).json({ success: false, message: "Driver ID is required in headers." });

        const [serviceDoc, driverData] = await Promise.all([
            Service.findById(serviceId).select('serviceType'),
            DriverModal.findOne({ _id: driverId, status: 1 }).lean()
        ]);

        const serviceType = serviceDoc?.serviceType;
        const approvalStatus = driverData?.approvalStatus || 0;

        const driverLocation = await getDriverLocation(driverId);
        if (!driverLocation?.lat || !driverLocation?.long) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }

        const { lat, long } = driverLocation;
        let responsePayload = {};
        let completedCount = 0; let cancelledCount = 0
        if (serviceType == 1) {
            // PTL Logic
            const [pendingRequests, tripHistory] = await Promise.all([
                DriverAssign.find({
                    driverId,
                    pickupStatus: { $ne: 0 },
                    status: { $nin: [4, 5] }
                }).sort({ createdAt: -1 })
                    .populate({ path: 'userId', select: 'fullName' })
                    .populate({ path: 'packageId', select: 'packages' }),

                DriverAssign.find({ driverId, status: { $in: [4, 5] } })
            ]);

            completedCount = tripHistory.filter(trip => trip.status === 4).length;
            cancelledCount = tripHistory.filter(trip => trip.status === 5).length;

            if (!pendingRequests.length) {
                return res.status(200).json({
                    success: true,
                    message: 'No pending requests',
                    data: {
                        driverApprovalStatus: approvalStatus,
                        pendingRequest: 0,
                        assignId: '',
                        serviceType,
                        isWallet: serviceType == 1 ? 0 : 1,
                        request: [],

                        tripCount: { completedCount, cancelledCount }
                    }
                });
            }

            const headersByStep = {
                1: { top: 'Arriving', bottom: 'Way to Pickup', buttonText: 'Arriving to Pickup', message: "Driver Go For Pickup" },
                2: { top: 'Arrived', bottom: 'Arrived at Pickup Location', buttonText: 'Arrived', message: "Driver Arrived At Pickup Location" },
                3: { top: 'Start Trip', bottom: 'Way To Drop', buttonText: 'Go Now', message: "Order In Transit" },
                4: { top: 'Arriving', bottom: 'Arriving to Drop-off', buttonText: 'Arriving', message: "Order Out For Delivery" },
                5: { top: 'Delivered', bottom: 'Delivered', buttonText: 'Delivered', message: "Order Delivered" }
            };

            const requestData = await Promise.all(pendingRequests.map(async (request) => {
                const {
                    pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
                    pickupAddress = '', dropAddress = '', assignType, step = 0, userId, _id, status, packageId
                } = request;

                const pickup = await getDistanceAndDuration(lat, long, pickupLatitude, pickupLongitude);
                const drop = await getDistanceAndDuration(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude);

                const header = headersByStep[step] || {};

                return {
                    assignId: _id,
                    topHeader: header.top,
                    bottomHeader: header.bottom,
                    buttonText: header.buttonText,
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
                    packageName: packageId?.packages?.map(p => p.packageName).filter(Boolean).join(', ') || ''
                };
            }));

            responsePayload = {
                driverApprovalStatus: approvalStatus,
                pendingRequest: requestData.length,
                assignId: requestData[0]?.assignId || '',
                serviceType,
                isWallet: serviceType == 1 ? 0 : 1,
                request: requestData,
                tripCount: { completedCount, cancelledCount }
            };

        } else {
            // FTL Logic
            // const tripHistory = await FTL.find({ driverId, orderStatus: { $in: [4, 5] } });


            // completedCount = tripHistory.filter(trip => trip.orderStatus === 4).length;
            // cancelledCount = tripHistory.filter(trip => trip.orderStatus === 5).length;


            // const pendingRequest = await FTL.find({
            //     driverId,
            //     transactionStatus: 1,
            //     isAccepted: 1,
            //     orderStatus: { $nin: [4, 5] }
            // }).sort({ createdAt: -1 }).populate({ path: 'userId', select: 'fullName mobileNumber countryCode' });

            // if (!pendingRequest) {
            //     return res.status(200).json({
            //         success: true,
            //         message: 'No pending requests',
            //         data: {
            //             driverApprovalStatus: approvalStatus,
            //             pendingRequest: 0,
            //             assignId: '',
            //             serviceType,
            //             isWallet: 0,
            //             request: [],

            //             tripCount: { completedCount, cancelledCount }
            //         }
            //     });
            // }

            // const {
            //     pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
            //     pickupAddress, dropAddress, totalPayment,
            //     step = 0, orderStatus, vehicleName, vehicleImage, vehicleBodyType,
            //     userId
            // } = pendingRequest;

            // const pickupResult = await getDistanceAndDuration(lat, long, pickupLatitude, pickupLongitude);
            // const dropResult = await getDistanceAndDuration(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude);

            // const uiMap = {
            //     0: { topHeader: 'Start Trip', bottomHeader: 'Way To Pickup', buttonText: 'Go Now' },
            //     1: { topHeader: 'Arriving', bottomHeader: 'Arriving', buttonText: 'Arrived to Pickup Location' },
            //     2: { topHeader: 'Arrived', bottomHeader: 'Arrived', buttonText: 'Start Loading' },
            //     3: { topHeader: 'Start Loading', bottomHeader: 'Loading... ', buttonText: 'Loading Complete' },
            //     4: { topHeader: 'Start Trip', bottomHeader: 'Way To Drop Location', buttonText: 'Go Now' },
            //     5: { topHeader: 'Arriving', bottomHeader: 'Arriving', buttonText: 'Arrived at Drop Location' },
            //     6: { topHeader: 'Start Unloading', bottomHeader: 'Unload', buttonText: 'Start Unloading' },
            //     7: { topHeader: 'Unloading', bottomHeader: 'Unloading', buttonText: 'Mark Delivered' },
            //     8: { topHeader: 'Confirm Delivery', bottomHeader: 'POD', buttonText: 'Submit' },
            //     9: { topHeader: 'Delivered', bottomHeader: 'Delivered', buttonText: 'Delivered at User Location' },
            // };

            // const ui = uiMap[step] || {};

            // responsePayload = {
            //     driverApprovalStatus: approvalStatus,
            //     pendingRequest: 1,
            //     assignId: pendingRequest._id,
            //     serviceType,
            //     isWallet: 0,
            //     request: [{
            //         topHeader: ui.topHeader,
            //         bottomHeader: ui.bottomHeader,
            //         buttonText: ui.buttonText,
            //         pickupDistance: pickupResult?.distanceInKm || 0,
            //         pickupDuration: pickupResult?.duration || 'N/A',
            //         dropDistance: dropResult?.distanceInKm || 0,
            //         dropDuration: dropResult?.duration || 'N/A',
            //         userName: userId?.fullName || '',
            //         userId: userId?._id || '',
            //         userContact: `${userId?.countryCode || ''}${userId?.mobileNumber || ''}`,
            //         pickupAddress,
            //         dropAddress,
            //         pickupLatitude,
            //         pickupLongitude,
            //         dropLatitude,
            //         dropLongitude,
            //         totalPayment,
            //         step,
            //         orderStatus,
            //         vehicleName,
            //         vehicleImage,
            //         vehicleBodyType,
            //         requestId: pendingRequest?._id || '',
            //     }],
            //     tripCount: { completedCount, cancelledCount }
            // };

            const [pendingRequests, tripHistory] = await Promise.all([
                FTL.find({
                    driverId,
                    transactionStatus: 1,
                    isAccepted: 1,
                    orderStatus: { $nin: [4, 5] }
                }).sort({ createdAt: -1 }).populate({
                    path: 'userId',
                    select: 'fullName mobileNumber countryCode'
                }),
                FTL.find({
                    driverId,
                    orderStatus: { $in: [4, 5] }
                })
            ]);

            completedCount = tripHistory.filter(trip => trip.orderStatus === 4).length;
            cancelledCount = tripHistory.filter(trip => trip.orderStatus === 5).length;

            if (!pendingRequests || pendingRequests.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No pending requests',
                    data: {
                        driverApprovalStatus: approvalStatus,
                        pendingRequest: 0,
                        assignId: '',
                        serviceType,
                        isWallet: serviceType == 1 ? 0 : 1,
                        request: [],
                        tripCount: { completedCount, cancelledCount }
                    }
                });
            }

            // UI Map per step
            const uiMap = {
                0: { topHeader: 'Start Trip', bottomHeader: 'Way To Pickup', buttonText: 'Go Now' },
                1: { topHeader: 'Arriving', bottomHeader: 'Arriving', buttonText: 'Arrived to Pickup Location' },
                2: { topHeader: 'Arrived', bottomHeader: 'Arrived', buttonText: 'Start Loading' },
                3: { topHeader: 'Start Loading', bottomHeader: 'Loading...', buttonText: 'Loading Complete' },
                4: { topHeader: 'Start Trip', bottomHeader: 'Way To Drop Location', buttonText: 'Go Now' },
                5: { topHeader: 'Arriving', bottomHeader: 'Arriving', buttonText: 'Arrived at Drop Location' },
                6: { topHeader: 'Start Unloading', bottomHeader: 'Unload', buttonText: 'Start Unloading' },
                7: { topHeader: 'Unloading', bottomHeader: 'Unloading', buttonText: 'Mark Delivered' },
                8: { topHeader: 'Confirm Delivery', bottomHeader: 'POD', buttonText: 'Submit' },
                9: { topHeader: 'Delivered', bottomHeader: 'Delivered', buttonText: 'Delivered at User Location' }
            };

            // Map each request and calculate distances
            const requestData = await Promise.all(pendingRequests.map(async (request) => {
                const {
                    pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
                    pickupAddress = '', dropAddress = '', totalPayment = 0,
                    step = 0, orderStatus = 0, vehicleName, vehicleImage, vehicleBodyType,
                    userId = {}, _id
                } = request;

                const [pickupResult, dropResult] = await Promise.all([
                    getDistanceAndDuration(lat, long, pickupLatitude, pickupLongitude),
                    getDistanceAndDuration(pickupLatitude, pickupLongitude, dropLatitude, dropLongitude)
                ]);

                const ui = uiMap[step] || {};

                return {
                    requestId: _id,
                    topHeader: ui.topHeader,
                    bottomHeader: ui.bottomHeader,
                    buttonText: ui.buttonText,
                    pickupDistance: pickupResult?.distanceInKm || 0,
                    pickupDuration: pickupResult?.duration || 'N/A',
                    dropDistance: dropResult?.distanceInKm || 0,
                    dropDuration: dropResult?.duration || 'N/A',
                    userName: userId.fullName || '',
                    userId: userId._id || '',
                    userContact: `${userId.countryCode || ''}${userId.mobileNumber || ''}`,
                    pickupAddress,
                    dropAddress,
                    pickupLatitude,
                    pickupLongitude,
                    dropLatitude,
                    dropLongitude,
                    totalPayment,
                    step,
                    orderStatus,
                    vehicleName,
                    vehicleImage,
                    vehicleBodyType
                };
            }));

            responsePayload = {
                driverApprovalStatus: approvalStatus,
                pendingRequest: requestData.length,
                assignId: requestData[0]?._id || '', // Optional: can be first one
                serviceType,
                isWallet: serviceType == 1 ? 0 : 1,
                request: requestData,
                tripCount: { completedCount, cancelledCount }
            };
        }

        res.status(200).json({
            success: true,
            message: 'Master Data',
            data: responsePayload
        });

    } catch (error) {
        console.error("Error in masterDetail:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

module.exports = { masterDetail };
