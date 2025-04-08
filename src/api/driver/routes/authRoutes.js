const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.post('/send-otp', AuthController.sendOTP); // Send OTP
router.post('/verify-otp', AuthController.verifyOTP); // Verify OTP and login

module.exports = router;
