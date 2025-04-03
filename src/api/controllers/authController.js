const User = require('../models/User');
const { generateOTP, isOTPValid } = require('../utils/otpService');
const jwt = require('jsonwebtoken');

const sendOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });

        let user = await User.findOne({ mobile });
        if (!user) user = await User.create({ mobile });

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Simulate sending OTP (Replace with actual SMS API)
        console.log(`OTP for ${mobile}: ${otp}`);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending OTP' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) return res.status(400).json({ message: 'Mobile and OTP are required' });

        const user = await User.findOne({ mobile });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp || !isOTPValid(user.otpExpires)) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Clear OTP after successful login
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Error verifying OTP' });
    }
};

const test = () => {
    res.status(200).json({ msg: 'Api Running' });
}

module.exports = { sendOTP, verifyOTP, test }
