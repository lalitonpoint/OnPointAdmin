const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
router.use('/otp', sendOtpRoutes);
router.use('/user', userRoutes);

module.exports = router;
