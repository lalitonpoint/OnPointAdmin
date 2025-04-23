
const express = require('express');
const router = express.Router();

const { getOrderList } = require('../controllers/orderController')

router.post('/orderData', getOrderList);

module.exports = router;
