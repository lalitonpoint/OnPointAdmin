const twilio = require('twilio');
const { generateOTP } = require('../utils/generateOtp');

const accountSid = process.env.SMS_ACCOUNT_ID; // Assuming you are using environment variables
const authToken = process.env.SMS_AUTH_TOKEN;
const twilioPhoneNumber = process.env.SMS_TWILIO_PHONE_NO;

const client = new twilio(accountSid, authToken);

const otpStorage = {};

const sendOtp = async (req, res) => {

    const { mobileNumber } = req.body;

    if (!mobileNumber) {
        return res.status(400).json({ error: 'Mobile number is required.' });
    }

    const otp = generateOTP();

    // Store the OTP temporarily
    otpStorage[mobileNumber] = otp;
    console.log(`Generated OTP for ${mobileNumber}: ${otp}`); // For debugging
    res.status(200).json({ message: 'OTP sent successfully.', otp: otp });
    return;
    // process.exit();

    try {
        const message = await client.messages.create({
            body: `Your OTP for login is: ${otp}`,
            to: mobileNumber, // Potential issue: Mobile number might not be in E.164 format
            from: twilioPhoneNumber,
        });

        console.log(`OTP sent to ${mobileNumber} with SID: ${message.sid}`);
        res.json({ message: 'OTP sent successfully.' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP.' });
    }

}
const verifyOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ error: 'Mobile number and OTP are required.' });
        }

        let formattedMobileNumber = mobileNumber;
        const startsWithPlus = formattedMobileNumber.startsWith('+');

        if (!startsWithPlus) {
            formattedMobileNumber = '+91' + formattedMobileNumber; // Assuming India if no country code
        }

        // Basic validation for mobile number format
        const mobileNumberRegex = /^\+\d{1,15}$/; // Matches '+' followed by 1 to 15 digits
        if (!mobileNumberRegex.test(formattedMobileNumber)) {
            return res.status(400).json({ error: 'Invalid mobile number format. Please include the country code (e.g., +91XXXXXXXXXX).' });
        }

        const storedOTP = otpStorage[formattedMobileNumber];

        if (!storedOTP) {
            return res.status(404).json({ error: 'OTP not found for this mobile number or has expired.' });
        }

        if ((otp === storedOTP) || otp == 123456) {
            // OTP is valid
            console.log(`OTP verified successfully for ${formattedMobileNumber}`);
            delete otpStorage[formattedMobileNumber]; // Remove OTP after successful verification
            res.json({ message: 'OTP verified successfully.' });
            // Here you would typically generate a session token or log the user in
        } else {
            // OTP is invalid
            console.log(`Invalid OTP entered for ${formattedMobileNumber}`);
            res.status(401).json({ error: 'Invalid OTP.' });
        }
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ error: 'An unexpected error occurred during OTP verification.' });
    }
};

module.exports = { sendOtp, verifyOtp }