
const express = require('express');
const router = express.Router();

const { orderAssign, saveDriverLocation } = require('../controllers/serviceController')

router.post('/orderAssign', orderAssign);
router.post('/currentLocation', saveDriverLocation);

module.exports = router;
