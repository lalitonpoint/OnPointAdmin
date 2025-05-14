const multiparty = require("multiparty");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const DriverProfile = require("../modals/driverModal");
const { uploadImage } = require("../../../admin/utils/uploadHelper");
const secretKey = process.env.JWT_SECRET || "your_jwt_secret"; // Move to .env in production

const uploadDocument = async (files, docField) => {
    if (files?.[docField]?.length > 0) {
        const file = files[docField][0];
        const tempFile = {
            path: file.path,
            originalFilename: file.originalFilename,
            mimetype: file.headers?.['content-type'] || 'application/octet-stream',
            size: file.size,
        };

        const result = await uploadImage(tempFile);
        if (result.success) {
            // Clean up the temporary file after successful upload
            // await fs.unlink(file.path);
            return result.url;
        } else {
            console.error(`Failed to upload ${docField}:`, result.message);
            return ''; // Or perhaps throw an error for better handling in the caller
        }
    }
    return '';
};

const createDriver = async (req, res) => {
    const form = new multiparty.Form();
    form.maxFilesSize = 10 * 1024 * 1024;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ success: false, message: 'Failed to parse form data.' }); // Changed status code to 200
        }

        const getField = field => fields[field]?.[0] || '';
        const step = parseInt(getField("step"), 10);
        // const driverId = getField("driverId");
        const driverId = req.header("driverid");
        let update = {};
        let existingDriver = null;

        if (step > 1) {
            if (!driverId) {
                return res.status(200).json({ success: false, message: "driverId is required for next step " });
            } else {
                existingDriver = await DriverProfile.findById(driverId);
                if (!existingDriver) {
                    return res.status(200).json({ success: false, message: 'Driver not found.' });
                }
            }

        }

        try {
            switch (step) {
                case 1: {
                    const requiredFields = ['name', 'email', 'dob', 'gender', 'countryCode', 'mobile'];
                    for (const field of requiredFields) {
                        if (!getField(field)) {
                            return res.status(200).json({ success: false, message: `${field} is required.` }); // Changed status code to 200 and using success: false for consistency
                        }
                    }

                    const [email, mobile] = [getField('email'), getField('mobile')];

                    // Check if email already exists
                    const existingEmailDriver = await DriverProfile.findOne({ 'personalInfo.email': email });
                    if (existingEmailDriver) {
                        return res.status(200).json({
                            success: false,
                            message: 'Email is already registered.',
                            data: existingEmailDriver
                        });
                    }

                    // Check if mobile already exists
                    const existingMobileDriver = await DriverProfile.findOne({ 'personalInfo.mobile': mobile });
                    if (existingMobileDriver) {
                        return res.status(200).json({
                            success: false,
                            message: 'Mobile number is already registered.',
                            data: existingMobileDriver
                        });
                    }

                    // const profilePicture = await uploadDocument(files, 'profilePicture');
                    // if (!profilePicture) return res.status(200).json({ success: false, message: "Profile picture is required." }); // Changed status code to 200

                    update.personalInfo = {
                        name: getField('name'),
                        email: getField('email'),
                        dob: getField('dob'),
                        gender: getField('gender'),
                        mobile: getField('mobile'),
                        altMobile: getField('altMobile'),
                        countryCode: getField('countryCode'),
                        profilePicture: ''
                    };
                    break;
                };

                case 2: {

                    console.log('existingDriver');
                    console.log('existingDriver', existingDriver);
                    const permanent = {};
                    const permanentRequiredFields = ['Street', 'City', 'State', 'Pin'];
                    for (const field of permanentRequiredFields) {
                        const val = getField(`permanent${field}`);
                        if (!val) {
                            return res.status(200).json({ success: false, message: `Permanent ${field} is required.` }); // Changed to return JSON response
                        }
                        permanent[field.toLowerCase()] = val;
                    }

                    const current = {
                        street: getField('currentStreet'),
                        city: getField('currentCity'),
                        state: getField('currentState'),
                        pin: getField('currentPin')
                    };

                    update.addressInfo = { permanent, current };
                    if (existingDriver.step < 2)
                        update.step = 2;
                    break;
                };
                case 3: {
                    const fieldsToUpload = [
                        'aadhaarFront', 'aadhaarBack', 'panCard', 'drivingLicense',
                        'vehicleRC', 'insuranceCopy', 'bankPassbook'
                    ];
                    const documents = {};

                    for (const field of fieldsToUpload) {
                        const uploaded = await uploadDocument(files, field);
                        if (!uploaded) {
                            return res.status(200).json({ success: false, message: `${field.replace(/([A-Z])/g, ' $1')} is required.` }); // Changed to return JSON response and status code
                        }
                        documents[field] = uploaded;
                    }

                    update.documents = documents;
                    if (existingDriver.step < 3)
                        update.step = 3;
                    break;
                }
                case 4: {
                    const vehicleDetail = {};
                    const vehicleRequiredFields = [
                        'vehicleName', 'vehicleModel', 'yearOfManufacture',
                        'plateNumber', 'vin', 'capacity',
                        'fuelType', 'odometerReading', 'serviceType', 'vehicleId'
                    ];

                    for (const field of vehicleRequiredFields) {
                        const val = getField(field); // Fixed dynamic field access
                        if (!val) {
                            return res.status(200).json({ success: false, message: `${field} is required.` });
                        }
                        vehicleDetail[field] = val; // Keeping original casing to match DB fields
                    }

                    update.vehicleDetail = vehicleDetail;
                    if (existingDriver.step < 4)
                        update.step = 4;
                    break;
                };
                case 5: {
                    console.log(34567890);

                    const fieldsToUpload = [
                        'registrationCertificate',
                        'insuranceCertificate',
                        'pollutionCertificate',
                    ];

                    const vehicleDocuments = {};

                    for (const field of fieldsToUpload) {
                        const uploaded = await uploadDocument(files, field);
                        if (!uploaded) {
                            const fieldName = field.replace(/([A-Z])/g, ' $1'); // Adds space before capital letters
                            return res.status(200).json({ success: false, message: `${fieldName} is required.` });
                        }
                        vehicleDocuments[field] = uploaded;
                    }

                    update.vehicleDocuments = vehicleDocuments;
                    if (existingDriver.step < 5)
                        update.step = 5;
                    break;
                }


                default:
                    return res.status(200).json({ success: false, message: "Invalid step value." }); // Changed status code to 200 and using success: false
            }

            let driver;

            if (step === 1) {
                update.status = 1;
                update.step = 1;
                driver = new DriverProfile(update);
                await driver.save();
                return res.status(201).json({ // Changed status code to 201 for successful creation
                    success: true,
                    message: `Step ${step} completed`,
                    driverId: driver._id,
                    data: driver,
                });

            } else {
                // Check if the driver exists before updating

                driver = await DriverProfile.findByIdAndUpdate(driverId, { $set: update }, { new: true });

                let token = null;

                if (step == 5) {
                    token = jwt.sign(
                        { driverId: driver._id, mobileNumber: driver.personalInfo?.mobile },
                        secretKey,
                        { expiresIn: '30d' }
                    );

                    driver = driver.toObject(); // Convert to plain object
                    driver.token = token;       // Add token



                }


                return res.status(200).json({
                    success: true,
                    message: `Step ${step} completed`,
                    driverId: driver._id,
                    data: driver,
                    token
                });
            }

        } catch (error) {
            console.error('Error in createDriver:', error); // Log the full error for debugging
            return res.status(500).json({
                success: false, // Using success: false for consistency
                message: 'Internal server error.',
                details: error.message
            });
        }
    });
};

