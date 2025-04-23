const Testimonial = require('../../../admin/models/websiteManagement/testimonialModel');
const Blog = require('../../../admin/models/websiteManagement/blogModel');
const Banner = require('../../../admin/models/websiteManagement/bannerModel');

// Fetch Testimonials, Blogs & Contact Us Data
const getWebsiteData = async (req, res) => {
    try {

        const [testimonials, blogs, banners] = await Promise.all([
            Testimonial.find().sort({ createdAt: -1 }),
            Blog.find().sort({ createdAt: -1 }),
            Banner.find({ plateformType: 2 }).sort({ createdAt: -1 }) // ✅ Fixed missing comma
        ]);

        res.status(200).json({
            success: true,
            data: { testimonials, blogs, banners }
        });
    } catch (err) {
        console.error('Error fetching website data:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { getWebsiteData };
