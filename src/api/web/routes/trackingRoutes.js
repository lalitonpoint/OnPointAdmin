
const express = require('express');
const router = express.Router();

const { getTrackingData } = require('./../controllers/trackingController')
const { getWareHouseAvailablity } = require('./../controllers/webController')
router.post('/trackingData', getTrackingData);
router.post('/checkWarehouseAvailablity', getWareHouseAvailablity);
module.exports = router;
