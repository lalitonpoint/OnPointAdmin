const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema({
    personalInfo: {
        name: String,
        email: String,
        dob: Date,
        gender: String,
        mobile1: String,
        mobile2: String,
        whatsapp: String
    },
    addressInfo: {
        permanent: {
            street: String,
            city: String,
            state: String,
            pin: String
        },
        current: {
            street: String,
            city: String,
            state: String,
            pin: String
        }
    },
    emergencyContact: {
        name: String,
        relationship: String,
        contactNumber: String
    },
    documents: {
        aadhaarFront: String,
        aadhaarBack: String,
        panCard: String,
        drivingLicense: String,
        vehicleRC: String,
        insuranceCopy: String,
        bankPassbook: String
    },
    additionalInfo: {
        logisticsExperience: Boolean,
        preferredRegion: String,
        languages: [String],
        nightShift: Boolean
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
