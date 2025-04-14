
const express = require('express');
const router = express.Router();

const TrackingCtrl = require('../../controllers/websiteManagement/trackingController');


router.post('/trackingList', TrackingCtrl.trackingList);
router.get('/trackingPage', TrackingCtrl.trackingPage);
router.post('/addTracking', TrackingCtrl.addTracking);



module.exports = router;

