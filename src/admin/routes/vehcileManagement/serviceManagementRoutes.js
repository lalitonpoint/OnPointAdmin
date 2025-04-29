const express = require('express');
const router = express.Router();

const serviceCtrl = require('../../controllers/vehcileManagement/serviceManagementController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.post('/serviceList', checkCrudPermission('isShow'), serviceCtrl.serviceList);
router.post('/addService', checkCrudPermission('add'), serviceCtrl.saveService);
router.post('/editService/:id', checkCrudPermission('edit'), serviceCtrl.editService);
router.post('/changeStatus/:id', checkCrudPermission('edit'), serviceCtrl.changeServiceStatus);

router.delete('/deleteService/:id', checkCrudPermission('delete'), serviceCtrl.deleteService);

router.get('/serviceManagement', checkCrudPermission(), serviceCtrl.servicePage);
router.get('/getService/:id', checkCrudPermission('edit'), serviceCtrl.getService);
router.get('/downloadAllCsv', checkCrudPermission('export'), serviceCtrl.downloadAllServicesCsv); // Add this route (already present, just confirming)


module.exports = router;