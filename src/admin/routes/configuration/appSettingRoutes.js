const express = require('express');
const router = express.Router();

const ConfigrationCtrl = require('../../controllers/configuration/configrationController');

router.post("/saveSetting", ConfigrationCtrl.saveSettings);
router.get('/appSetting', ConfigrationCtrl.appSetting);
router.get('/getSettings', ConfigrationCtrl.getSettings);

module.exports = router;
