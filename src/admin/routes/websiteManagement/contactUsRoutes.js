
const express = require('express');
const router = express.Router();

const ContactCtrl = require('../../controllers/websiteManagement/contactUsController');


router.post('/contactList', ContactCtrl.contactList);
router.post('/saveContact', ContactCtrl.saveContact);
router.put('/editContact/:id', ContactCtrl.editContact);
router.get('/contactUs', ContactCtrl.contactUsPage);
router.get('/getContact/:id', ContactCtrl.getContact);
router.delete('/delContact/:id', ContactCtrl.deleteContact);


module.exports = router;


