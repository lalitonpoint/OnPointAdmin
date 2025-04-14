
const express = require('express');
const router = express.Router();

const { getTrackingData } = require('./../controllers/trackingController')

router.post('/trackingData', getTrackingData);

module.exports = router;
