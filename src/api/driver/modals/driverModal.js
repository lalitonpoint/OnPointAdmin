const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema({
    personalInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        dob: { type: Date, required: true },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
            default: 'Prefer not to say'
        },
        mobile: { type: String, required: true },
        altMobile: { type: String },
        profilePicture: { type: String, required: true }
    },

    addressInfo: {
        permanent: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pin: { type: String, required: true }
        },
        current: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            pin: { type: String }
        }
    },

    documents: {
        ve: { type: String }, // assuming "ve" is for voter ID or similar doc
        aadhaarBack: { type: String, required: true },
        panCard: { type: String, required: true },
        drivingLicense: { type: String, required: true },
        vehicleRC: { type: String, required: true },
        insuranceCopy: { type: String, required: true },
        bankPassbook: { type: String, required: true }
    },

    vehicleDetail: {
        vehicleName: { type: String, required: true },
        vehicleModel: { type: String, required: true },
        yearOfManufacture: { type: String, required: true },
        plateNumber: { type: String, required: true },
        vin: { type: String, required: true },
        capacity: { type: String, required: true },
        fuelType: { type: String, required: true },
        odometerReading: { type: String, required: true },
        vehicleType: { type: String, required: true },
        vehicleId: { type: String, required: true }
    },

    vehicleDocuments: {
        registrationCertificate: { type: String, required: true },
        insuranceCertificate: { type: String, required: true },
        pollutionCertificate: { type: String, required: true }
    },

    status: {
        type: Number,
        enum: [1, 2, 3], // 1 = Active, 2 = Inactive, 3 = Deleted
        default: 1
    },

    step: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        default: 1
    }

}, { timestamps: true });

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
