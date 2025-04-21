const express = require('express');
const router = express.Router();

const sendOtpRoutes = require('./otpRoutes');
const userRoutes = require('./userRoutes');
const servicesRoutes = require('./serviceRoutes');
const paymentRoutes = require('./paymentRoutes');
const faqRoutes = require('./faqRoutes');
const configurationRoutes = require('./configurationRoutes');
const parcelRoutes = require('./parcelRoutes');

const { verifyToken, headerAuth } = require('../middleware/authentication');
router.use('/otp', sendOtpRoutes);

router.use(headerAuth);
router.use('/user', userRoutes);
router.use('/setting', configurationRoutes);

router.use(verifyToken);
router.use('/service', servicesRoutes);
router.use('/payment', paymentRoutes);
// router.use('/faq', faqRoutes);
router.use('/parcel', parcelRoutes);



module.exports = router;
