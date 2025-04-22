const Banner = require('../../../admin/models/websiteManagement/bannerModel');

const getBannerData = async (req, res) => {
    try {
        const [banners] = await Promise.all([
            Banner.find({ plateformType: 1 }).sort({ createdAt: -1 }) // ✅ Fixed missing comma
        ]);

        res.status(200).json({
            success: true,
            data: { banners }
        });
    } catch (err) {
        console.error('Error fetching Banner data:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { getBannerData };
