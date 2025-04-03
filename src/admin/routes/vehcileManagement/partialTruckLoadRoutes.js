const express = require('express');
const router = express.Router();

const ptlCtrl = require('../../controllers/vehcileManagement/partialTruckLoadController');

router.get('/ptlManagement', ptlCtrl.ptlPage);
router.post('/saveVehicle', ptlCtrl.saveVehicle);

router.post('/vehicleList', ptlCtrl.vehicleList);
router.get('/getVehicle/:id', ptlCtrl.singleVehcile);
// router.post('/updateVechile/:id', ptlCtrl.updateVehcile);
// router.delete('/deleteVehcile/:id', ptlCtrl.deleteVehcile);

module.exports = router;
