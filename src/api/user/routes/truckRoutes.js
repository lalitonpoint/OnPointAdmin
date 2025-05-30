
const express = require('express');
const router = express.Router();

const { getTruckData } = require('../../user/controllers/truckController')

router.get('/truckList', getTruckData);

module.exports = router;
