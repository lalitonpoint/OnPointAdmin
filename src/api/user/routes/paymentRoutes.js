
const express = require('express');
const router = express.Router();

const { addPaymentDetail, verifyPayment, estimatePriceCalculation, ftlOrderInitiate } = require('../controllers/paymentController')

router.post('/initiatePayment', addPaymentDetail);
router.post('/verifyPayment', verifyPayment);
router.post('/estimatePrice', estimatePriceCalculation);
router.post('/ftlOrderInitiate', ftlOrderInitiate);

module.exports = router;
