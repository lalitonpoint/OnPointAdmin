const User = require('../../models/usersManagement/userModel');

const userList = async (req, res) => {

    try {
        let search = req.body.search?.value || '';
        let start = parseInt(req.body.start) || 0;
        let length = parseInt(req.body.length) || 10;

        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            };
        }

        let totalRecords = await User.countDocuments();
        let filteredRecords = await User.countDocuments(query);
        let users = await User.find(query).skip(start).limit(length);

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

const userPage = (req, res) => {
    res.render('pages/usersManagement/users');
}

const saveUserData = async (req, res) => {
    try {
        const { name, email, mobile, gender, status } = req.body;
        await User.create({ name, email, mobile, gender, status });
        res.redirect('/userManagement');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving user');
    }
};

const updateUser = async (req, res) => {
    try {
        const { user_id, name, email, mobile, gender, status } = req.body;

        if (!user_id) {
            return res.status(400).send('User ID is required');
        }

        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update fields
        user.name = name;
        user.email = email;
        user.mobile = mobile;
        user.gender = gender;
        user.status = status;

        await user.save();
        res.redirect('/userManagement'); // Or send JSON if needed

    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong');
    }

}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(userId);
        return res.json({ message: 'User deleted successfully' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports = { userPage, saveUserData, userList, updateUser, deleteUser }



