const Admin = require('../../models/login/adminModel');
const bcrypt = require('bcrypt');

// Render login page (no changes needed here)
const loginPage = (req, res) => {
    res.render('pages/login/login', { title: 'OnPoints Admin ', layout: false });
};

// Logout function (no changes needed here)
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Clears session cookie
        res.redirect('/');
    });
};

// Permission denied function (no changes needed here)
const permissionDenied = (req, res) => {
    res.render('pages/login/not_authorized');
};

const checkLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin user
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Store necessary details in session
        req.session.isLoggedIn = true;
        req.session.admin = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            isLoggedIn: true,
            admin_type: admin.admin_type,
            permissions: admin.permissions || [], // Ensure it's always an array
        };
        console.log('Session Permission ->', req.session.admin);
        console.log(`User ${admin.email} logged in successfully`);

        // Instead of redirecting, send a JSON response indicating success
        return res.status(200).json({ success: true, redirectUrl: '/dashboard' });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
const createFirstBackendUser = async (req, res) => {
    try {
        // Check if there are any existing AdminUsers in the database
        const existingAdminUser = await Admin.findOne();

        // If an admin user already exists, return an appropriate message
        if (existingAdminUser) {
            return res.status(400).json({
                success: false,
                message: 'Admin user already exists!'
            });
        }

        // If no admin user exists, proceed with creating the first admin
        const hashedPassword = await bcrypt.hash("1234567890", 10);
        const adminUser = new Admin({
            name: "admin",
            mobile: "9876986698",
            email: 'admin@gmail.com',
            admin_type: 'Admin',
            password: hashedPassword,
            country_access: "true",
            city_access: "true",
            permissions: [{
                module: "dashboard",
                add: true,
                edit: true,
                delete: true,
                export: true,
                url: '/dashboard'
            },
            {
                module: "manageRoles",
                add: true,
                edit: true,
                delete: true,
                export: true,
                url: '/roles/rolesManagement'
            },
            {
                module: "backendUsers",
                add: true,
                edit: true,
                delete: true,
                export: true,
                url: '/roles/backendUserManagement'
            }
            ]
        });

        // Save the new admin user
        await adminUser.save();

        // Return success response
        res.json({ success: true, message: 'Admin saved successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error saving admin', error: error.message });
    }
};


module.exports = {
    loginPage,
    logout,
    permissionDenied,
    checkLogin,
    createFirstBackendUser
};