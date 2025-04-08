const User = require('../models/userModal');
const { uploadImage } = require("../../../admin/utils/uploadHelper");
const multiparty = require('multiparty');
const fs = require('fs').promises;

const createUser = async (req, res) => {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ status: false, error: 'Failed to parse form data.' });
        }

        const {
            fullName: [fullName],
            emailAddress: [emailAddress],
            countryCode: [countryCode],
            mobileNumber: [mobileNumber],
            gender: [rawGender],
            companyName: [companyName] = [''],
            gstNumber: [gstNumber] = ['']
        } = fields;

        // Check for required fields
        if (!fullName || !emailAddress || !countryCode || !mobileNumber || !rawGender) {
            return res.status(400).json({ status: false, error: 'Missing required fields.' });
        }

        // Validate gender
        const gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();
        const allowedGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
        if (!allowedGenders.includes(gender)) {
            return res.status(400).json({ status: false, error: 'Invalid gender value.' });
        }

        try {
            // Check email or mobile duplication
            const existingUser = await User.findOne({
                $or: [
                    { emailAddress: emailAddress },
                    { mobileNumber: mobileNumber }
                ]
            });

            if (existingUser) {
                return res.status(409).json({
                    status: false,
                    error: existingUser.emailAddress === emailAddress
                        ? 'Email already exists.'
                        : 'Mobile number already exists.'
                });
            }

            // Handle profile picture upload
            let profilePictureUrl = '';
            if (files?.profilePicture?.length > 0) {
                const file = files.profilePicture[0];
                const tempFile = {
                    path: file.path,
                    originalname: file.originalFilename,
                    mimetype: file.headers['content-type'],
                    size: file.size,
                };

                const result = await uploadImage(tempFile);
                if (result.success) {
                    profilePictureUrl = result.url;
                    await fs.unlink(file.path); // remove temp file
                } else {
                    return res.status(500).json({ status: false, error: 'Profile picture upload failed.' });
                }
            }

            // Save new user
            const newUser = new User({
                fullName,
                emailAddress,
                countryCode,
                mobileNumber,
                gender,
                companyName,
                gstNumber,
                profilePicture: profilePictureUrl,
                status: 'Active',
            });

            const savedUser = await newUser.save();
            return res.status(201).json({ status: true, message: 'User created successfully.', user: savedUser });

        } catch (error) {
            return res.status(500).json({ status: false, error: 'Internal server error.', details: error.message });
        }
    });
};

module.exports = { createUser };
