
const express = require('express');
const router = express.Router();

const TestimonialCtrl = require('../../controllers/websiteManagement/testimonialController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.post('/testimonialList', checkCrudPermission('isShow'), TestimonialCtrl.testimonialList);
router.post('/addTestimonial', checkCrudPermission('add'), TestimonialCtrl.saveTestimonial);
router.post('/editTestimonial/:id', checkCrudPermission('edit'), TestimonialCtrl.editTestimonial);
router.post('/changeStatus/:id', checkCrudPermission('edit'), TestimonialCtrl.changeStatus);

router.delete('/deleteTestimonial/:id', checkCrudPermission('delete'), TestimonialCtrl.deleteTestimonial);

router.get('/testimonialManagement', checkCrudPermission(), TestimonialCtrl.testmonialPage);
router.get('/getTestimonial/:id', checkCrudPermission('edit'), TestimonialCtrl.getTestimonial);
router.get('/downloadAllCsv', checkCrudPermission('export'), TestimonialCtrl.downloadAllTestimonialsCsv); // Add this route



module.exports = router;

