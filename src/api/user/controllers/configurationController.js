const settingModel = require('../../../admin/models/configuration/settingModel');
const FAQ = require('../../../admin/models/faqManagement/faqModel');

const getSettingData = async (req, res) => {
    try {
        const [aboutUs, termsAndConditions, helpAndSupport, faq] = await Promise.all([
            settingModel.find({ aboutUs: { $exists: true } }).sort({ createdAt: -1 }),
            settingModel.find({ termsAndConditions: { $exists: true } }).sort({ createdAt: -1 }),
            settingModel.find({ helpSupport: { $exists: true } }).sort({ createdAt: -1 }),
            FAQ.find({ status: 1 }).sort({ createdAt: -1 })
        ]);
        // console.log(helpAndSupport[0].helpSupport);

        res.status(200).json({
            success: true,
            data: {
                aboutUs: aboutUs[0].aboutUs || null,
                termsAndConditions: termsAndConditions[0].termsAndConditions || null,
                helpAndSupport: helpAndSupport[0].helpSupport || null,
                faq
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

module.exports = { getSettingData };
