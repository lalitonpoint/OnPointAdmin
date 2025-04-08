const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
router.use('/otp', sendOtpRoutes);

module.exports = router;
