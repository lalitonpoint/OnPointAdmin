
const express = require('express');
const router = express.Router();

const { getWebsiteData } = require('./../controllers/webController')

router.get('/webdata', getWebsiteData);

module.exports = router;
