
const express = require('express');
const router = express.Router();

const DriverCtrl = require('../../controllers/driverManagement/driverController');


router.post('/saveDrivers', DriverCtrl.saveDrivers);
router.post('/driverList', DriverCtrl.driverList);
router.get('/driverManagement', DriverCtrl.driverPage);
router.get('/getDriver/:id', DriverCtrl.singleDriver);
router.post('/updateDriver/:id', DriverCtrl.updateDriver);
router.delete('/deleteDriver/:id', DriverCtrl.deleteDriver);


module.exports = router;
