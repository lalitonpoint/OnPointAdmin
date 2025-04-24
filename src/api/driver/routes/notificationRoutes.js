
const express = require('express');
const router = express.Router();

const NotificationCtrl = require('../controllers/notificationController');

router.post('/sendNotification', NotificationCtrl.assignOrderToDriver);

module.exports = router;
