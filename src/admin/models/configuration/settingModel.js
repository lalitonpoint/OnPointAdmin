const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
    aboutUs: {
        content: { type: String, default: "" }
    },
    termsAndConditions: {
        content: { type: String, default: "" }
    },
    privacyAndPolicy: {
        content: { type: String, default: "" }
    },
    driverInstruction: {
        content: { type: String, default: "" }
    },

    helpSupport: {
        supportEmail: { type: String, default: "" },
        supportMobile: { type: String, default: "" }
    },
    applicationLinks: {
        androidClientAppUrl: { type: String, default: "" },
        androidDriverAppUrl: { type: String, default: "" },
        iosClientAppUrl: { type: String, default: "" },
        iosDriverAppUrl: { type: String, default: "" }
    },
    appVersion: {
        androidClientAppVersion: { type: String, default: "" },
        androidDriverAppVersion: { type: String, default: "" },
        iosClientAppVersion: { type: String, default: "" },
        iosDriverAppVersion: { type: String, default: "" }
    },
    smsCredentials: {
        twilioSid: { type: String, default: "" },
        twilioAuthToken: { type: String, default: "" },
        twilioNumber: { type: String, default: "" },
        twilioCallUrl: { type: String, default: "" }
    },
    s3Credentials: {
        s3AccessKey: { type: String, default: "" },
        s3SecretKey: { type: String, default: "" },
        s3BucketKey: { type: String, default: "" },
    }, paymentDetails: {
        shippingCost: { type: Number, default: "" },
        specialHandling: { type: Number, default: "" },
        gst: { type: Number, default: "" },
        ratePerKG: { type: Number, default: "" },
        docketCharge: { type: Number, default: "" },
        fovPercentage: { type: Number, default: "" },
        fuelSurChargePercentage: { type: Number, default: "" },
        odaChargeMinimum: { type: Number, default: "" },
    },
    firebase: {
        type: { type: String, default: "" },
        project_id: { type: String, default: "" },
        private_key_id: { type: String, default: "" },
        private_key: { type: String, default: "" },
        client_email: { type: String, default: "" },
        client_id: { type: String, default: "" },
        auth_uri: { type: String, default: "" },
        token_uri: { type: String, default: "" },
        auth_provider_x509_cert_url: { type: String, default: "" },
        client_x509_cert_url: { type: String, default: "" },
        universe_domain: { type: String, default: "" }
    }

}, { timestamps: true });

module.exports = mongoose.model("Settings", SettingsSchema);
