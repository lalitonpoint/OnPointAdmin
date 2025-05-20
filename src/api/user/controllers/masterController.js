const Packages = require('../models/paymentModal');
const { getDistanceAndDuration } = require('../../driver/utils/distanceCalculate');

const masterDetail = async (req, res) => {
    try {
        const userId = req.header('userid');
        if (!userId) {
            return res.status(200).json({ success: false, message: "User ID is required in headers." });
        }

        const currentPackages = await Packages.find({
            userId: userId, // FIXED: use `userId` field
            orderStatus: { $nin: [4, 5] }
        })
            .sort({ createdAt: -1 })
            .populate({ path: 'userId', select: 'fullName' });

        const packagesWithDistance = await Promise.all(currentPackages.map(async (pkg) => {
            try {
                const { distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
                    pkg.pickupLatitude,
                    pkg.pickupLongitude,
                    pkg.dropLatitude,
                    pkg.dropLongitude
                );

                return {
                    ...pkg.toObject(),
                    pickupDistance,
                    userName: pkg.userId?.fullName || null
                };
            } catch (e) {
                console.error(`Error in pickup distance for package ${pkg._id}:`, e.message);
                return {
                    ...pkg.toObject(),
                    pickupDistance: null,
                    userName: pkg.userId?.fullName || null
                };
            }
        }));

        return res.status(200).json({ success: true, data: packagesWithDistance });

    } catch (error) {
        console.error("Error in masterDetail:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

module.exports = { masterDetail };
