
const express = require('express');
const router = express.Router();

const { getSettingSection } = require('../controllers/configurationController')

router.post('/detail', getSettingSection);

module.exports = router;
