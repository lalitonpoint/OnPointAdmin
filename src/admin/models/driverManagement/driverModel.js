const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    dateOfBirth: { type: Date },
    gender: { type: String },
    mobileNo: { type: String, required: true, index: true },
    alternateMobileNo: { type: String, index: true },
    profileImage: { type: String }, // Store the path or URL of the profile image

    emergencyName: { type: String },
    emergencyRelation: { type: String },
    emergencyPhone: { type: String },

    priorExperience: { type: String }, // 'yes' or 'no'
    preferredRegion: { type: String }, // 'local', 'state', 'national'
    languagesKnown: { type: String }, // 'hindi', 'english', 'other'
    nightShiftWilling: { type: String }, // 'yes' or 'no'

    aadhaarFront: { type: String }, // Path or URL to the file
    aadhaarBack: { type: String },  // Path or URL to the file
    panCard: { type: String },     // Path or URL to the file
    drivingLicense: { type: String }, // Path or URL to the file
    vehicleRC: { type: String },    // Path or URL to the file
    vehicleInsurance: { type: String }, // Path or URL to the file
    bankPassbook: { type: String }, // Path or URL to the file

    permanentHouseNo: { type: String },
    permanentCity: { type: String },
    permanentState: { type: String },
    permanentPinCode: { type: String },
    currentHouseNo: { type: String },
    currentCity: { type: String },
    currentState: { type: String },
    currentPinCode: { type: String },

    createdAt: { type: Date, default: Date.now, index: true }
});

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;