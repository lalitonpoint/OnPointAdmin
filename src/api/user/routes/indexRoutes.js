const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
const servicesRoutes = require('./serviceRoutes');
const { verifyToken } = require('../middleware/authentication');
router.use('/otp', sendOtpRoutes);

router.use('/user', verifyToken, userRoutes);
router.use('/service', verifyToken, servicesRoutes);

module.exports = router;
