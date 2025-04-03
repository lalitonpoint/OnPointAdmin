const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
    firebase: {
        projectId: String,
        firebaseEmail: String,
        firebaseId: String,
        tokenUrl: String
    },
    helpSupport: {
        supportEmail: String,
        supportMobile: String
    },
    applicationLinks: {
        androidClientAppUrl: String,
        androidDriverAppUrl: String,
        iosClientAppUrl: String,
        iosDriverAppUrl: String
    },
    appVersion: {
        androidClientAppVersion: String,
        androidDriverAppVersion: String,
        iosClientAppVersion: String,
        iosDriverAppVersion: String
    },
    smsCredentials: {
        twilioSid: String,
        twilioAuthToken: String,
        twilioNumber: String,
        twilioCallUrl: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Settings", SettingsSchema);
