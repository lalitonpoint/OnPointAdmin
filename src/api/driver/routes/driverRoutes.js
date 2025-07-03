
const express = require('express');
const router = express.Router();

const { createDriver, updateDriver, driverOnlineOffline } = require('../controllers/driverController')
const { addBankDetails, getBankDetails } = require('../controllers/driverBankDetail')

router.post('/createDriver', createDriver);
router.post('/updateDriver', updateDriver);
router.post('/bankDetails', addBankDetails);
router.get('/getBankDetails', getBankDetails);
router.post('/driverOnlineOffline', driverOnlineOffline);



module.exports = router;
