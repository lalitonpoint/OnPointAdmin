
const express = require('express');
const router = express.Router();

const WarehouseCtrl = require('../../controllers/warehouseManagement/warehouseController');


router.post('/warehouseList', WarehouseCtrl.warehouseList);
router.get('/warehouseManagement', WarehouseCtrl.warehousePage);
router.get('/get/:id', WarehouseCtrl.getwareHousebyId);
router.post('/editWarehouse/:id', WarehouseCtrl.updateWarehouse); // Using POST for update
router.post('/addWarehouse', WarehouseCtrl.addWarehouse);




module.exports = router;
