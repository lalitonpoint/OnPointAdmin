const Settings = require("../../models/configuration/settingModel");

// Render Settings Page
const appSetting = async (req, res) => {
    try {
        const settings = await Settings.findOne(); // Fetch existing settings
        res.render('pages/configuration/appSetting', { settings });
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


        // Update settings with form data based on the UI structure
        if (req.body.aboutUs) {
            settings.aboutUs = { content: req.body.aboutUs.aboutUsText };
        }
        if (req.body.termCondition) {
            settings.termsAndConditions = { content: req.body.termCondition.termConditionText };
        }
        if (req.body.helpSupport) {
            settings.helpSupport = {
                supportEmail: req.body.helpSupport.supportEmail,
                supportMobile: req.body.helpSupport.supportMobile
            };
        }
        if (req.body.firebase) {
            settings.firebase = {
                projectId: req.body.firebase.projectId,
                firebaseEmail: req.body.firebase.firebaseEmail,
                firebaseId: req.body.firebase.firebaseId,
                tokenUrl: req.body.firebase.tokenUrl
            };
        }
        if (req.body.applicationLinks) {
            settings.applicationLinks = {
                androidClientAppUrl: req.body.applicationLinks.androidClientUrl,
                androidDriverAppUrl: req.body.applicationLinks.androidDriverUrl,
                iosClientAppUrl: req.body.applicationLinks.iosClientUrl,
                iosDriverAppUrl: req.body.applicationLinks.iosDriverUrl
            };
        }
        if (req.body.appVersion) {
            settings.appVersion = {
                androidClientAppVersion: req.body.appVersion.androidClientVersion,
                androidDriverAppVersion: req.body.appVersion.androidDriverVersion,
                iosClientAppVersion: req.body.appVersion.iosClientVersion,
                iosDriverAppVersion: req.body.appVersion.iosDriverVersion
            };
        }
        if (req.body.twilioCred) {
            settings.smsCredentials = {
                twilioSid: req.body.twilioCred.twilioSid,
                twilioAuthToken: req.body.twilioCred.twilioToken,
                twilioNumber: req.body.twilioCred.twilioNumber,
                twilioCallUrl: req.body.twilioCred.twilioCallUrl
            };
        }
        if (req.body.awsS3) {
            settings.s3Credentials = {
                s3AccessKey: req.body.awsS3.s3AccessKey,
                s3SecretKey: req.body.awsS3.s3SecretKey,
                s3BucketKey: req.body.awsS3.s3Bucket
            };
        }
        console.log(settings);

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