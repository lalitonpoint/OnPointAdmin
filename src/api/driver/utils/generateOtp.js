const crypto = require('crypto');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

const isOTPValid = (otpExpiry) => {
    return otpExpiry && otpExpiry > Date.now();
};

const formatMobile = (countryCode, mobileNumber) => {
    try {
        const fullNumber = `${countryCode}${mobileNumber}`;
        const parsed = parsePhoneNumber(fullNumber);
        if (parsed && parsed.isValid()) {
            return {
                formatted: parsed.number, // E.164 format: +919354978804
                countryCode: parsed.countryCallingCode,
                nationalNumber: parsed.nationalNumber,
            };
        }
        return null;
    } catch (error) {
        return null;
    }
};

module.exports = { generateOTP, isOTPValid, formatMobile };
