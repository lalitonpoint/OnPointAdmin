const express = require('express');
const router = express.Router();

const BannerCtrl = require('../../controllers/websiteManagement/bannerController');

router.post("/bannerList", BannerCtrl.bannerList);
router.post("/saveBanner", BannerCtrl.saveBanner); // Assuming saveBanner handles both add and edit
router.post("/editBanner/:id", BannerCtrl.updatedBanner); // Assuming saveBanner handles both add and edit
router.get("/getBanner/:id", BannerCtrl.getBanner);
router.delete("/deleteBanner/:id", BannerCtrl.deleteBanner);
router.post("/changeStatus/:id", BannerCtrl.changeStatus);
router.get("/downloadAllCsv", BannerCtrl.downloadAllCsv);
router.get('/bannerManagement', BannerCtrl.bannerPage);

module.exports = router;