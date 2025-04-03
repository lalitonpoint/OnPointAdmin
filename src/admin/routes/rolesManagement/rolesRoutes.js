const express = require('express');
const router = express.Router();


const RolesCtrl = require('../../controllers/rolesManagement/rolesController');


router.get('/rolesManagement', RolesCtrl.rolesPermissions);
router.get('/backendUserManagement', RolesCtrl.backendUser);

router.post('/saveRoles', RolesCtrl.saveRolesPermissions)
router.post('/updateRoles', RolesCtrl.updateRolesPermissions)
router.post('/editRole', RolesCtrl.editRole);
router.post('/getList', RolesCtrl.getList);


module.exports = router;
