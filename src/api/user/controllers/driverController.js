
const DriverLocation = require('../../driver/modals/driverLocModal'); // Assuming the common function is located in '../utils/distanceCalculate'

const driverCurrentLocation = async (req, res) => {
    try {
        const { driverId } = req.body;

        if (!driverId) {
            return res.status(200).json({
                success: false,
                message: "Driver ID is required"
            });
        }

        const location = await DriverLocation.findOne({ driverId });

        if (!location) {
            return res.status(200).json({
                success: true,
                message: "No location found for this driver",
                data: { lat: 0, long: 0 }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver current location retrieved successfully",
            data: {
                lat: location.latitude,
                long: location.longitude
            }
        });

    } catch (error) {
        console.error("Error fetching driver location:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = { driverCurrentLocation }