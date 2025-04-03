const express = require('express');
const router = express.Router();

const ConfigrationCtrl = require('../../controllers/configuration/configrationController');

router.post("/configuration/saveSetting", ConfigrationCtrl.saveSettings);
router.get('/appSetting', ConfigrationCtrl.appSetting);

module.exports = router;
