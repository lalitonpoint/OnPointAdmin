
const express = require('express');
const router = express.Router();

const DriverCtrl = require('../../controllers/driverManagement/driverController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.post('/saveDrivers', checkCrudPermission('add'), DriverCtrl.saveDrivers);
router.post('/driverList', checkCrudPermission('isShow'), DriverCtrl.driverList);
router.get('/driverManagement', checkCrudPermission(), DriverCtrl.driverPage);
router.get('/getDriver/:id', checkCrudPermission('edit'), DriverCtrl.singleDriver);
router.post('/updateDriver/:id', checkCrudPermission('edit'), DriverCtrl.updateDriver);
router.delete('/deleteDriver/:id', checkCrudPermission('delete'), DriverCtrl.deleteDriver);
router.post('/updateApproval', checkCrudPermission('edit'), DriverCtrl.updateApproval);


module.exports = router;
