const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
const servicesRoutes = require('./serviceRoutes');
const paymentRoutes = require('./paymentRoutes');
const faqRoutes = require('./faqRoutes');

const { verifyToken } = require('../middleware/authentication');
router.use('/otp', sendOtpRoutes);
router.use('/user', userRoutes);

router.use(verifyToken);
router.use('/service', servicesRoutes);
router.use('/payment', paymentRoutes);
router.use('/faq', faqRoutes);


module.exports = router;
