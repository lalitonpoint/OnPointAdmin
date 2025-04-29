const express = require('express');
const router = express.Router();

const UserCtrl = require('../../controllers/usersManagement/userController');
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


router.post('/usersList', checkCrudPermission('isShow'), UserCtrl.userList);
router.get('/getUser/:id', checkCrudPermission('edit'), UserCtrl.getUser);
router.post('/saveUserdata', checkCrudPermission('add'), UserCtrl.saveUserData);
router.post('/updateUser/:id', checkCrudPermission('edit'), UserCtrl.updateUser);
router.post('/deleteUser/:id', checkCrudPermission('delete'), UserCtrl.deleteUser);
router.get('/userManagement', checkCrudPermission(), UserCtrl.userPage);
router.get('/downloadAllCsv', checkCrudPermission('export'), UserCtrl.downloadAllCsv);
router.post('/changeStatus/:id', checkCrudPermission('edit'), UserCtrl.changeStatus);

module.exports = router;
