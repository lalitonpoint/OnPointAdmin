
const express = require('express');
const router = express.Router();

const { createDriver } = require('../controllers/driverController')

router.post('/createDriver', createDriver);

module.exports = router;
