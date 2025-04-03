const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },

    status: {
        type: String,
        enum: ['Active', 'Inactive'], // Possible values
        default: 'Active'
    }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
