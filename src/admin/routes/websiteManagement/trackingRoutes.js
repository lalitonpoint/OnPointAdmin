
const express = require('express');
const router = express.Router();

const TrackingCtrl = require('../../controllers/websiteManagement/trackingController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');
const multer = require('multer'); // ✅ <-- This line is missing in your file

const upload = multer({ dest: 'uploads/' });

router.post('/trackingList', checkCrudPermission('isShow'), TrackingCtrl.trackingList);
router.get('/trackingPage', checkCrudPermission(), TrackingCtrl.trackingPage);
router.post('/addTracking', checkCrudPermission('add'), TrackingCtrl.addTracking);

router.get('/get/:id', checkCrudPermission('edit'), TrackingCtrl.getTrackingById);

router.post('/editTracking/:id', checkCrudPermission('edit'), TrackingCtrl.updateTracking); // Using POST for update

router.delete('/delete/:id', checkCrudPermission('delete'), TrackingCtrl.deleteTracking);

router.get('/downloadCsv', checkCrudPermission('export'), TrackingCtrl.downloadTrackingCsv);
router.post('/upload-csv', checkCrudPermission('export'), upload.single('file'), TrackingCtrl.UploadCsv);
router.get('/states', checkCrudPermission('isShow'), TrackingCtrl.states);
router.get('/cities', checkCrudPermission('isShow'), TrackingCtrl.cities);


module.exports = router;

