
const express = require('express');
const router = express.Router();

const TrackingCtrl = require('../../controllers/ptlPackages/ptlPackages');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.post('/trackingList', checkCrudPermission('isShow'), TrackingCtrl.trackingList);

router.get('/get/:id', checkCrudPermission('edit'), TrackingCtrl.getTrackingById);

router.post('/editTracking/:id', checkCrudPermission('edit'), TrackingCtrl.updateTracking); // Using POST for update


router.get('/ptlPackages', checkCrudPermission(), TrackingCtrl.trackingPage);



module.exports = router;




module.exports = router;
