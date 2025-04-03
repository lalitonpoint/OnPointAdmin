
const express = require('express');
const router = express.Router();

const TestimonialCtrl = require('../../controllers/websiteManagement/testimonialController');


router.post('/testimonialList', TestimonialCtrl.testimonialList);
router.post('/addTestimonial', TestimonialCtrl.saveTestimonial);
router.post('/editTestimonial', TestimonialCtrl.editTestimonial);
router.post('/delTestimonial', TestimonialCtrl.deleteTestimonial);

router.get('/testimonialManagement', TestimonialCtrl.testmonialPage);
router.get('/getTestimonial/:id', TestimonialCtrl.getTestimonial);


module.exports = router;

