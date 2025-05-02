const express = require('express');
const router = express.Router();

const LoginCtrl = require('../controllers/loginController');

router.post("/login", LoginCtrl.loginPage);

module.exports = router;
