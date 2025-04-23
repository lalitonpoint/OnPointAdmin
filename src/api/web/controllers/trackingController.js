const TrackingModel = require('../../../admin/models/websiteManagement/trackingModel');

const getTrackingData = async (req, res) => {
    try {
        const { trackingId } = req.body;

        if (!trackingId) {
            return res.status(400).json({ success: false, message: 'Tracking ID is required' });
        }

        // Use findById if you're using MongoDB's default _id field
        const trackingDetails = await TrackingModel.find({ trackingId: trackingId }).lean();

        if (trackingDetails) {
            res.status(200).json({ success: true, message: 'Tracking Data Found', data: trackingDetails });
        } else {
            res.status(404).json({ success: false, message: 'No Tracking Data', data: null });
        }

    } catch (error) {
        console.error('Error Get Tracking Data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracking data. Please try again later.',
            error: error.message
        });
    }
};

module.exports = { getTrackingData };
