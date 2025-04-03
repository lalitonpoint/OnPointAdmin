const Testimonial = require('../../admin/models/websiteManagement/testimonialModel');
const Blog = require('../../admin/models/websiteManagement/blogModel');
const ContactUs = require('../../admin/models/websiteManagement/contactUsModel');
const Banner = require('../../admin/models/websiteManagement/bannerModel');

// Fetch Testimonials, Blogs & Contact Us Data
const getWebsiteData = async (req, res) => {
    try {
        const [testimonials, blogs, contactUs, banners] = await Promise.all([
            Testimonial.find().sort({ createdAt: -1 }),
            Blog.find().sort({ createdAt: -1 }),
            ContactUs.find().sort({ createdAt: -1 }), // ✅ Fixed missing comma
            Banner.find().sort({ createdAt: -1 }) // ✅ Fixed missing comma
        ]);

        res.status(200).json({
            success: true,
            data: { testimonials, blogs, contactUs, banners }
        });
    } catch (err) {
        console.error('Error fetching website data:', err);
        res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }
};

module.exports = { getWebsiteData };
