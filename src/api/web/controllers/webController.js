const Testimonial = require('../../../admin/models/websiteManagement/testimonialModel');
const Blog = require('../../../admin/models/websiteManagement/blogModel');
const Banner = require('../../../admin/models/websiteManagement/bannerModel');
const Warehouse = require('../../../admin/models/warehouseManagemnet/warehouseModal');

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

const getWareHouseList = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({});

        if (!warehouses.length) {
            return res.status(200).json({
                success: false,
                message: 'No Warehouses Found',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            data: { warehouses }
        });
    } catch (err) {
        console.error('Error fetching warehouse data:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { getWebsiteData, getWareHouseList };