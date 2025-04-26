

const AdminUser = require('../../models/login/adminModel');
const { generateLogs } = require('../../utils/logsHelper');
const bcrypt = require('bcrypt');

const saveRolesPermissions = async (req, res) => {
    try {
        const { name, mobile, email, admin_type, password, country_access, city_access, permissions } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const adminUser = new AdminUser({
            name,
            mobile,
            email,
            admin_type,
            password: hashedPassword,
            country_access,
            city_access,
            permissions
        });

        await adminUser.save();
        await generateLogs(req, 'Add', adminUser);

        res.json({ success: true, message: 'Admin saved successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error saving admin', error: error.message });
    }
}

const updateRolesPermissions = async (req, res) => {
    try {
        // console.log("Update Request Body:", req.body); // Debugging

        const { user_id, name, email, mobile, admin_type, permissions } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const updatedUser = await AdminUser.findByIdAndUpdate(
            user_id,
            { name, email, mobile, admin_type, permissions },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User updated successfully!', updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, message: 'Error updating user', error });
    }
};


const rolesPermissions = (req, res) => {
    res.render('pages/rolesManagement/manageRoles');
}

const mongoose = require('mongoose');

const editRole = async (req, res) => {
    try {
        const { id } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }
        const user = await AdminUser.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }


        res.json({ success: true, data: user }); // Return user data
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const backendUser = (req, res) => {
    res.render('pages/rolesManagement/backendUser');
}

const getList = async (req, res) => {
    try {
        const { start, length, search, order, columns } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search parameters sent from the frontend
        const nameSearch = req.body.name;
        const emailSearch = req.body.email;
        const adminTypeSearch = req.body.admin_type;

        if (searchValue) {
            query.$or = [
                { name: new RegExp(searchValue, 'i') },
                { email: new RegExp(searchValue, 'i') },
                { admin_type: searchValue }
            ];
        } else {
            if (nameSearch) {
                query.name = new RegExp(nameSearch, 'i');
            }
            if (emailSearch) {
                query.email = new RegExp(emailSearch, 'i');
            }
            if (adminTypeSearch) {
                query.admin_type = adminTypeSearch; // Direct match for admin_type

            }
        }

        // Add ordering functionality
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const sortDirection = order[0].dir === 'asc' ? 1 : -1;

            switch (parseInt(columnIndex)) {
                case 1: // Name column
                    sort.name = sortDirection;
                    break;
                case 2: // Email column
                    sort.email = sortDirection;
                    break;
                default:
                    sort.name = -1; // Default sort by name ascending
                    break;
            }
        } else {
            sort.name = -1; // Default sort by name ascending
        }
        console.log(sort);


        const users = await AdminUser.find(query)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort);


        const totalRecords = await AdminUser.countDocuments();
        const filteredRecords = await AdminUser.countDocuments(query);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: users // must be array of objects matching columns
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};


const deleteBackendUser = async (req, res) => {
    try {
        const { id } = req.params;
        await AdminUser.findByIdAndDelete(id);
        res.json({ success: true, message: 'Backend User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { rolesPermissions, saveRolesPermissions, updateRolesPermissions, backendUser, getList, editRole, deleteBackendUser }