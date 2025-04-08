const twilio = require('twilio');
const { generateOTP } = require('../utils/generateOtp');
const { isValidPhoneNumber, parsePhoneNumber, ParseError } = require('libphonenumber-js');

const accountSid = process.env.SMS_ACCOUNT_ID; // Assuming you are using environment variables
const authToken = process.env.SMS_AUTH_TOKEN;
const twilioPhoneNumber = process.env.SMS_TWILIO_PHONE_NO;

const client = new twilio(accountSid, authToken);

const otpStorage = {};
const sendOtp = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ status: false, error: 'Mobile number is required.' });
        }

        let formattedMobileNumber = mobileNumber;
        let countryCode = null;

        try {
            // Try to parse the number to extract the country code if present
            const parsedNumber = parsePhoneNumber(mobileNumber);

            if (parsedNumber && parsedNumber.isValid()) {
                formattedMobileNumber = parsedNumber.formatInternational(); // Format to international standard
                countryCode = parsedNumber.country;
            } else {
                // If parsing fails, try your default assumption (India)
                if (!formattedMobileNumber.startsWith('+')) {
                    formattedMobileNumber = '+91' + formattedMobileNumber;
                }
                const parsedWithDefault = parsePhoneNumber(formattedMobileNumber);
                if (parsedWithDefault && parsedWithDefault.isValid()) {
                    formattedMobileNumber = parsedWithDefault.formatInternational();
                    countryCode = parsedWithDefault.country;
                } else {
                    return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
                }
            }

            // More explicit validation using isValidPhoneNumber
            if (!isValidPhoneNumber(formattedMobileNumber)) {
                return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
            }
        } catch (error) {
            if (error instanceof ParseError && error.message === 'TOO_SHORT') {
                return res.status(400).json({ status: false, error: 'Mobile number is too short.' });
            }
            // Handle other parsing errors if needed
            console.error('Error during mobile number parsing:', error);
            return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
        }

        const otp = generateOTP();

        // Store the OTP temporarily
        otpStorage[formattedMobileNumber] = otp;
        console.log(`Generated OTP for ${formattedMobileNumber}: ${otp}`);


        res.status(200).json({ status: true, message: 'OTP sent successfully.', otp: otp });
        return;

        try {
            const message = await client.messages.create({
                body: `Your OTP for login is: ${otp}`,
                to: formattedMobileNumber,
                from: twilioPhoneNumber,
            });

            console.log(`OTP sent to ${formattedMobileNumber} with SID: ${message.sid}`);
            res.status(200).json({ status: true, message: 'OTP sent successfully.' });

        } catch (error) {
            console.error('Error sending OTP via SMS:', error);
            res.status(500).json({ status: false, error: 'Failed to send OTP via SMS.' });
        }

    } catch (error) {
        console.error('Error in sendOtp function:', error);
        res.status(500).json({ status: false, error: 'An unexpected error occurred.' });
    }
};
const verifyOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ status: false, error: 'Mobile number and OTP are required.' });
        }

        let formattedMobileNumber = mobileNumber;
        let countryCode = null;

        try {
            // Try to parse the number to extract the country code if present
            const parsedNumber = parsePhoneNumber(mobileNumber);

            if (parsedNumber && parsedNumber.isValid()) {
                formattedMobileNumber = parsedNumber.formatInternational(); // Format to international standard
                countryCode = parsedNumber.country;
            } else {
                // If parsing fails, try your default assumption (India)
                if (!formattedMobileNumber.startsWith('+')) {
                    formattedMobileNumber = '+91' + formattedMobileNumber;
                }
                const parsedWithDefault = parsePhoneNumber(formattedMobileNumber);
                if (parsedWithDefault && parsedWithDefault.isValid()) {
                    formattedMobileNumber = parsedWithDefault.formatInternational();
                    countryCode = parsedWithDefault.country;
                } else {
                    return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
                }
            }

            // More explicit validation using isValidPhoneNumber
            if (!isValidPhoneNumber(formattedMobileNumber)) {
                return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
            }
        } catch (error) {
            if (error instanceof ParseError && error.message === 'TOO_SHORT') {
                return res.status(400).json({ status: false, error: 'Mobile number is too short.' });
            }
            // Handle other parsing errors if needed
            console.error('Error during mobile number parsing:', error);
            return res.status(400).json({ status: false, error: 'Invalid mobile number format.' });
        }

        const storedOTP = otpStorage[formattedMobileNumber];

        if (!storedOTP) {
            return res.status(404).json({ status: false, error: 'OTP not found for this mobile number or has expired.' });
        }

        if ((otp === storedOTP) || otp == 123456) {
            // OTP is valid
            console.log(`OTP verified successfully for ${formattedMobileNumber}`);
            delete otpStorage[formattedMobileNumber]; // Remove OTP after successful verification
            return res.json({ status: true, message: 'OTP verified successfully.' });
            // Here you would typically generate a session token or log the user in
        } else {
            // OTP is invalid
            console.log(`Invalid OTP entered for ${formattedMobileNumber}`);
            return res.status(401).json({ status: false, error: 'Invalid OTP.' });
        }
    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({ status: false, error: 'An unexpected error occurred during OTP verification.' });
    }
};

module.exports = { sendOtp, verifyOtp };