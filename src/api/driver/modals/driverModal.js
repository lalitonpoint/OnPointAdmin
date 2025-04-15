const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema({
    personalInfo: {
        name: { type: String, required: true },
        email: { type: String },
        dob: { type: Date },
        gender: {
            type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
            default: 'Prefer not to say'
        },
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

    status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1 = Active, 2 = Inactive , 3 => Delete
    step: { type: Number, enum: [1, 2, 3] } // 1 = Screen 1, 2 = Screen 2 , 3 => Screen 3

}, { timestamps: true });

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
