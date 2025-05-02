const express = require('express');
const router = express.Router();

const otpRoutes = require('./otpRoutes');
const driverRoutes = require('./driverRoutes');
const truckRoutes = require('./truckRoutes');
const notificationRoutes = require('./notificationRoutes'); // Ensure correct path
const hambergerRoutes = require('./hambergerRoutes'); // Ensure correct path


router.use('/otp', otpRoutes);
router.use('/profile', driverRoutes);
router.use('/truck', truckRoutes);
router.use('/notification', notificationRoutes);
router.use('/hamberger', hambergerRoutes);


module.exports = router;
