
const express = require('express');
const router = express.Router();

const { addPaymentDetail, completePayment } = require('../controllers/paymentController')

router.post('/initiatePayment', addPaymentDetail);
router.post('/completePayment', completePayment);

module.exports = router;
