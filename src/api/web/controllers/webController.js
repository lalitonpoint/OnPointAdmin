const Testimonial = require('../../../admin/models/websiteManagement/testimonialModel');
const Blog = require('../../../admin/models/websiteManagement/blogModel');
const Banner = require('../../../admin/models/websiteManagement/bannerModel');
const Warehouse = require('../../../admin/models/websiteManagement/warehouseModal');

// Fetch Testimonials, Blogs & Contact Us Data
const getWebsiteData = async (req, res) => {
    try {
        const [testimonials, blogs, banners] = await Promise.all([
            Testimonial.find().sort({ createdAt: -1 }),
            Blog.find().sort({ createdAt: -1 }),
            Banner.find({ plateformType: 2 }).sort({ createdAt: -1 })
        ]);

        if (!testimonials.length && !blogs.length && !banners.length) {
            return res.status(200).json({
                success: false,
                message: 'No Website Data Found',
                data: { testimonials: [], blogs: [], banners: [] }
            });
        }

        res.status(200).json({
            success: true,
            data: { testimonials, blogs, banners }
        });
    } catch (err) {
        console.error('Error fetching website data:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

const getWareHouseAvailablity = async (req, res) => {
    try {
        const { pincode } = req.body;

        if (!pincode) {
            return res.status(400).json({
                success: false,
                message: 'Pincode is required',
                data: []
            });
        }

        const warehouses = await Warehouse.find({ pincode });

        res.status(200).json({
            success: true,
            message: warehouses.length ? warehouses.warehouseMessage : 'No warehouses found',
            data: warehouses
        });
    } catch (error) {
        console.error('Error fetching warehouse data:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = { getWebsiteData, getWareHouseAvailablity };