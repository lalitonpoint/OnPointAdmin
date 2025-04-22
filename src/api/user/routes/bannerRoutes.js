
const express = require('express');
const router = express.Router();

const { getBannerData } = require('../controllers/bannerController')

router.post('/detail', getBannerData);

module.exports = router;
