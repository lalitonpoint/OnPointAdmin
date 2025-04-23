
const express = require('express');
const router = express.Router();

const WarehouseCtrl = require('../../controllers/warehouseManagement/warehouseController');

router.get('/warehouseManagement', WarehouseCtrl.warehousePage);

module.exports = router;
