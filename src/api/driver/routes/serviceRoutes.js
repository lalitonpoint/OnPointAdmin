
const express = require('express');
const router = express.Router();

const { orderAssign, saveDriverLocation, tripHistory, tripHistoryCount, updateOrderStatus, pickupOrder, pickupSendOtp } = require('../controllers/serviceController')

router.post('/orderAssign', orderAssign);
router.post('/currentLocation', saveDriverLocation);
router.get('/tripHistory', tripHistory);
router.get('/tripHistoryCount', tripHistoryCount);
router.post('/updateOrderStatus', updateOrderStatus);
router.post('/pickupOrder', pickupOrder);
router.post('/pickupSendOtp', pickupSendOtp);

module.exports = router;
