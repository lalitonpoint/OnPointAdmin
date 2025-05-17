
const express = require('express');
const router = express.Router();

const WarehouseCtrl = require('../../controllers/warehouseManagement/warehouseController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');

router.get('/warehouseManagement', checkCrudPermission(), WarehouseCtrl.warehousePage);
router.post('/warehouseList', checkCrudPermission('isShow'), WarehouseCtrl.warehouseList);
router.get('/get/:id', checkCrudPermission('edit'), WarehouseCtrl.getwareHousebyId);
router.post('/editWarehouse/:id', checkCrudPermission('edit'), WarehouseCtrl.updateWarehouse); // Using POST for update
router.post('/addWarehouse', checkCrudPermission('add'), WarehouseCtrl.addWarehouse);
router.delete('/delete/:id', checkCrudPermission('delete'), WarehouseCtrl.deleteWarehouse);
router.delete('/delete/:id', checkCrudPermission('delete'), WarehouseCtrl.deleteWarehouse);
router.get("/downloadAllCsv", checkCrudPermission('export'), WarehouseCtrl.downloadAllCsv);

module.exports = router;
