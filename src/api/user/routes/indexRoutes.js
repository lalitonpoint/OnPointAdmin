const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
const servicesRoutes = require('./serviceRoutes');
const { verifyToken } = require('../middleware/authentication');
router.use('/otp', sendOtpRoutes);

router.use(verifyToken);

router.use('/user', userRoutes);
router.use('/service', servicesRoutes);

module.exports = router;
