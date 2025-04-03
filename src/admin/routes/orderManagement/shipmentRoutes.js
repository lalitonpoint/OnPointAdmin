
const express = require('express');
const router = express.Router();
const ShipmentCtrl = require('../../controllers/orderManagement/shipmentController');

router.get('/shipmentManagement', ShipmentCtrl.shipmentPage);

module.exports = router;
