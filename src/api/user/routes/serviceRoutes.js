
const express = require('express');
const router = express.Router();

const { getServices, driverCurrentLocation } = require('../controllers/serviceController')

router.get('/getServices', getServices);
router.post('/driverCurrentLocation', driverCurrentLocation);

module.exports = router;