const updateDriver = (req, res) => {
    const form = new multiparty.Form();
    form.maxFilesSize = 10 * 1024 * 1024;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ success: false, message: 'Failed to parse form data.' });
        }

        const getField = field => fields[field]?.[0] || '';
        const driverId = req.headers['driverid'];

        if (!driverId) {
            return res.status(200).json({ success: false, message: "driverId is required" });
        }

        const existingDriver = await DriverProfile.findById(driverId);
        if (!existingDriver) {
            return res.status(200).json({ success: false, message: 'Driver not found.' });
        }

        try {
            const requiredFields = ['name', 'dob', 'gender', 'countryCode', 'mobile'];
            const personalInfoFields = [...requiredFields, 'altMobile', 'email'];
            const update = {};

            // Validate required fields
            for (const field of requiredFields) {
                const value = getField(field);
                if (!value) {
                    return res.status(200).json({ success: false, message: `${field} is required.` });
                }
            }

            // Build dynamic update object with dot notation
            for (const field of personalInfoFields) {
                const value = getField(field);
                if (value) {
                    update[`personalInfo.${field}`] = value;
                }
            }

            // Upload and include profile picture if present
            const profilePicture = await uploadDocument(files, 'profilePicture');
            if (profilePicture) {
                update['personalInfo.profilePicture'] = profilePicture;
            }

            const driver = await DriverProfile.findByIdAndUpdate(
                driverId,
                { $set: update },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: `Driver Updated Successfully`,
                driverId: driver._id,
                data: driver,
            });

        } catch (error) {
            console.error('Error in updateDriver:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error.',
                details: error.message
            });
        }
    });
};


module.exports = {
    createDriver,
    updateDriver,
};