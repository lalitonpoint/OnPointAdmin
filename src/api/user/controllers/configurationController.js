const settingModel = require('../../../admin/models/configuration/settingModel');
const FAQ = require('../../../admin/models/faqManagement/faqModel');
const Services = require('../../../admin/models/vehicleManagement/serviceManagementModel');


const getSettingData = async (req, res) => {
    try {
        const [aboutUs, termsAndConditions, helpAndSupport, privacyAndPolicy, faq, services] = await Promise.all([
            settingModel.find({ aboutUs: { $exists: true } }).sort({ createdAt: -1 }),
            settingModel.find({ termsAndConditions: { $exists: true } }).sort({ createdAt: -1 }),
            settingModel.find({ helpSupport: { $exists: true } }).sort({ createdAt: -1 }),
            settingModel.find({ privacyAndPolicy: { $exists: true } }).sort({ createdAt: -1 }),
            FAQ.find({ status: 1 }).sort({ createdAt: -1 }),
            Services.find({ status: 1 }).sort({ createdAt: -1 })

        ]);
        // console.log(services);

        res.status(200).json({
            success: true,
            data: {
                aboutUs: aboutUs[0].aboutUs || null,
                termsAndConditions: termsAndConditions[0].termsAndConditions || null,
                helpAndSupport: helpAndSupport[0].helpSupport || null,
                privacyAndPolicy: privacyAndPolicy[0].privacyAndPolicy || null,
                faq,
                services: services || null,

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
