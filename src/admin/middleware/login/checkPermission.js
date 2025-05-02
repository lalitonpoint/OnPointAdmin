const fs = require('fs');
const cheerio = require('cheerio');

const setGlobalPermissions = async (req, res, next) => {
    const permissions = req.session.admin ? req.session.admin.permissions : [];

    let modulePermissions = {};
    let sidebar = {};

    // Convert raw permissions to permission map
    permissions.forEach(p => {
        const key = p.module.replace(/\s+/g, '_'); // Normalize spaces with underscores

        modulePermissions[key] = {
            isShow: p.add || p.edit || p.delete || p.export,
            url: p.url,
            add: p.add,
            edit: p.edit,
            delete: p.delete,
            export: p.export
        };

        // Sidebar key should be lowercase
        sidebar[key] = p.add || p.edit || p.delete || p.export;
    });


    // Dynamically load sidebar.ejs and extract structure
    const menuStructure = extractSidebarStructure('./src/admin/views/partials/sidebar.ejs');

    const updatedSidebar = getModuleVisibility(modulePermissions, menuStructure);
    // console.log('Final Sidebar Permissions:', updatedSidebar);

    // console.log('permissions', permissions)
    // console.log('modulePermissions', modulePermissions)
    // console.log('updatedSidebar', updatedSidebar)

    req.session.modulePermissions = modulePermissions;
    req.session.sidebar = updatedSidebar;
    res.locals.modulePermissions = modulePermissions;
    res.locals.sidebar = updatedSidebar;
    // console.log('updatedSidebar->', updatedSidebar)


    next();
};
const getModuleVisibility = (permissionsJson, sidebarJson) => {
    const moduleVisibility = {};

    sidebarJson.forEach(module => {
        const parentKey = module.parentModule;
        let parentVisible = false;

        if (module.route) {
            // Direct parent route case
            for (const p of Object.values(permissionsJson)) {
                if (p.url === module.route && p.isShow) {
                    moduleVisibility[parentKey] = true;
                    break;
                }
            }
        }

        if (module.children && Array.isArray(module.children)) {
            module.children.forEach(child => {
                for (const p of Object.values(permissionsJson)) {
                    if (p.url === child.route && p.isShow) {
                        moduleVisibility[child.submodule] = true;
                        parentVisible = true; // At least one child is visible
                    }
                }
            });

            if (parentVisible) {
                moduleVisibility[parentKey] = true;
            }
        }
    });

    return moduleVisibility;
};

const extractSidebarStructure = (filePath) => {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);

    const menu = [];

    $('#sidebarMenu > li').each((_, elem) => {
        const parent = $(elem);
        const rawClass = parent.attr('class') || '';
        const match = rawClass.match(/sidebar\?\.(\w+)/);
        if (!match) return;

        const parentKey = match[1];
        const parentHref = parent.find('> a').attr('href') || null;

        const children = [];

        parent.find('ul > li').each((_, subElem) => {
            const liClass = $(subElem).attr('class') || '';
            const match = liClass.match(/sidebar\?\.([^\s]*)/);
            const subText = match ? match[1] : '';
            const link = $(subElem).find('a');
            const href = link.attr('href');

            if (href && subText) {
                children.push({ submodule: subText, route: href });
            }
        });

        if (children.length > 0) {
            menu.push({ parentModule: parentKey, children });
        } else if (parentHref) {
            menu.push({ parentModule: parentKey, route: parentHref });
        }
    });

    return menu;
};

module.exports = {
    setGlobalPermissions
};
