


const express = require('express');
const router = express.Router();
const FleetCtrl = require('../../controllers/usersManagement/fleetController');

router.get('/fleetManagement', FleetCtrl.fleetPage);

module.exports = router;
