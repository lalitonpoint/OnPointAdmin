const express = require('express');
const router = express.Router();

const vendorCtrl = require('../../controllers/vendorManagement/vendorController');



router.get('/vendorManagement', vendorCtrl.vendorPage);


module.exports = router;