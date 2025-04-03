
const express = require('express');
const router = express.Router();

const GalleryCtrl = require('../../controllers/websiteManagement/galleryController');

router.get('/galleryManagement', GalleryCtrl.galleryPage);

module.exports = router;
