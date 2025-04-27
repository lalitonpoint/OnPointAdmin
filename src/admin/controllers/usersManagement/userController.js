const User = require('../../../api/user/models/userModal');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const moment = require('moment'); // For date manipulation



const userList = async (req, res) => {

    try {
        const { start, length, search, columns, order } = req.body;
        const searchValue = search?.value;
        let query = {};
        let sort = {};

        // Custom search parameters sent from the frontend
        const fullName = req.body.fullName;
        const emailAddress = req.body.emailAddress;
        const mobileNumber = req.body.mobileNumber;
        const statusSearch = req.body.status;
        const searchDeviceType = req.body.deviceType;
        const createdAtSearch = req.body.createdAt;


        if (fullName) {
            query.fullName = new RegExp(fullName, 'i');
        }
        if (emailAddress) {
            query.emailAddress = new RegExp(emailAddress, 'i');
        }
        if (mobileNumber) {
            query.mobileNumber = new RegExp(mobileNumber, 'i');
        }
        if (statusSearch) {
            query.status = statusSearch;
        }
        if (searchDeviceType) {
            query.deviceType = searchDeviceType;
        }
        if (createdAtSearch) {
            const startDate = moment(createdAtSearch).startOf('day');
            const endDate = moment(createdAtSearch).endOf('day');
            query.createdAt = {
                $gte: startDate.toDate(),
                $lte: endDate.toDate()
            };
        }


        // Add ordering functionality
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const sortDirection = order[0].dir === 'asc' ? 1 : -1;

            switch (parseInt(columnIndex)) {
                case 1: // Title column
                    sort.fullName = sortDirection;
                    break;
                case 2: // Tags column
                    sort.emailAddress = sortDirection;
                    break;
                case 3: // Status column
                    sort.mobileNumber = sortDirection;
                    break;
                case 7: // Created At column
                    sort.createdAt = sortDirection;
                    break;
                default:
                    sort.createdAt = -1;
                    break;
            }
        } else {
            sort.createdAt = -1;
        }

        const usersQuery = { ...query, status: { $ne: 3 } }; // Add the common filter here

        // Fetch users with pagination and sorting
        const users = await User.find(usersQuery)
            .skip(Number(start))
            .limit(Number(length))
            .sort(sort);

        // Fetch total records without the additional query filter
        const totalRecords = await User.countDocuments({ status: { $ne: 3 } });

        // Fetch filtered records based on the query
        const filteredRecords = await User.countDocuments(usersQuery);

        res.json({
            draw: req.body.draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const userPage = (req, res) => {
    res.render('pages/usersManagement/users');
}

const saveUserData = async (req, res) => {

    try {
        const form = new multiparty.Form();


        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const fullName = fields.fullName ? fields.fullName[0] : '';
            const emailAddress = fields.emailAddress ? fields.emailAddress[0] : '';
            const countryCode = fields.country ? fields.country[0] : '';
            const mobileNumber = fields.mobileNumber ? fields.mobileNumber[0] : '';
            const gender = fields.gender ? fields.gender[0] : '';
            const companyName = fields.companyName ? fields.companyName[0] : '';
            const gstNumber = fields.gstNumber ? fields.gstNumber[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const deviceType = fields.deviceType ? fields.deviceType[0] : '';

            const existingUser = await User.findOne({ emailAddress, mobileNumber }, { status: { $ne: 3 } });
            if (existingUser) {
                return res.status(400).json({ error: "User already exists with the same email and mobile number" });
            }


            if (!fullName || !emailAddress || !countryCode || !mobileNumber || !gender || !status || !deviceType) {
                return res.status(400).json({ error: "fullName, emailAddress, countryCode, mobileNumber , gender , status & deviceType are required" });
            }

            const file = files.profilePicture ? files.profilePicture[0] : null;

            const result = await uploadImage(file);
            const imageUrl = result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;

            const UserData = new User({
                fullName,
                emailAddress,
                countryCode,
                mobileNumber,
                gender,
                companyName,
                gstNumber,
                status,
                deviceType,
                profilePicture: imageUrl
            });

            await UserData.save();
            res.json({ success: true, message: 'User saved successfully' });
        });
    } catch (error) {
        console.error("Error saving User:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).send('User ID is required');
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const fullName = fields.fullName ? fields.fullName[0] : '';
            const emailAddress = fields.emailAddress ? fields.emailAddress[0] : '';
            const countryCode = fields.country ? fields.country[0] : '';
            const mobileNumber = fields.mobileNumber ? fields.mobileNumber[0] : '';
            const gender = fields.gender ? fields.gender[0] : '';
            const companyName = fields.companyName ? fields.companyName[0] : '';
            const gstNumber = fields.gstNumber ? fields.gstNumber[0] : '';
            const status = fields.status ? fields.status[0] : '';
            const deviceType = fields.deviceType ? fields.deviceType[0] : '';

            if (!fullName || !emailAddress || !countryCode || !mobileNumber || !gender || !status || !deviceType) {
                return res.status(400).json({ error: "fullName, emailAddress, countryCode, mobileNumber, gender, status & deviceType are required" });
            }

            let imageUrl = user.profilePicture; // default: keep old image

            const file = files.profilePicture ? files.profilePicture[0] : null;

            if (file) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : imageUrl;
            }

            const updatedData = {
                fullName,
                emailAddress,
                countryCode,
                mobileNumber,
                gender,
                companyName,
                gstNumber,
                status,
                deviceType,
                profilePicture: imageUrl
            };

            await User.findByIdAndUpdate(id, updatedData, { new: true });
            res.json({ success: true, message: 'User updated successfully' });
        });
    } catch (error) {
        console.error("Error updating User:", error);
        res.status(500).json({ error: error.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndUpdate(userId, { status: 3 });
        return res.json({ message: 'User deleted successfully' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
    }
}


const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', details: error.message });
    }
};

const downloadAllCsv = async (req, res) => {
    try {
        const users = await User.find({ status: { $ne: 3 } }).sort({ createdAt: -1 });

        if (users.length === 0) {
            return res.status(200).send("No users to download.");
        }

        const headers = [
            "Name",
            "Email",
            "Mobile",
            "Device Type",
            "Status",
            "Created At"
        ];

        const csvRows = users.map(user => [
            `"${user.fullName.replace(/"/g, '""').replace(/\n/g, ' ')}"`, // Handling newlines and quotes
            user.emailAddress,
            user.mobileNumber,
            user.status == '1' ? 'Active' : 'In-Active',
            user.deviceType == '1' ? 'Android' : 'IOS',
            moment(user.createdAt).format('YYYY-MM-DD HH:mm:ss')
        ].join(","));

        const csvData = [headers.join(","), ...csvRows].join("\n");

        // Set headers for downloading the CSV file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv"`);

        res.status(200).send(csvData);

    } catch (error) {
        console.error("Error downloading all users as CSV:", error);
        res.status(500).send("Error downloading CSV file.");
    }
};


const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expect the new status value in the request body

        if (status === undefined || status === null) {
            return res.status(400).json({ error: 'Status value is required in the request body.' });
        }

        const updatedStatus = await User.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedStatus) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({
            success: true,
            message: 'User status updated successfully',
            user: updatedStatus, // Return the updated user object
        });
    } catch (error) {
        console.error('Error updating User status:', error);

        // Handle specific errors based on error code
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Duplicate Value Found' });
        }

        // General error handling
        res.status(500).json({ message: error.message });
    }
};

module.exports = { userPage, saveUserData, userList, updateUser, deleteUser, getUser, downloadAllCsv, changeStatus }



