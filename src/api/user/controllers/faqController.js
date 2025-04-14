const FAQ = require('../../../admin/models/faqManagement/faqModel');

// Fetch only active Faq
const getFaq = async (req, res) => {
    try {
        const faqData = await FAQ.find({ status: 1 }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { faqData }
        });
    } catch (err) {
        console.error('Error fetching active FAQ:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { getFaq };
