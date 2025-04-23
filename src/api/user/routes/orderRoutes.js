
const express = require('express');
const router = express.Router();

const { getOrderData } = require('../controllers/orderController')

router.post('/orderData', getOrderData);

module.exports = router;
