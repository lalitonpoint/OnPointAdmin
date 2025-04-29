const express = require('express');
const router = express.Router();
const FaqCtrl = require('../../controllers/faqManagement/faqController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');

router.get('/faqManagement', checkCrudPermission(), FaqCtrl.faqPage);
router.post('/faqList', checkCrudPermission('isShow'), FaqCtrl.faqList);
router.post('/createFaq', checkCrudPermission('add'), FaqCtrl.faqCreate);
router.get('/getFaq/:id', checkCrudPermission('edit'), FaqCtrl.getFaq);
router.post('/updateFaq/:id', checkCrudPermission('edit'), FaqCtrl.updateFaq);
router.delete('/deleteFaq/:id', checkCrudPermission('delete'), FaqCtrl.deleteFaq);
router.post('/changeStatus/:id', checkCrudPermission('edit'), FaqCtrl.changeStatus);

module.exports = router;
