
const express = require('express');
const router = express.Router();

const { getTrackingData } = require('./../controllers/trackingController')
const { getWebsiteData ,getWareHouseList} = require('./../controllers/webController')
router.post('/trackingData', getTrackingData);
router.post('/getWareHouseList', getWareHouseList);
module.exports = router;
