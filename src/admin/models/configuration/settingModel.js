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
    firebase: {
        projectId: { type: String, default: "" },
        firebaseEmail: { type: String, default: "" },
        firebaseId: { type: String, default: "" },
        tokenUrl: { type: String, default: "" }
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
        shippingCost: { type: String, default: "" },
        specialHandling: { type: String, default: "" },
        gst: { type: String, default: "" },
    }
}, { timestamps: true });

module.exports = mongoose.model("Settings", SettingsSchema);
