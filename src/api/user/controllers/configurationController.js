const settingModel = require('../../../admin/models/configuration/settingModel');

const getSettingSection = async (req, res) => {
    try {
        const { section } = req.body;

        if (!section) {
            return res.status(400).json({ success: false, msg: 'Section is required' });
        }
        const setting = await settingModel.findOne().sort({ createdAt: -1 });

        if (!setting || !setting[section]) {
            return res.status(404).json({ success: false, msg: 'Section not found in settings' });
        }

        res.status(200).json({
            success: true,
            data: { [section]: setting[section] }
        });

    } catch (err) {
        console.error('Error fetching setting section:', err);
        res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }
};

module.exports = { getSettingSection };
