const fs = require('fs');
const cheerio = require('cheerio');

// Load the sidebar.ejs content
const html = fs.readFileSync('./src/admin/views/partials/sidebar.ejs', 'utf8');

// Load the HTML into Cheerio
const $ = cheerio.load(html);

// Result array to store the structured data
const menu = [];

// Dynamic map creation
const customParentNames = {};

// Iterate through top-level navigation items (li elements inside sidebarMenu)
$('#sidebarMenu > li').each((_, elem) => {
    const parent = $(elem);
    const rawClass = parent.attr('class') || '';
    // console.log(parent);
    // console.log(rawClass);

    // Extract dynamic key from session?.sidebar?.yourKey
    const match = rawClass.match(/sidebar\?\.(\w+)/);
    if (!match) return;

    const parentKey = match[1];

    // Get the display text for the parent module
    const parentText = parent.find('> a span').text().trim() || parent.find('> a').text().trim();
    const parentHref = parent.find('> a').attr('href') || null;

    if (parentText && parentKey) {
        customParentNames[parentText] = parentKey;
    }

    const children = [];

    // Handle submodules (if any)
    parent.find('ul > li').each((_, subElem) => {
        const liClass = $(subElem).attr('class') || '';
        const match = liClass.match(/sidebar\?\.([^\s]*)/);
        const subText = match ? match[1] : ''; // Extract 'manageRoles' from 'session?.sidebar?.manageRoles'

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

// Output both map and menu for verification
console.log('customParentNames:', customParentNames);
console.log('\nMenu JSON:\n', JSON.stringify(menu, null, 2));
