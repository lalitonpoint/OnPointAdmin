
const express = require('express');
const router = express.Router();

const { getOrderList, singleOrderDetail } = require('../controllers/orderController')

router.post('/myOrder', getOrderList);
router.post('/orderDetail', singleOrderDetail);

module.exports = router;
