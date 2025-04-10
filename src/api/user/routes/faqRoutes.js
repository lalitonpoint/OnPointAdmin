
const express = require('express');
const router = express.Router();

const { getFaq } = require('../controllers/faqController')

router.get('/getFaq', getFaq);

module.exports = router;
