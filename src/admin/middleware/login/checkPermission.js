// src/middleware/admin/checkPermission.js

const setGlobalPermissions = (req, res, next) => {
    const permissions = req.session.admin ? req.session.admin.permissions : [];

    // Transform permissions into { Dashboard: true/false, Role_Management: true/false, ... }
    let modulePermissions = {};

    permissions.forEach(p => {
        // Replace spaces with underscores & remove special chars if needed
        const key = p.module.replace(/\s+/g, '_'); // 'Role Management' => 'Role_Management'
        modulePermissions[key] = p.add || p.edit || p.delete || p.export;
    });

    req.session.modulePermissions = modulePermissions;

    // console.log('Module Permissions:', modulePermissions);

    res.locals.modulePermissions = modulePermissions; // Pass to EJS
    next();
};

module.exports = {
    setGlobalPermissions
};
