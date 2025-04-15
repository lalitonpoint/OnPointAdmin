const express = require('express');
const router = express.Router();

const truckCtrl = require('../../controllers/vehcileManagement/truckManagementController');

// Vehicle Management Routes
router.get('/vehicleManagement', truckCtrl.vechiclePage);
router.post('/vehicleList', truckCtrl.vehicleList);

router.post('/saveVehicle', truckCtrl.saveVehicle);
// router.get('/getVehicle/:id', truckCtrl.singleVehicle);
// router.post('/updateVehicle/:id', truckCtrl.updateVehicle);
// router.delete('/deleteVehicle/:id', truckCtrl.deleteVehicle);

module.exports = router;
