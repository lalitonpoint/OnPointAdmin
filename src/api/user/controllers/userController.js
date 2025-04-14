const User = require('../models/userModal');
const { uploadImage } = require("../../../admin/utils/uploadHelper");
const multiparty = require('multiparty');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET; // Define your secret key

// Utility function for normalizing and validating gender
function normalizeGender(gender) {
    const g = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    const allowed = ['Male', 'Female', 'Other', 'Prefer not to say'];
    return allowed.includes(g) ? g : null;
}

const createUser = async (req, res) => {
    const form = new multiparty.Form();
    form.maxFilesSize = 5 * 1024 * 1024;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ status: false, message: 'Failed to parse form data.' });
        }

        const {
            fullName = [],
            emailAddress = [],
            countryCode = [],
            mobileNumber = [],
            gender: rawGender = [],
            companyName = [''],
            gstNumber = ['']
        } = fields;

        const fName = fullName.length > 0 ? fullName[0] : undefined;
        const email = emailAddress.length > 0 ? emailAddress[0] : undefined;
        const code = countryCode.length > 0 ? countryCode[0] : undefined;
        const mobile = mobileNumber.length > 0 ? mobileNumber[0] : undefined;
        const g = rawGender.length > 0 ? rawGender[0] : undefined;

        if (!fName || !email || !code || !mobile || !g) {
            return res.status(400).json({ status: false, message: 'Missing required fields.' });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: false, message: 'Invalid email address format.' });
        }

        const gender = normalizeGender(g);
        if (!gender) {
            return res.status(400).json({ status: false, message: 'Invalid gender value.' });
        }

        try {
            const existingUser = await User.findOne({
                $or: [
                    { emailAddress: email, status: { $ne: 3 } }, // Added status != 3 here
                    {
                        mobileNumber: mobile,
                        status: { $ne: 3 }
                    }
                ]
            });

            if (existingUser) {
                return res.status(409).json({
                    status: false,
                    message: existingUser.emailAddress === email
                        ? 'Email already exists.'
                        : 'Mobile number already exists.'
                });
            }


            let profilePictureUrl = '';
            if (files?.profilePicture?.length > 0) {
                const file = files.profilePicture[0];
                const tempFile = {
                    path: file.path,
                    originalFilename: file.originalFilename,
                    mimetype: file.headers?.['content-type'] || 'application/octet-stream',
                    size: file.size,
                };

                const result = await uploadImage(tempFile);
                if (result.success) {
                    profilePictureUrl = result.url;
                    try {
                        await fs.unlink(file.path); // Delete the temporary file
                        // console.log('Temporary file deleted:', file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting temporary file:', unlinkError);
                        // Consider logging this error
                    }
                } else {
                    return res.status(500).json({ status: false, message: 'Profile picture upload failed.' });
                }
            }

            const newUser = new User({
                fullName: fName,
                emailAddress: email,
                countryCode: code,
                mobileNumber: mobile,
                gender,
                companyName: companyName[0] || '',
                gstNumber: gstNumber[0] || '',
                profilePicture: profilePictureUrl,
                status: 1,
            });

            const savedUser = await newUser.save();
            return res.status(400).json({ status: false, savedUser: newUser });


            const token = jwt.sign(
                { userId: savedUser._id, mobileNumber: savedUser.mobileNumber },
                secretKey,
                { expiresIn: '7d' });

            return res.status(201).json({
                status: true,
                message: 'User created successfully.',
                user: savedUser,
                token
            });

        } catch (error) {
            console.error('Error in createUser:', error.message, error.stack);
            return res.status(500).json({
                status: false,
                error: 'Internal server error.',
                details: error.message,
            });
        }
    });
};

const updateUser = async (req, res) => {
    const form = new multiparty.Form();
    form.maxFilesSize = 5 * 1024 * 1024;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ status: false, message: 'Failed to parse form data.' });
        }

        const {
            fullName = [],
            emailAddress = [],
            countryCode = [],
            mobileNumber = [],
            gender: rawGender = [],
            companyName = [''],
            gstNumber = [''],
            userId = ['']
        } = fields;

        const fName = fullName.length > 0 ? fullName[0] : undefined;
        const email = emailAddress.length > 0 ? emailAddress[0] : undefined;
        const code = countryCode.length > 0 ? countryCode[0] : undefined;
        const mobile = mobileNumber.length > 0 ? mobileNumber[0] : undefined;
        const g = rawGender.length > 0 ? rawGender[0] : undefined;
        const userIdd = userId.length > 0 ? userId[0] : undefined;

        // You might not want to make all fields mandatory for an update
        // Consider which fields should be required for an update
        // For this example, let's say at least one field needs to be updated.
        if (!fName && !email && !code && !mobile && !g && companyName[0] === '' && gstNumber[0] === '' && !files?.profilePicture) {
            return res.status(400).json({ status: false, message: 'No fields to update provided.' });
        }

        // Basic email format validation if email is being updated
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ status: false, message: 'Invalid email address format.' });
            }
        }

        let gender;
        if (g) {
            gender = normalizeGender(g);
            if (!gender) {
                return res.status(400).json({ status: false, message: 'Invalid gender value.' });
            }
        }

        try {
            // const { userId } = req.body; // Assuming you are passing the user ID as a route parameter

            const existingUser = await User.findById(userIdd);
            if (!existingUser) {
                return res.status(404).json({ status: false, message: 'User not found.' });
            }

            let profilePictureUrl = existingUser.profilePicture || ''; // Keep existing if not updated
            if (files?.profilePicture?.length > 0) {
                const file = files.profilePicture[0];
                const tempFile = {
                    path: file.path,
                    originalFilename: file.originalFilename,
                    mimetype: file.headers?.['content-type'] || 'application/octet-stream',
                    size: file.size,
                };

                const result = await uploadImage(tempFile);
                if (result.success) {
                    profilePictureUrl = result.url;
                    try {
                        await fs.unlink(file.path); // Delete the temporary file
                        // console.log('Temporary file deleted:', file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting temporary file:', unlinkError);
                        // Consider logging this error
                    }
                } else {
                    return res.status(500).json({ status: false, message: 'Profile picture upload failed.' });
                }
            }

            const updateData = {};
            if (fName) updateData.fullName = fName;
            if (email) updateData.emailAddress = email;
            if (code) updateData.countryCode = code;
            if (mobile) updateData.mobileNumber = mobile;
            if (gender) updateData.gender = gender;
            if (companyName[0] !== '') updateData.companyName = companyName[0];
            if (gstNumber[0] !== '') updateData.gstNumber = gstNumber[0];
            if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;

            // Perform the update operation
            const updatedUser = await User.findByIdAndUpdate(userIdd, updateData, { new: true });

            if (!updatedUser) {
                return res.status(500).json({ status: false, message: 'Failed to update user profile.' });
            }

            return res.status(200).json({
                status: true,
                message: 'User profile updated successfully.',
                user: updatedUser,
            });

        } catch (error) {
            console.error('Error in updateUserProfile:', error.message, error.stack);
            return res.status(500).json({
                status: false,
                message: 'Internal server error.',
                details: error.message,
            });
        }
    });
};


const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;


        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Update the user's status to 3 (Delete)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { status: 3 },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ status: false, message: 'Failed to update user status.' });
        }

        return res.status(200).json({
            status: true,
            message: 'User deleted successfully.',
        });

    } catch (error) {
        console.error('Error in deleteUser:', error.message, error.stack);
        return res.status(500).json({
            status: false,
            message: 'Internal server error.',
            details: error.message,
        });
    }
};

module.exports = { createUser, updateUser, deleteUser };