
const express = require('express');
const router = express.Router();

const { getSettingData } = require('../controllers/configurationController')

router.post('/detail', getSettingData);

module.exports = router;
