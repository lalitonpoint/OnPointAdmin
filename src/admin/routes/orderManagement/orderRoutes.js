
const express = require('express');
const router = express.Router();

const OrderCtrl = require('../../controllers/orderManagement/orderController');

router.get('/orderManagement', OrderCtrl.orderPage);

module.exports = router;
