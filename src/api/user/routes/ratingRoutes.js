
const express = require('express');
const router = express.Router();

const { driverRating } = require('../controllers/ratingController')

router.post('/rateus', driverRating);

module.exports = router;
