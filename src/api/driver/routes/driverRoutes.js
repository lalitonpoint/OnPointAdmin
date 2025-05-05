
const express = require('express');
const router = express.Router();

const { createDriver, updateDriver } = require('../controllers/driverController')

router.post('/createDriver', createDriver);
router.post('/updateDriver', updateDriver);

module.exports = router;
