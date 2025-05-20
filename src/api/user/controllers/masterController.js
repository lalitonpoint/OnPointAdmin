const Packages = require('../models/paymentModal');
const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate');
const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');

const masterDetail = async (req, res) => {
    try {
        const userId = req.header('userid');
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required in headers." });
        }

        // Fetch all active packages for the user
        const currentPackages = await Packages.find({
            userId,
            orderStatus: { $nin: [4, 5] }
        })
            .sort({ createdAt: -1 })
            .populate({ path: 'userId', select: 'fullName' })
            .lean(); // returns plain JS object, improves performance

        const packagesWithDistance = await Promise.all(currentPackages.map(async (pkg) => {
            let pickupDistance = null;
            let pickupDuration = null;
            let orderStatus = [];

            try {
                // Get pickup-to-drop distance
                const distanceData = await getDistanceAndDuration(
                    pkg.pickupLatitude,
                    pkg.pickupLongitude,
                    pkg.dropLatitude,
                    pkg.dropLongitude
                );
                pickupDistance = distanceData.distanceInKm;
                pickupDuration = distanceData.duration;

                // Get assigned driver package details (status = 4)
                const orderDetails = await DriverAssign.find({
                    packageId: pkg._id,
                    status: 4
                }).populate({ path: 'warehouseId', select: 'Warehousename' }).lean();

                if (orderDetails.length > 0) {
                    // First entry is always pickup
                    const firstDetail = orderDetails[0];
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
                pickupDistance,
                userName: pkg.userId?.fullName || null,
                orderStatus
            };
        }));

        return res.status(200).json({ success: true, data: packagesWithDistance });

    } catch (error) {
        console.error("Error in masterDetail:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

module.exports = { masterDetail };
