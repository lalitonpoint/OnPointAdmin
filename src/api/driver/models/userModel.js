const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    mobile: { type: String, required: true, unique: true },
    otp: { type: String },
    otpExpires: { type: Date }, // OTP expiry time
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
