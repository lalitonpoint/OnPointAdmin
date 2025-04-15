const multiparty = require("multiparty");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const DriverProfile = require("../modals/driverModal");
const { uploadImage } = require("../../../admin/utils/uploadHelper");
const secretKey = "your_jwt_secret"; // move to .env in production

const uploadDocument = async (files, docField) => {
    if (files?.[docField]?.[0]) {
        const file = files[docField][0];
        const tempFile = {
            path: file.path,
            originalFilename: file.originalFilename,
            mimetype: file.headers?.['content-type'] || 'application/octet-stream',
            size: file.size,
        };

        const result = await uploadImage(tempFile);
        // await fs.unlink(file.path);
        return result.success ? result.url : '';
    }
    return '';
};

const createDriver = async (req, res) => {
    const form = new multiparty.Form();
    form.maxFilesSize = 10 * 1024 * 1024;

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(200).json({ status: false, message: 'Failed to parse form data.' });

        const getField = field => fields[field]?.[0] || '';
        const step = parseInt(getField("step"), 10);
        const driverId = getField("driverId");
        let update = {};

        if (step > 1 && !driverId) {
            return res.status(200).json({ success: false, message: "driverId is required for step > 1" });
        }

        try {
            switch (step) {
                case 1: {
                    const requiredFields = ['name', 'email', 'dob', 'gender', 'mobile'];
                    for (const field of requiredFields) {
                        if (!getField(field)) {
                            return res.status(200).json({ status: false, message: `${field} is required.` });
                        }
                    }



                    const [email, mobile] = [getField('email'), getField('mobile')];

                    if (await DriverProfile.findOne({ 'personalInfo.email': email }))
                        return res.status(200).json({ status: false, message: 'Email is already registered.' });

                    if (await DriverProfile.findOne({ 'personalInfo.mobile': mobile }))
                        return res.status(200).json({ status: false, message: 'Mobile number is already registered.' });


                    const profilePicture = await uploadDocument(files, 'profilePicture');
                    if (!profilePicture) return res.status(200).json({ status: false, message: "Profile picture is required." });

                    update.personalInfo = {
                        name: getField('name'),
                        email: getField('email'),
                        dob: getField('dob'),
                        gender: getField('gender'),
                        mobile: getField('mobile'),
                        altMobile: getField('altMobile'),
                        profilePicture
                    };
                    break;
                }

                case 2: {
                    const permanent = ['Street', 'City', 'State', 'Pin'].reduce((acc, field) => {
                        const val = getField(`permanent${field}`);
                        if (!val) throw new Error(`Permanent ${field} is required.`);
                        acc[field.toLowerCase()] = val;
                        return acc;
                    }, {});

                    const current = ['Street', 'City', 'State', 'Pin'].reduce((acc, field) => {
                        const val = getField(`current${field}`);
                        if (!val) throw new Error(`Current ${field} is required.`);
                        acc[field.toLowerCase()] = val;
                        return acc;
                    }, {});

                    update.addressInfo = { permanent, current };
                    break;
                }

                case 3: {
                    const fields = [
                        'aadhaarFront', 'aadhaarBack', 'panCard', 'drivingLicense',
                        'vehicleRC', 'insuranceCopy', 'bankPassbook'
                    ];
                    const documents = {};

                    for (const field of fields) {
                        const uploaded = await uploadDocument(files, field);
                        if (!uploaded) throw new Error(`${field.replace(/([A-Z])/g, ' $1')} is required.`);
                        documents[field] = uploaded;
                    }

                    update.documents = documents;
                    break;
                }

                default:
                    return res.status(200).json({ status: false, message: "Invalid step value." });
            }

            let driver;

            if (step === 1) {
                update.status = 1;
                driver = new DriverProfile(update);
                await driver.save();
                return res.status(200).json({
                    success: true,
                    message: `Step ${step} completed`,
                    driverId: driver._id,
                    driver,
                });

            } else {
                driver = await DriverProfile.findByIdAndUpdate(driverId, { $set: update }, { new: true });
                const token = jwt.sign(
                    { driverId: driver._id, mobileNumber: driver.personalInfo?.mobile },
                    secretKey,
                    { expiresIn: '7d' }
                );

                return res.status(200).json({
                    success: true,
                    message: `Step ${step} completed`,
                    driverId: driver._id,
                    driver,
                    token
                });
            }



        } catch (error) {
            console.error('Error in createDriver:', error.message);
            return res.status(500).json({
                status: false,
                message: 'Internal server error.',
                details: error.message
            });
        }
    });
};

module.exports = {
    createDriver
};