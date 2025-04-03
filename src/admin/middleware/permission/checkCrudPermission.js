module.exports = (action) => {
    return (req, res, next) => {
        const permissions = req.session.permissions;
        if (!permissions || !Array.isArray(permissions)) {
            console.log('No permissions found in session.');
            return res.redirect('/');
        }

        const url = req.originalUrl;
        const parts = url.split('/');
        const moduleName = parts[1]; // Adjust as per route structure

        const modulePermission = permissions.find(p => p.module.toLowerCase() === moduleName.toLowerCase());

        if (modulePermission && modulePermission[action] === true) {
            return next();
        } else {
            console.log(`Permission denied: Action "${action}" on module "${moduleName}"`);
            return res.status(403).json({ message: 'Permission Denied' });
        }

    };
};
