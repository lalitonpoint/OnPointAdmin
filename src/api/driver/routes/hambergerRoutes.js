
const express = require('express');
const router = express.Router();

const { getHambergerData } = require('../controllers/hambergerController')

router.get('/detail', getHambergerData);

module.exports = router;
