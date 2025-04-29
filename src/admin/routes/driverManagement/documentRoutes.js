
const express = require('express');
const router = express.Router();

const DocumentCtrl = require('../../controllers/driverManagement/documentController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');

router.post('/saveDocument', checkCrudPermission('add'), DocumentCtrl.saveDocument);
router.post('/documentList', checkCrudPermission('isShow'), DocumentCtrl.documentList);
router.post('/updateDocument/:id', checkCrudPermission('edit'), DocumentCtrl.updateDocument);
router.delete('/deleteDocument/:id', checkCrudPermission('delete'), DocumentCtrl.deleteDocument);
router.get('/documentManagement', checkCrudPermission(), DocumentCtrl.documentPage);
router.get('/getDocument/:id', checkCrudPermission('edit'), DocumentCtrl.getSingleDocument);



module.exports = router;
