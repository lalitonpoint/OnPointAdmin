const express = require('express');
const router = express.Router();

const DashboardCtrl = require('../../controllers/dashboard/dashboardController');

router.get('/', DashboardCtrl.dashboardPage);


module.exports = router;
