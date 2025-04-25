
const express = require('express');
const router = express.Router();

const { addPaymentDetail, verifyPayment } = require('../controllers/paymentController')

router.post('/initiatePayment', addPaymentDetail);
router.post('/verifyPayment', verifyPayment);

module.exports = router;
