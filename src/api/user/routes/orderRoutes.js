
const express = require('express');
const router = express.Router();

const { getOrderList, singleOrderDetail, ftlOrderCancel } = require('../controllers/orderController')

router.get('/myOrder', getOrderList);
router.post('/orderDetail', singleOrderDetail);
router.post('/ftlCancelOrder', ftlOrderCancel);

module.exports = router;

