const express = require('express');
const router = express.Router();

const otpRoutes = require('./otpRoutes');
const driverRoutes = require('./driverRoutes');

router.use('/otp', otpRoutes);
router.use('/profile', driverRoutes);

module.exports = router;
