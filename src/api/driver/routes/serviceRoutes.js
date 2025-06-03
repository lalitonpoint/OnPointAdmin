
const express = require('express');
const router = express.Router();

const { orderAssign, saveDriverLocation, tripHistory, tripHistoryCount, updateOrderStatus, pickupOrder, pickupSendOtp, pickupVerifyOtp, ftlOrderAssign } = require('../controllers/serviceController')

router.post('/orderAssign', orderAssign);
router.post('/currentLocation', saveDriverLocation);
router.get('/tripHistory', tripHistory);
router.get('/tripHistoryCount', tripHistoryCount);
router.post('/updateOrderStatus', updateOrderStatus);
router.post('/pickupOrder', pickupOrder);
router.post('/pickupSendOtp', pickupSendOtp);
router.post('/pickupVerifyOtp', pickupVerifyOtp);
router.post('/ftlOrderAssign', ftlOrderAssign);

module.exports = router;
