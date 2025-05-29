
const express = require('express');
const router = express.Router();

const { driverCurrentLocation } = require('../controllers/driverController')

router.post('/currentLocation', driverCurrentLocation);

module.exports = router;
