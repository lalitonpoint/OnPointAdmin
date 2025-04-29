const express = require('express');
const router = express.Router();

const truckCtrl = require('../../controllers/vehcileManagement/truckManagementController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');

// Vehicle Management Routes
router.get('/vehicleManagement', checkCrudPermission(), truckCtrl.vechiclePage);
router.post('/vehicleList', checkCrudPermission('isShow'), truckCtrl.vehicleList);

router.post('/addvehicle', checkCrudPermission('add'), truckCtrl.saveVehicle);
router.get('/getVehicle/:id', checkCrudPermission('edit'), truckCtrl.singleVehcile);
router.post('/updateVehicle/:id', checkCrudPermission('edit'), truckCtrl.updateVehicle);
router.delete('/deleteVehicle/:id', checkCrudPermission('delete'), truckCtrl.deleteVehicle);

module.exports = router;
