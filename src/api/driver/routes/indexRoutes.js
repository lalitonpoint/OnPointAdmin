const express = require('express');
const router = express.Router();

const otpRoutes = require('./otpRoutes');
const driverRoutes = require('./driverRoutes');
const truckRoutes = require('./truckRoutes');

router.use('/otp', otpRoutes);
router.use('/profile', driverRoutes);
router.use('/truck', truckRoutes);

module.exports = router;
