
const express = require('express');
const router = express.Router();

const { orderAssign, saveDriverLocation, tripHistory, tripHistoryCount } = require('../controllers/serviceController')

router.post('/orderAssign', orderAssign);
router.post('/currentLocation', saveDriverLocation);
router.get('/tripHistory', tripHistory);
router.get('/tripHistoryCount', tripHistoryCount);

module.exports = router;
