const checkCrudPermission = (action = "") => {
    return (req, res, next) => {
        const permissions = req.session.modulePermissions;

        if (!permissions || typeof permissions !== 'object') {
            // console.log('❌ No permissions found in session.');
            return res.redirect('/');
        }
        // console.log('permissionUrl', permissions)


        let url = '';
        // console.log('action', action);


        // Use referer URL for action-based requests (add/edit/delete)
        if (action != "") {
            url = req.headers.referer || '';
            url = url.split('?')[0]; // Remove query parameters
            url = new URL(url, `http://${req.headers.host}`).pathname.replace(/\/+$/, ''); // Normalize
        } else {
            // Use current page URL for view access
            url = req.originalUrl.split('?')[0].replace(/\/+$/, '');
        }

        // console.log('🔍 Checking permissions for URL:', url);

        let modulePermission = null;
        let moduleName = null;



        // Match the URL with a permission entry
        for (const [key, value] of Object.entries(permissions)) {
            const permissionUrl = value.url.replace(/\/+$/, '');
            // console.log('permissionUrl', permissionUrl)
            if (url === permissionUrl) {
                if (action === "") {
                    return next();
                }
                else {
                    modulePermission = value;
                    moduleName = key;
                    break;
                }

            }
        }
        // console.log('modulePermission', modulePermission);

        if (!modulePermission) {
            // console.log(`❌ Not Authorized: No permission for URL: ${url}`);
            return res.redirect('/not-authorized');
        }


        // Check action permission
        if (modulePermission[action] === true) {
            return next();
        } else {
            // console.log(`❌ Permission denied: Action "${action}" on module "${moduleName}"`);
            return res.status(403).json({ message: 'Permission Denied' });
        }
    };
};

module.exports = { checkCrudPermission };
