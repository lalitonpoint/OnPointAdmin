const express = require('express');
const router = express.Router();

const AuthCtrl = require('../../controllers/login/authController');
const isAuthenticated = require('../../middleware/login/checkLoggedIn');

// Public Routes (No authentication required)
router.get('/', isAuthenticated, AuthCtrl.loginPage);
router.get('/permissionDenied', AuthCtrl.permissionDenied);
router.get('/logout', isAuthenticated, AuthCtrl.logout);
router.post('/checkLogin', AuthCtrl.checkLogin);
router.get('/createFirstBackendUser', AuthCtrl.createFirstBackendUser);

module.exports = router;
