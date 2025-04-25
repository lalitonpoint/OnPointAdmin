
const express = require('express');
const router = express.Router();

const ContactCtrl = require('../../controllers/websiteManagement/contactUsController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.get('/contactUs', checkCrudPermission(), ContactCtrl.contactUsPage);
router.post('/contactList', checkCrudPermission('isShow'), ContactCtrl.contactList);
router.get('/downloadAllCsv', checkCrudPermission('export'), ContactCtrl.downloadAllContactsCsv);

module.exports = router;


