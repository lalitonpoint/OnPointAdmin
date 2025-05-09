const FAQ = require('../../../admin/models/faqManagement/faqModel');
const settingModel = require('../../../admin/models/configuration/settingModel');
const driverModel = require('../../driver/modals/driverModal');

const getHambergerData = async (req, res) => {
    const driverId = req.headers['driverid']; // Fix: lowercase and correct access

    if (!driverId) {
        return res.status(200).json({ success: false, message: 'Driver Id is required.' });
    }

    try {
        const faqs = await FAQ.find({ status: 1, faqType: 2 }).sort({ createdAt: -1 });

        const categoryLabels = {
            1: 'General',
            2: 'Account',
            3: 'Service'
        };

        // Group FAQs by category name
        const groupedFaqs = faqs.reduce((acc, faq) => {
            const categoryName = categoryLabels[faq.faqCategory] || 'Unknown';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(faq);
            return acc;
        }, {});

        const driverInstructionData = await settingModel.findOne({ 'driverInstruction.content': { $exists: true } }).sort({ createdAt: -1 });
        const driverDocument = await driverModel.findOne({ _id: driverId });

        res.status(200).json({
            success: true,
            data: {
                driverDocument: driverDocument?.documents || {},
                driverInstruction: driverInstructionData?.aboutUs?.content || '',
                faqData: groupedFaqs,
            }
        });
    } catch (err) {
        console.error('Error fetching website data:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

module.exports = { getHambergerData };
