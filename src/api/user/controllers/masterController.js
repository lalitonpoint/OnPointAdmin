// const Packages = require('../models/paymentModal');
// const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate');
// const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');

// const Banner = require('../../../admin/models/websiteManagement/bannerModel');

// const masterDetail = async (req, res) => {
//     const serviceType = 1;
//     try {
//         //for Banner
//         const [banners] = await Promise.all([
//             Banner.find({ plateformType: 1 }).sort({ createdAt: -1 }) // ✅ Fixed missing comma
//         ]);

//         //for Banner

//         const userId = req.header('userid');
//         if (!userId) {
//             return res.status(200).json({ success: false, message: "User ID is required in headers." });
//         }

//         // Fetch all active packages for the user
//         const currentPackages = await Packages.find({
//             userId,
//             orderStatus: { $nin: [4, 5] }
//         })
//             .sort({ createdAt: -1 })
//             // .populate({ path: 'userId', select: 'fullName' })
//             .lean(); // returns plain JS object, improves performance


//         const packagesWithDistance = await Promise.all(currentPackages.map(async (pkg) => {
//             let pickupDistance = null;
//             let pickupDuration = null;
//             let orderStatus = [];

//             try {
//                 // Get pickup-to-drop distance
//                 const distanceData = await getDistanceAndDuration(
//                     pkg.pickupLatitude,
//                     pkg.pickupLongitude,
//                     pkg.dropLatitude,
//                     pkg.dropLongitude
//                 );
//                 pickupDistance = distanceData.distanceInKm;
//                 pickupDuration = distanceData.duration;

//                 // Get assigned driver package details (status = 4)
//                 const orderDetails = await DriverAssign.find({
//                     packageId: pkg._id,
//                     status: 4
//                 }).populate({ path: 'warehouseId', select: 'Warehousename' })
//                     .populate({ path: 'driverId', select: 'personalInfo' }).lean();

//                 if (orderDetails.length > 0) {
//                     // First entry is always pickup
//                     const firstDetail = orderDetails[0];
//                     orderStatus.push({
//                         orderStatus: 'Pick Up',
//                         Address: firstDetail.pickupAddress
//                     });

//                     const getLabel = (detail) =>
//                         detail.assignType == 2 ? 'Delivered' :
//                             detail.warehouseId?.Warehousename || 'Warehouse';

//                     // First drop
//                     orderStatus.push({
//                         orderStatus: getLabel(firstDetail),
//                         Address: firstDetail.dropAddress
//                     });

//                     // Remaining drops
//                     for (let i = 1; i < orderDetails.length; i++) {
//                         const detail = orderDetails[i];
//                         orderStatus.push({
//                             orderStatus: getLabel(detail),
//                             Address: detail.dropAddress
//                         });
//                     }
//                 }
//             } catch (err) {
//                 console.error(`Error processing package ${pkg._id}:`, err.message);
//             }

//             return {
//                 ...pkg,
//                 pickupDistance,
//                 // driverName: pkg.userId?.fullName || null,
//                 driverId: driver._id || '',
//                 driverName: driver.personalInfo?.name || '',
//                 driverContact: driver.personalInfo?.mobile || '',
//                 driverProfile: driver.personalInfo?.profilePicture || '',
//                 vehicleNumber: driver.vehicleDetail?.truckNumber || '',
//                 orderTracking: orderStatus
//             };
//         }));

//         return res.status(200).json({
//             success: true, data: {
//                 banners: banners,
//                 currentShipment: packagesWithDistance,
//                 serviceType,
//                 isWallet: serviceType == 1 ? 0 : 0,

//             },
//             message: 'Master Data Fetch Successfully'
//         });

//     } catch (error) {
//         console.error("Error in masterDetail:", error);
//         return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
//     }
// };

// module.exports = { masterDetail };

const Packages = require('../models/paymentModal');
const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate');
const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const Banner = require('../../../admin/models/websiteManagement/bannerModel');

const masterDetail = async (req, res) => {
    const serviceType = 1;

    try {
        const userId = req.header('userid');
        if (!userId) {
            return res.status(200).json({ success: false, message: "User ID is required in headers." });
        }

        // Fetch banners
        const banners = await Banner.find({ plateformType: 1 }).sort({ createdAt: -1 }).lean();

        // Fetch active packages
        const currentPackages = await Packages.find({
            userId,
            orderStatus: { $nin: [0, 4, 5] }
        }).sort({ createdAt: -1 }).lean();

        const packagesWithDistance = await Promise.all(
            currentPackages.map(async (pkg) => {
                let pickupDistance = null;
                let pickupDuration = null;
                let orderStatus = [];
                let driverData = {
                    driverId: '',
                    driverName: '',
                    driverContact: '',
                    driverProfile: '',
                    vehicleNumber: ''
                };

                try {
                    // Distance from pickup to drop
                    const distanceData = await getDistanceAndDuration(
                        pkg.pickupLatitude,
                        pkg.pickupLongitude,
                        pkg.dropLatitude,
                        pkg.dropLongitude
                    );

                    pickupDistance = distanceData.distanceInKm;
                    pickupDuration = distanceData.duration;
                    packageName = pkg.packages.map(p => p.packageName).filter(Boolean).join(', ');


                    // Assigned drivers (status 4)
                    const orderDetails = await DriverAssign.find({
                        packageId: pkg._id,
                        status: 4
                    })
                        .populate({ path: 'warehouseId', select: 'Warehousename' })
                        .populate({ path: 'driverId', select: 'personalInfo vehicleDetail' })
                        .lean();

                    if (orderDetails.length > 0) {
                        const firstDetail = orderDetails[0];

                        // Set driver data from first record
                        if (firstDetail.driverId?.personalInfo) {
                            const { name, mobile, profilePicture } = firstDetail.driverId.personalInfo;
                            const truckNumber = firstDetail.driverId.vehicleDetail?.truckNumber || '';
                            driverData = {
                                driverId: firstDetail.driverId._id,
                                driverName: name || '',
                                driverContact: mobile || '',
                                driverProfile: profilePicture || '',
                                vehicleNumber: truckNumber
                            };
                        }


                        // Build order status
                        orderStatus.push({
                            orderStatus: 'Pick Up',
                            Address: firstDetail.pickupAddress
                        });

                        const getLabel = (detail) =>
                            detail.assignType == 2 ? 'Delivered' :
                                detail.warehouseId?.Warehousename || 'Warehouse';

                        // First drop
                        orderStatus.push({
                            orderStatus: getLabel(firstDetail),
                            Address: firstDetail.dropAddress
                        });

                        // Remaining drops
                        for (let i = 1; i < orderDetails.length; i++) {
                            const detail = orderDetails[i];
                            orderStatus.push({
                                orderStatus: getLabel(detail),
                                Address: detail.dropAddress
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error processing package ${pkg._id}:`, err.message);
                }

                return {
                    ...pkg,
                    packageName,
                    pickupDistance,
                    pickupDuration,
                    ...driverData,
                    orderTracking: orderStatus
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                banners,
                currentShipment: packagesWithDistance,
                serviceType,
                isWallet: 0
            },
            message: 'Master Data Fetch Successfully'
        });

    } catch (error) {
        console.error("Error in masterDetail:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

module.exports = { masterDetail };
