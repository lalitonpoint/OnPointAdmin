const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
const servicesRoutes = require('./serviceRoutes');
const paymentRoutes = require('./paymentRoutes');
const faqRoutes = require('./faqRoutes');
const configurationRoutes = require('./configurationRoutes');
const bannerRoutes = require('./bannerRoutes');
const ratingRoutes = require('./ratingRoutes');
const orderRoutes = require('./orderRoutes');
const razorpayRoutes = require('./razorpayRoutes');

const { verifyToken, headerAuth } = require('../middleware/authentication');
const razorpayInstance = require('../utils/rajorpay');
router.use('/otp', sendOtpRoutes);
router.use('/razorpay', razorpayRoutes);

router.use(headerAuth);
router.use('/user', userRoutes);
router.use('/setting', configurationRoutes);

router.use(verifyToken);
router.use('/service', servicesRoutes);
router.use('/payment', paymentRoutes);
// router.use('/faq', faqRoutes);
// router.use('/parcel', parcelRoutes);
router.use('/banner', bannerRoutes);
router.use('/rating', ratingRoutes);
router.use('/order', orderRoutes);

module.exports = router;
