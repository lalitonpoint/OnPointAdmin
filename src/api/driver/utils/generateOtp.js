const crypto = require('crypto');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

const isOTPValid = (otpExpiry) => {
    return otpExpiry && otpExpiry > Date.now();
};

module.exports = { generateOTP, isOTPValid };
