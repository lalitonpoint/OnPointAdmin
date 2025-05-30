const Truck = require('../../../admin/models/vehcileManagement/truckManagementModel');

const getTruckData = async (req, res) => {

    const serviceId = req.header('serviceid');

    if (!serviceId)
        res.status(200).json({
            success: false,
            data: [],
            message: 'Please Provice Valid Service Id'
        });

    try {
        const truckDetail = await Truck.find({ serviceType: serviceId }).sort({ createdAt: -1 });

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