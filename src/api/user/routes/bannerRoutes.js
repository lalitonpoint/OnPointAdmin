
const express = require('express');
const router = express.Router();

const { getBannerData } = require('../controllers/bannerController')

router.get('/detail', getBannerData);

module.exports = router;
