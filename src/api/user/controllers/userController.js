const User = require('../models/userModal');
const { uploadImage } = require("../../../admin/utils/uploadHelper");
const multiparty = require('multiparty');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'your-default-secret-key'; // Define your secret key

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
            return res.status(400).json({ status: false, error: 'Failed to parse form data.' });
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
            return res.status(400).json({ status: false, error: 'Missing required fields.' });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: false, error: 'Invalid email address format.' });
        }

        const gender = normalizeGender(g);
        if (!gender) {
            return res.status(400).json({ status: false, error: 'Invalid gender value.' });
        }

        try {
            const existingUser = await User.findOne({
                $or: [
                    { emailAddress: email },
                    { mobileNumber: mobile }
                ]
            });

            if (existingUser) {
                return res.status(409).json({
                    status: false,
                    error: existingUser.emailAddress === email
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
                    return res.status(500).json({ status: false, error: 'Profile picture upload failed.' });
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
                status: 'Active',
            });

            const savedUser = await newUser.save();
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

module.exports = { createUser };