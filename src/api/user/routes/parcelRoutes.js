
const express = require('express');
const router = express.Router();

const { pickupDropLocation } = require('../controllers/parcelController')

router.post('/parcelDetail', pickupDropLocation);

module.exports = router;
