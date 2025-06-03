const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema({
    personalInfo: {
        name: { type: String, required: true },
        email: { type: String },
        dob: { type: String },
        gender: {
            type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
            default: 'Prefer not to say'
        },
        countryCode: { type: String },
        mobile: { type: String, required: true },
        altMobile: { type: String },
        profilePicture: { type: String }
    },
    addressInfo: {
        permanent: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            pin: { type: String }
        },
        current: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            pin: { type: String }
        }
    },

    documents: {
        aadhaarFront: { type: String },
        aadhaarBack: { type: String },
        panCard: { type: String },
        drivingLicense: { type: String },
        vehicleRC: { type: String },
        insuranceCopy: { type: String },
        bankPassbook: { type: String }
    },
    vehicleDetail: {
        vehicleName: { type: String },
        vehicleModel: { type: String },
        vehicleNumber: { type: String },
        yearOfManufacture: { type: String },
        plateNumber: { type: String },
        vin: { type: String },
        capacity: { type: String },
        fuelType: { type: String },
        odometerReading: { type: String },
        serviceType: { type: String },
        vehicleId: { type: String }
    },
    vehicleDocuments: {
        registrationCertificate: { type: String },
        insuranceCertificate: { type: String },
        pollutionCertificate: { type: String },
    },
    status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1 = Active, 2 = Inactive , 3 => Delete
    step: { type: Number, enum: [1, 2, 3, 4, 5] }, // 1 = Screen 1, 2 = Screen 2 , 3 => Screen 3
    approvedBy: {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        adminName: String,
        approvedAt: Date
    },
    approvalStatus: { type: Number, enum: [0, 1], default: 0 },// 1 = Active, 0 = Inactive 
    deviceType: {
        type: Number, enum: [1, 2, 3] // 1 = Android, 2 = Ios , 3 => Website
    }, deviceToken: {
        type: String,
        default: ''
    }, deviceId: {
        type: String,
        default: ''
    },
    serviceType: { type: mongoose.Schema.Types.ObjectId, ref: 'services', required: true },


}, { timestamps: true });

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
