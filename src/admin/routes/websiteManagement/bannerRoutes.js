const express = require('express');
const router = express.Router();

const BannerCtrl = require('../../controllers/websiteManagement/bannerController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.get('/bannerManagement', checkCrudPermission('isShow'), BannerCtrl.bannerPage);

router.post("/saveBanner", checkCrudPermission('add'), BannerCtrl.saveBanner); // Assuming saveBanner handles both add and edit
router.post("/editBanner/:id", checkCrudPermission('edit'), BannerCtrl.updatedBanner); // Assuming saveBanner handles both add and edit
router.delete("/deleteBanner/:id", checkCrudPermission('delete'), BannerCtrl.deleteBanner);
router.get("/downloadAllCsv", checkCrudPermission('export'), BannerCtrl.downloadAllCsv);

router.get("/getBanner/:id", checkCrudPermission('edit'), BannerCtrl.getBanner);
router.post("/changeStatus/:id", checkCrudPermission('edit'), BannerCtrl.changeStatus);
router.post("/bannerList", checkCrudPermission('isShow'), BannerCtrl.bannerList);


module.exports = router;