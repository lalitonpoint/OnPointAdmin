const express = require('express');
const router = express.Router();

const UserCtrl = require('../../controllers/usersManagement/userController');

router.post('/usersList', UserCtrl.userList);
router.get('/getUser/:id', UserCtrl.getUser);
router.post('/saveUserdata', UserCtrl.saveUserData);
router.post('/updateUser/:id', UserCtrl.updateUser);
router.post('/deleteUser/:id', UserCtrl.deleteUser);
router.get('/userManagement', UserCtrl.userPage);
router.get('/downloadAllCsv', UserCtrl.downloadAllCsv);
router.post('/changeStatus/:id', UserCtrl.changeStatus);

module.exports = router;
