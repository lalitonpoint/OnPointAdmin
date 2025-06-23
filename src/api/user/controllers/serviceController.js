const Services = require('../../../admin/models/vehicleManagement/serviceManagementModel');

// Fetch only active services
const getServices = async (req, res) => {
    try {
        const service = await Services.find({ status: 1 }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { service }
        });
    } catch (err) {
        console.error('Error fetching active services:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};


module.exports = { getServices };
