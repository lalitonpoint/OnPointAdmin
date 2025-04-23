
const express = require('express');
const router = express.Router();

const { addPaymentDetail, completePayment, initiatePaymentMethod, verifyPayment } = require('../controllers/paymentController')

router.post('/initiatePayment', addPaymentDetail);
router.post('/completePayment', completePayment);
router.post('/initialPay', initiatePaymentMethod);
router.post('/verifyPayment', verifyPayment);

module.exports = router;
