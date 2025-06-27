const Settings = require("../../models/configuration/settingModel");
const { generateLogs } = require('../../utils/logsHelper');

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
        if (req.body.driverInstruction) {
            settings.driverInstruction = { content: req.body.driverInstruction.driverInstructionText };
        }
        if (req.body.privacyAndPolicy) {
            settings.privacyAndPolicy = { content: req.body.privacyAndPolicy.privacyAndPolicyText };
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
        if (req.body.payment) {
            settings.paymentDetails = {
                shippingCost: parseFloat(req.body.payment.shippingCost),
                specialHandling: parseFloat(req.body.payment.specialHandling),
                gst: parseFloat(req.body.payment.gst),
                odaChargeMinimum: parseFloat(req.body.payment.odaChargeMinimum),
                fuelSurChargePercentage: parseFloat(req.body.payment.fuelSurChargePercentage),
                fovPercentage: parseFloat(req.body.payment.fovPercentage),
                docketCharge: parseFloat(req.body.payment.docketCharge),
                ratePerKG: parseFloat(req.body.payment.ratePerKG),
                prePaymentPercentage: parseFloat(req.body.payment.prePaymentPercentage),
                loadingTime: parseFloat(req.body.payment.loadingTime),
                unloadingTime: parseFloat(req.body.payment.unloadingTime),
                driverPercentageCut: parseFloat(req.body.payment.driverPercentageCut),
            };
        }

        if (req.body.firebase) {
            settings.firebase = {
                type: req.body.firebase.type || "",
                project_id: req.body.firebase.project_id || "",
                private_key_id: req.body.firebase.private_key_id || "",
                private_key: req.body.firebase.private_key || "",
                client_email: req.body.firebase.client_email || "",
                client_id: req.body.firebase.client_id || "",
                auth_uri: req.body.firebase.auth_uri || "",
                token_uri: req.body.firebase.token_uri || "",
                auth_provider_x509_cert_url: req.body.firebase.auth_provider_x509_cert_url || "",
                client_x509_cert_url: req.body.firebase.client_x509_cert_url || "",
                universe_domain: req.body.firebase.universe_domain || ""
            };
        }

        // console.log(settings);

        await settings.save();
        await generateLogs(req, 'Edit', settings);

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