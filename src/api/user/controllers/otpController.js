const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/generateOtp');
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');
const User = require('../../user/models/userModal');

const accountSid = process.env.SMS_ACCOUNT_ID;
const authToken = process.env.SMS_AUTH_TOKEN;
const twilioPhoneNumber = process.env.SMS_TWILIO_PHONE_NO;
const secretKey = process.env.JWT_SECRET;

const client = new twilio(accountSid, authToken);

const otpStorage = {}; // Use Redis for production

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

const sendOtp = async (req, res) => {
    try {
        const { countryCode, mobileNumber } = req.body;

        if (!countryCode || !mobileNumber) {
            return res.status(400).json({ status: false, error: 'Country code and mobile number are required.' });
        }

        const parsed = formatMobile(countryCode, mobileNumber);

        if (!parsed || !isValidPhoneNumber(parsed.formatted)) {
            return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
        }

        const otp = generateOTP();
        otpStorage[parsed.formatted] = otp;

        console.log(`Generated OTP for ${parsed.formatted}: ${otp}`);
        res.status(200).json({ status: true, message: 'OTP sent successfully on ' + parsed.formatted, otp: otp });
        return;

        try {
            const message = await client.messages.create({
                body: `Your OTP for login is: ${otp}`,
                to: parsed.formatted,
                from: twilioPhoneNumber,
            });

            console.log(`OTP sent to ${parsed.formatted}, SID: ${message.sid}`);
            return res.status(200).json({ status: true, message: 'OTP sent successfully.' });
        } catch (error) {
            console.error('Twilio Error:', error);
            return res.status(500).json({ status: false, error: 'Failed to send OTP via SMS.' });
        }

    } catch (error) {
        console.error('sendOtp Error:', error);
        return res.status(500).json({ status: false, error: 'Unexpected error in sending OTP.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { countryCode, mobileNumber, otp } = req.body;

        if (!countryCode || !mobileNumber || !otp) {
            return res.status(400).json({ status: false, error: 'Country code, mobile number and OTP are required.', isRegistered: false });
        }

        const parsed = formatMobile(countryCode, mobileNumber);

        if (!parsed || !isValidPhoneNumber(parsed.formatted)) {
            return res.status(400).json({ status: false, error: 'Invalid mobile number format.', isRegistered: false });
        }

        const storedOTP = otpStorage[parsed.formatted];

        if (!storedOTP) {
            return res.status(404).json({ status: false, error: 'OTP expired or not found.', isRegistered: false });
        }

        if (otp !== storedOTP) {
            return res.status(401).json({ status: false, error: 'Invalid OTP.', isRegistered: false });
        }

        // OTP is valid, delete from storage
        delete otpStorage[parsed.formatted];
        console.log(`OTP verified for ${parsed.formatted}`);

        // Now look for the user
        const user = await User.findOne({
            countryCode, // assuming in DB it's saved like "91"
            mobileNumber
        });

        if (user) {
            const token = jwt.sign(
                { userId: user._id, mobileNumber: user.mobileNumber },
                secretKey,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                status: true,
                message: 'OTP verified and login successful.',
                token,
                isRegistered: true,
            });
        } else {
            return res.status(200).json({
                status: true,
                message: 'OTP verified but mobile number is not registered.',
                isRegistered: false,
            });
        }

    } catch (error) {
        console.error('verifyOtp Error:', error.message); // Log specific error
        return res.status(500).json({
            status: false,
            error: 'Unexpected error in OTP verification.',
            msg: error.message,
            isRegistered: false,
        });
    }
};


module.exports = { sendOtp, verifyOtp };
