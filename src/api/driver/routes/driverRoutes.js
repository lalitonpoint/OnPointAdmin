
const express = require('express');
const router = express.Router();

const { createProfile } = require('../controllers/driverController')

router.post('/createProfile', createProfile);

module.exports = router;
