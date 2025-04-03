const Settings = require("../../models/configuration/settingModel");

// Render Settings Page
const appSetting = async (req, res) => {
    try {
        const settings = await Settings.findOne(); // Fetch existing settings
        res.render('pages/Configuration/appSetting', { settings });
    } catch (error) {
        res.status(500).send("Error loading settings page");
    }
};

// Save or Update Settings
const saveSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        // Update settings with form data
        settings.firebase = req.body.firebase || settings.firebase;
        settings.helpSupport = req.body.helpSupport || settings.helpSupport;
        settings.applicationLinks = req.body.applicationLinks || settings.applicationLinks;
        settings.appVersion = req.body.appVersion || settings.appVersion;
        settings.smsCredentials = req.body.smsCredentials || settings.smsCredentials;

        await settings.save();
        res.json({ success: true, message: "Settings saved successfully", data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Settings Data (API)
const getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json({ success: true, data: settings || {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { appSetting, saveSettings, getSettings };
