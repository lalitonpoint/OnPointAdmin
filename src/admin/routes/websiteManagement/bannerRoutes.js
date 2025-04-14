const express = require('express');
const router = express.Router();

const BannerCtrl = require('../../controllers/websiteManagement/bannerController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.get('/bannerManagement', checkCrudPermission, BannerCtrl.bannerPage);

router.post("/saveBanner", BannerCtrl.saveBanner); // Assuming saveBanner handles both add and edit
router.post("/editBanner/:id", BannerCtrl.updatedBanner); // Assuming saveBanner handles both add and edit
router.delete("/deleteBanner/:id", BannerCtrl.deleteBanner);
router.get("/downloadAllCsv", BannerCtrl.downloadAllCsv);

router.get("/getBanner/:id", BannerCtrl.getBanner);
router.post("/changeStatus/:id", BannerCtrl.changeStatus);
router.post("/bannerList", BannerCtrl.bannerList);


module.exports = router;