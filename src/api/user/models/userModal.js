const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    }, emailAddress: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true,
    }
    ,
    countryCode: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+\d{1,3}$/, 'Please enter a valid country code (e.g., +91)']
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        default: 'Prefer not to say'
    },
    companyName: {
        type: String,
        trim: true,
        default: ''
    },
    gstNumber: {
        type: String,
        trim: true,
        default: ''
    },
    status: { type: Number, enum: [1, 2, 3], default: 1 } // 1 = Active, 2 = Inactive , 3 => Delete
    ,
    profilePicture: {
        type: String,
        default: ''
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;