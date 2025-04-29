
const express = require('express');
const router = express.Router();

const { razorpayWebhook } = require('../controllers/razorpayController')

router.get('/webhook', razorpayWebhook);

module.exports = router;
