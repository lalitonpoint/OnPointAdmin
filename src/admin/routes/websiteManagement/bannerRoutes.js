
const express = require('express');
const router = express.Router();

const BannerCtrl = require('../../controllers/websiteManagement/bannerController');

router.post("/bannerList", BannerCtrl.bannerList);
router.post("/saveBanner", BannerCtrl.saveBanner);
router.get('/bannerManagement', BannerCtrl.bannerPage);

module.exports = router;
