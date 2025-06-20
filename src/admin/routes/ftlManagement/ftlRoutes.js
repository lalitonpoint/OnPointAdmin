
const express = require('express');
const router = express.Router();

const FTLCtrl = require('../../controllers/ftlManagement/ftlcontroller');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.get('/ftlManagement', checkCrudPermission('isShow'), FTLCtrl.ftlPage);
router.post('/ftlList', checkCrudPermission('isShow'), FTLCtrl.ftlList);
// router.post('/orderAssignList', checkCrudPermission('isShow'), FTLCtrl.orderAssignList);

// router.get('/get/:id', checkCrudPermission('edit'), FTLCtrl.getPackageDetail);
// router.get('/getData/:id', checkCrudPermission('edit'), FTLCtrl.getDriverWarehouseData);

// router.post('/assignDriver', checkCrudPermission('edit'), FTLCtrl.assignDriver); // Using POST for update
// router.post('/updateOrderStatus', checkCrudPermission('edit'), FTLCtrl.updateOrderStatus); // Using POST for update
// router.post('/multiAssignDriver', checkCrudPermission('edit'), FTLCtrl.multiAssignDriver); // Using POST for update


// router.get('/ptlPackages', checkCrudPermission(), FTLCtrl.trackingPage);
// router.get('/warehouseData', checkCrudPermission(), FTLCtrl.warehouseData);



module.exports = router;
