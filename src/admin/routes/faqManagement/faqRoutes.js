const express = require('express');
const router = express.Router();
const FaqCtrl = require('../../controllers/faqManagement/faqController');

router.get('/faqManagement', FaqCtrl.faqPage);
router.post('/faqList', FaqCtrl.faqList);
router.post('/createFaq', FaqCtrl.faqCreate);
router.get('/getFaq/:id', FaqCtrl.getFaq);
router.post('/updateFaq/:id', FaqCtrl.updateFaq);
router.delete('/deleteFaq/:id', FaqCtrl.deleteFaq);
router.post('/changeStatus/:id', FaqCtrl.changeStatus);

module.exports = router;
