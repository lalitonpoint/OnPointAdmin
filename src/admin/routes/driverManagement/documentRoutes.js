
const express = require('express');
const router = express.Router();

const DocumentCtrl = require('../../controllers/driverManagement/documentController');

router.post('/saveDocument', DocumentCtrl.saveDocument);
router.post('/documentList', DocumentCtrl.documentList);
router.post('/updateDocument/:id', DocumentCtrl.updateDocument);
router.delete('/deleteDocument/:id', DocumentCtrl.deleteDocument);
router.get('/documentManagement', DocumentCtrl.documentPage);
router.get('/getDocument/:id', DocumentCtrl.getSingleDocument);



module.exports = router;
