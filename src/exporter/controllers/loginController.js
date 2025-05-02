const Admin = require('../../admin/models/login/adminModel');
const bcrypt = require('bcrypt');

// Render login page (no changes needed here)
const loginPage = (req, res) => {
    res.render('pages/login/login', { title: 'OnPoints Admin ', layout: false });
};

module.exports = {
    loginPage,
};