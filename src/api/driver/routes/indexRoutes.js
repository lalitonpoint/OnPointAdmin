const express = require('express');
const router = express.Router();

const otpRoutes = require('./otpRoutes');
const driverRoutes = require('./driverRoutes');
const truckRoutes = require('./truckRoutes');
const notificationRoutes = require('./notificationRoutes'); // Ensure correct path
const hambergerRoutes = require('./hambergerRoutes'); // Ensure correct path
const serviceRoutes = require('./serviceRoutes'); // Ensure correct path
const walletRoutes = require('./walletRoutes'); // Ensure correct path
const { verifyToken, headerAuth } = require('../middleware/authentication');


router.use('/otp', otpRoutes);
router.use(headerAuth);
router.use('/profile', driverRoutes);
router.use('/truck', truckRoutes);
router.use('/notification', notificationRoutes);
router.use('/hamberger', hambergerRoutes);


router.use(verifyToken);
router.use('/service', serviceRoutes);
router.use('/wallet', walletRoutes);


module.exports = router;
