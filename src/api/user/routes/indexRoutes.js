const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
const servicesRoutes = require('./serviceRoutes');
router.use('/otp', sendOtpRoutes);

router.use('/user', userRoutes);
router.use('/service', servicesRoutes);

module.exports = router;
