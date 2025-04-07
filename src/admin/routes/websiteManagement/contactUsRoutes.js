
const express = require('express');
const router = express.Router();

const ContactCtrl = require('../../controllers/websiteManagement/contactUsController');


router.get('/contactUs', ContactCtrl.contactUsPage);
router.post('/contactList', ContactCtrl.contactList);
router.get('/downloadAllCsv', ContactCtrl.downloadAllContactsCsv);

module.exports = router;


