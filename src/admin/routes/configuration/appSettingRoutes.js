const express = require('express');
const router = express.Router();

const ConfigrationCtrl = require('../../controllers/configuration/configrationController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');

router.post("/saveSetting", checkCrudPermission('add'), ConfigrationCtrl.saveSettings);
router.get('/appSetting', checkCrudPermission(), ConfigrationCtrl.appSetting);
router.get('/getSettings', checkCrudPermission('edit'), ConfigrationCtrl.getSettings);

module.exports = router;
