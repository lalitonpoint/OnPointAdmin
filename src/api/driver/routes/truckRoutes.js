
const express = require('express');
const router = express.Router();

const { getTruckData } = require('../controllers/truckController')

router.get('/truckList', getTruckData);

module.exports = router;
