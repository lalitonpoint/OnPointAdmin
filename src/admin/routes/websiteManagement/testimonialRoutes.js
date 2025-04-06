
const express = require('express');
const router = express.Router();

const TestimonialCtrl = require('../../controllers/websiteManagement/testimonialController');


router.post('/testimonialList', TestimonialCtrl.testimonialList);
router.post('/addTestimonial', TestimonialCtrl.saveTestimonial);
router.post('/editTestimonial/:id', TestimonialCtrl.editTestimonial);
router.post('/changeStatus/:id', TestimonialCtrl.changeStatus);

router.delete('/deleteTestimonial/:id', TestimonialCtrl.deleteTestimonial);

router.get('/testimonialManagement', TestimonialCtrl.testmonialPage);
router.get('/getTestimonial/:id', TestimonialCtrl.getTestimonial);
router.get('/downloadAllCsv', TestimonialCtrl.downloadAllTestimonialsCsv); // Add this route



module.exports = router;

