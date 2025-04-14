const express = require('express');
const router = express.Router();
const { checkCrudPermission } = require('../../middleware/permission/checkCrudPermission');


const RolesCtrl = require('../../controllers/rolesManagement/rolesController');

router.get('/rolesManagement', checkCrudPermission(), RolesCtrl.rolesPermissions);
router.get('/backendUserManagement', checkCrudPermission(), RolesCtrl.backendUser);

router.post('/getList', checkCrudPermission('isShow'), RolesCtrl.getList);
router.post('/saveRoles', checkCrudPermission('add'), RolesCtrl.saveRolesPermissions)
router.post('/updateRoles', checkCrudPermission('edit'), RolesCtrl.updateRolesPermissions)
router.post('/editRole', checkCrudPermission('edit'), RolesCtrl.editRole);
router.delete('/deleteBackendUser/:id', checkCrudPermission('delete'), RolesCtrl.deleteBackendUser);


module.exports = router;
