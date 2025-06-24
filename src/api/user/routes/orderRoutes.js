
const express = require('express');
const router = express.Router();

const { getOrderList, singleOrderDetail, ftlOrderCancel, ftlOrderList, ftlSingleOrderDetail } = require('../controllers/orderController')

router.get('/myOrder', getOrderList);
router.post('/orderDetail', singleOrderDetail);
router.post('/ftlCancelOrder', ftlOrderCancel);
router.get('/ftlOrderList', ftlOrderList);
router.post('/ftlSingleOrderDetail', ftlSingleOrderDetail);
router.post('/ftlSingleOrderDetail', ftlSingleOrderDetail);

module.exports = router;

