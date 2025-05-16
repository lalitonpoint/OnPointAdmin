
const express = require('express');
const router = express.Router();

const NotificationCtrl = require('../controllers/notificationController');

// router.post('/sendNotification', NotificationCtrl.assignOrderToDriver);
router.post('/getNotification', NotificationCtrl.getNotification);

module.exports = router;
