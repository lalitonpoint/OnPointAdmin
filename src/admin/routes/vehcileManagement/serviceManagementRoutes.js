const express = require('express');
const router = express.Router();

const serviceCtrl = require('../../controllers/vehcileManagement/serviceManagementController');


router.post('/serviceList', serviceCtrl.serviceList);
router.post('/addService', serviceCtrl.saveService);
router.post('/editService/:id', serviceCtrl.editService);
router.post('/changeStatus/:id', serviceCtrl.changeServiceStatus);

router.delete('/deleteService/:id', serviceCtrl.deleteService);

router.get('/serviceManagement', serviceCtrl.servicePage);
router.get('/getService/:id', serviceCtrl.getService);
router.get('/downloadAllCsv', serviceCtrl.downloadAllServicesCsv); // Add this route (already present, just confirming)


module.exports = router;