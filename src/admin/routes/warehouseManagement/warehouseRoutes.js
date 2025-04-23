
const express = require('express');
const router = express.Router();

const WarehouseCtrl = require('../../controllers/warehouseManagement/warehouseController');

router.get('/warehouseManagement', WarehouseCtrl.warehousePage);
router.get('/get/:id', WarehouseCtrl.getwareHousebyId);
router.post('/editWarehouse/:id', WarehouseCtrl.updateWarehouse); // Using POST for update
router.post('/addWarehouse', WarehouseCtrl.addWarehouse);
router.delete('/delete/:id', WarehouseCtrl.deleteWarehouse);




module.exports = router;
