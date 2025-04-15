const express = require('express');
const router = express.Router();

const truckCtrl = require('../../controllers/vehcileManagement/truckManagementController');

router.get('/vehicleManagement', truckCtrl.vechiclePage);
router.post('/saveVehicle', truckCtrl.saveVehicle);

router.post('/vehicleList', truckCtrl.vehicleList);
router.get('/getVehicle/:id', truckCtrl.singleVehcile);
// router.post('/updateVechile/:id', truckCtrl.updateVehcile);
// router.delete('/deleteVehcile/:id', truckCtrl.deleteVehcile);

module.exports = router;
