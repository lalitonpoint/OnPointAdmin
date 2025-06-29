
const express = require('express');
const router = express.Router();

const { createDriver, updateDriver } = require('../controllers/driverController')
const { addBankDetails } = require('../controllers/driverBankDetail')

router.post('/createDriver', createDriver);
router.post('/updateDriver', updateDriver);
router.post('/bankDetails', addBankDetails);



module.exports = router;
