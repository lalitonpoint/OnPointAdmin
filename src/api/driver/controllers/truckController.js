const Truck = require('../../../admin/models/vehcileManagement/truckManagementModel');

const getTruckData = async (req, res) => {
    try {
        const truckDetail = await Truck.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: truckDetail
        });
    } catch (err) {
        console.error('Error fetching Truck data:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { getTruckData };