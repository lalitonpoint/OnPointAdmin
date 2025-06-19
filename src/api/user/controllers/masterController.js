
const Packages = require('../models/paymentModal');
const FTL = require('../models/ftlPaymentModal');
const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate');
const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const Banner = require('../../../admin/models/websiteManagement/bannerModel');
const Service = require('../../../admin/models/vehcileManagement/serviceManagementModel');

const masterDetail = async (req, res) => {
    // const serviceType = 1;
    const serviceId = req.header('serviceid');

    let serviceType = await Service.findById(serviceId).select('value');

    serviceType = serviceType.value;

    try {
        const userId = req.header('userid');
        if (!userId) {
            return res.status(200).json({ success: false, message: "User ID is required in headers." });
        }

        // Fetch banners
        const banners = await Banner.find({ plateformType: 1 }).sort({ createdAt: -1 }).lean();

        // Fetch active packages
        let packagesWithDistance;
        let currentBidding;

        if (serviceType == 1) {
            const currentPackages = await Packages.find({
                userId,
                orderStatus: { $nin: [0, 4, 5] }
            }).sort({ createdAt: -1 }).lean();

            packagesWithDistance = await Promise.all(
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
        }
        else {
            packagesWithDistance = await FTL.find({
                userId,
                transactionStatus: 1,
                orderStatus: { $nin: [0, 4, 5] }
            }).sort({ createdAt: -1 }).lean();
            const pendingFTL = await FTL.findOne({
                userId,
                transactionStatus: 0
            }).sort({ createdAt: -1 }).lean();

            currentBidding = {
                requestId: pendingFTL?._id || 0,
                isBidding: pendingFTL?.isBidding || 0
            };

        }



        return res.status(200).json({
            success: true,
            data: {
                banners,
                currentShipment: packagesWithDistance,
                currentBidding: serviceType == 1 ? {} : currentBidding,
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
