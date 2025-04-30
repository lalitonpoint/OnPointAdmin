
const express = require('express');
const router = express.Router();

const { getOrderList, singleOrderDetail } = require('../controllers/orderController')

router.get('/myOrder', getOrderList);
router.post('/orderDetail', singleOrderDetail);

module.exports = router;

