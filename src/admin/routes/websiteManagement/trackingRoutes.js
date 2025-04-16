
const express = require('express');
const router = express.Router();

const TrackingCtrl = require('../../controllers/websiteManagement/trackingController');


router.post('/trackingList', TrackingCtrl.trackingList);
router.get('/trackingPage', TrackingCtrl.trackingPage);
router.post('/addTracking', TrackingCtrl.addTracking);




router.get('/get/:id', TrackingCtrl.getTrackingById);

router.post('/editTracking/:id', TrackingCtrl.updateTracking); // Using POST for update

router.delete('/delete/:id', TrackingCtrl.deleteTracking);

router.get('/download-csv', TrackingCtrl.downloadTrackingCsv);


module.exports = router;

