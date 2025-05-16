
const express = require('express');
const router = express.Router();

const { masterDetail } = require('../controllers/masterController')

router.post('/masterDetail', masterDetail);

module.exports = router;

