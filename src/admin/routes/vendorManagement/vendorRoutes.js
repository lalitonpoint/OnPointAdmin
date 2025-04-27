const express = require('express');
const router = express.Router();

const vendorCtrl = require('../../controllers/vendorManagement/vendorController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');



router.get('/vendorManagement', checkCrudPermission(), vendorCtrl.vendorPage);
router.post('/vendorList', checkCrudPermission('isShow'), vendorCtrl.vendorList);
router.get('/get/:id', checkCrudPermission('edit'), vendorCtrl.getvendorbyId);
router.post('/editVendor/:id', checkCrudPermission('edit'), vendorCtrl.editVendor); // Using POST for update
router.post('/addVendor', checkCrudPermission('add'), vendorCtrl.addVendor);
router.delete('/delete/:id', checkCrudPermission('delete'), vendorCtrl.deletevendor);
router.get('/downloadCsv', checkCrudPermission('export'), vendorCtrl.downloadTrackingCsv);


module.exports = router;