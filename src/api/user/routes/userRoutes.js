
const express = require('express');
const router = express.Router();

const { createUser, updateUser, deleteUser } = require('../controllers/userController')

router.post('/createprofile', createUser);
router.post('/updateProfile', updateUser);
router.post('/deleteProfile', deleteUser);

module.exports = router;
