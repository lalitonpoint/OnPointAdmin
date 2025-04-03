const express = require('express');
const router = express.Router();

const AuthCtrl = require('../../controllers/login/authController');
router.get('/logout', AuthCtrl.logout);

module.exports = router;
