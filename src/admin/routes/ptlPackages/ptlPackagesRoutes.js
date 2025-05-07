
const express = require('express');
const router = express.Router();

const PtlCtrl = require('../../controllers/ptlPackages/ptlPackagesController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.post('/trackingList', checkCrudPermission('isShow'), PtlCtrl.trackingList);
router.post('/orderAssignList', checkCrudPermission('isShow'), PtlCtrl.orderAssignList);

router.get('/get/:id', checkCrudPermission('edit'), PtlCtrl.getPackageDetail);
router.get('/getData/:id', checkCrudPermission('edit'), PtlCtrl.getDriverWarehouseData);

router.post('/assignDriver', checkCrudPermission('edit'), PtlCtrl.assignDriver); // Using POST for update
router.post('/updateOrderStatus', checkCrudPermission('edit'), PtlCtrl.updateOrderStatus); // Using POST for update


router.get('/ptlPackages', checkCrudPermission(), PtlCtrl.trackingPage);



module.exports = router;




module.exports = router;
