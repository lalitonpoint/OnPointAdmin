const express = require('express');
const router = express.Router();

const UserCtrl = require('../../controllers/usersManagement/userController');

router.post('/usersList', UserCtrl.userList);
router.post('/saveUserdata', UserCtrl.saveUserData);
router.post('/updateUser', UserCtrl.updateUser);
router.delete('/delete-user/:id', UserCtrl.deleteUser);
router.get('/userManagement', UserCtrl.userPage);

module.exports = router;
