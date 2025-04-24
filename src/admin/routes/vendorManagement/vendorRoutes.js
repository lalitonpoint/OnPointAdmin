const express = require('express');
const router = express.Router();

const vendorCtrl = require('../../controllers/vendorManagement/vendorController');



router.get('/vendorManagement', vendorCtrl.vendorPage);
// router.get('/warehouseManagement', WarehouseCtrl.warehousePage);
 router.post('/vendorList', vendorCtrl.vendorList);
router.get('/get/:id', vendorCtrl.getvendorbyId);
 router.post('/editVendor/:id', vendorCtrl.editVendor); // Using POST for update
router.post('/addVendor', vendorCtrl.addVendor);
 router.delete('/delete/:id', vendorCtrl.deletevendor);

module.exports = router;