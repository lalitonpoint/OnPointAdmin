const express = require('express');
const router = express.Router();

const otpRoutes = require('./otpRoutes');
router.use('/otp', otpRoutes);

module.exports = router;
