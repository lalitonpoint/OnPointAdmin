// ✅ CREATE DRIVER (POST)

const Driver = require('../../../api/driver/modals/driverModal');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const { generateLogs } = require('../../utils/logsHelper');

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


const saveDrivers = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const name = fields.name?.[0] || '';
            const email = fields.email?.[0] || '';
            const dateOfBirth = fields.dateOfBirth?.[0] || '';
            const gender = fields.gender?.[0] || '';
            const mobileNumber = fields.mobileNo?.[0] || '';
            const alternateMobileNo = fields.alternateMobileNo?.[0] || '';
            const countryCode = fields.countryCode?.[0] || '';
            // console.log(name)
            // console.log(email)
            // console.log(mobileNumber)
            if (!name || !email || !mobileNumber) {
                return res.status(400).json({ error: "Name, Email, and Mobile No. are required" });
            }

            const file = files.profileImage ? files.profileImage[0] : null;

            let imageUrl = null;
            if (file) {
                const result = await uploadImage(file);
                if (result.success) {
                    imageUrl = result.url;
                } else {
                    console.error("Error uploading image:", result.error || result.message);
                    return res.status(500).json({ error: "Failed to upload banner image" });
                }
            } else {
                imageUrl = '';
            }

            const driver = new Driver({
                personalInfo: {
                    name,
                    email,
                    dob: dateOfBirth,
                    gender,
                    countryCode,
                    mobile: mobileNumber,
                    altMobile: alternateMobileNo,
                    profilePicture: imageUrl,
                }
            });

            await driver.save();
            await generateLogs(req, 'Add', driver);

            res.status(201).json({ success: true, message: 'Driver added successfully' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}


const driverList = async (req, res) => {
    try {
        // 1. Extract DataTables parameters using destructuring and set default values
        const { draw, start = 0, length = 10, search, order, columns } = req.body;
        const searchValue = search?.value || '';

        // 2. Build the filter object for searching
        const filter = {};
        if (searchValue) {
            filter.$or = [
                { name: { $regex: searchValue, $options: 'i' } },
                { email: { $regex: searchValue, $options: 'i' } },
                { mobileNo: { $regex: searchValue, $options: 'i' } },
                { alternateMobileNo: { $regex: searchValue, $options: 'i' } },
                // Add more fields to search if needed
            ];
        }

        // 3. Determine the sorting order
        const sort = {};
        sort.createdAt = -1; // Default sort by creation date descending

        if (order?.[0]?.column !== undefined && order?.[0]?.dir) {
            const orderColumnIndex = order[0].column;
            const orderDirection = order[0].dir;
            const columnName = columns[orderColumnIndex]?.data;
            if (columnName) {
                // sort[columnName] = orderDirection === 'asc' ? 1 : -1;
                sort.createdAt = -1; // Default sort by creation date descending

            }
        }
        // 4. Fetch total and filtered record counts
        const totalRecords = await Driver.countDocuments();
        const filteredRecords = await Driver.countDocuments(filter);

        // 5. Fetch the paginated and sorted driver data
        console.log(sort);
        const drivers = await Driver.find(filter)
            .sort(sort)
            .skip(parseInt(start)) // Ensure start is an integer
            .limit(parseInt(length)); // Ensure length is an integer

        // 6. Construct the JSON response for DataTables
        res.json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: drivers // Array of driver objects matching your columns
        });

    } catch (err) {
        console.error("Error fetching driver list:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


const driverPage = (req, res) => {
    res.render('pages/driverManagement/driver');
};

// ✅ GET A SINGLE DRIVER (READ)
const singleDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        res.json({ success: true, driver });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const updateDriver = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ success: false, message: "Form data parsing failed" });
            }

            const handleFileUpload = async (file) => {
                if (file && file.path && file.originalFilename) {
                    const result = await uploadImage(file);
                    return result.success ? result.url : false;
                }
                return null;
            };

            // Upload files
            const profileImageUrl = await handleFileUpload(files?.profileImage?.[0]);
            const aadhaarFrontUrl = await handleFileUpload(files?.aadhaarFront?.[0]);
            const aadhaarBackUrl = await handleFileUpload(files?.aadhaarBack?.[0]);
            const panCardUrl = await handleFileUpload(files?.panCard?.[0]);
            const drivingLicenseUrl = await handleFileUpload(files?.drivingLicense?.[0]);
            const vehicleRCUrl = await handleFileUpload(files?.vehicleRC?.[0]);
            const vehicleInsuranceUrl = await handleFileUpload(files?.vehicleInsurance?.[0]);
            const bankPassbookUrl = await handleFileUpload(files?.bankPassbook?.[0]);
            const registrationCertificateUrl = await handleFileUpload(files?.registrationCertificate?.[0]);
            const pollutionCertificateUrl = await handleFileUpload(files?.pollutionCertificate?.[0]);
            const insuranceCertificateUrl = await handleFileUpload(files?.insuranceCertificate?.[0]);


            // Find driver
            const existingDriver = await Driver.findById(req.params.id);
            if (!existingDriver) {
                return res.status(404).json({ success: false, message: "Driver not found" });
            }

            // Personal Info
            const personal = existingDriver.personalInfo || {};
            personal.name = fields.name?.[0] || personal.name;
            personal.email = fields.email?.[0] || personal.email;
            personal.dob = fields.dateOfBirth?.[0] || personal.dob;
            personal.gender = fields.gender?.[0] || personal.gender;
            personal.mobile = fields.mobileNo?.[0] || personal.mobile;
            personal.altMobile = fields.alternateMobileNo?.[0] || personal.altMobile;
            if (profileImageUrl) personal.profilePicture = profileImageUrl;
            existingDriver.personalInfo = personal;

            // Address Info
            existingDriver.addressInfo = existingDriver.addressInfo || {};
            existingDriver.addressInfo.permanent = existingDriver.addressInfo.permanent || {};
            existingDriver.addressInfo.current = existingDriver.addressInfo.current || {};

            const p = existingDriver.addressInfo.permanent;
            p.street = fields.permanentHouseNo?.[0] || p.street;
            p.city = fields.permanentCity?.[0] || p.city;
            p.state = fields.permanentState?.[0] || p.state;
            p.pin = fields.permanentPinCode?.[0] || p.pin;

            const c = existingDriver.addressInfo.current;
            c.street = fields.currentHouseNo?.[0] || c.street;
            c.city = fields.currentCity?.[0] || c.city;
            c.state = fields.currentState?.[0] || c.state;
            c.pin = fields.currentPinCode?.[0] || c.pin;




            // Documents
            const docs = existingDriver.documents || {};
            if (aadhaarFrontUrl) docs.aadhaarFront = aadhaarFrontUrl;
            if (aadhaarBackUrl) docs.aadhaarBack = aadhaarBackUrl;
            if (panCardUrl) docs.panCard = panCardUrl;
            if (drivingLicenseUrl) docs.drivingLicense = drivingLicenseUrl;
            if (vehicleRCUrl) docs.vehicleRC = vehicleRCUrl;
            if (vehicleInsuranceUrl) docs.insuranceCopy = vehicleInsuranceUrl;
            if (bankPassbookUrl) docs.bankPassbook = bankPassbookUrl;
            existingDriver.documents = docs;

            const vehcile = existingDriver.vehicleDetail || {};

            vehcile.vehicleName = fields.vehicleName?.[0] || vehcile.vehicleName;
            vehcile.vehicleModel = fields.vehicleModel?.[0] || vehcile.vehicleModel;
            vehcile.yearOfManufacture = fields.yearOfManufacture?.[0] || vehcile.yearOfManufacture;
            vehcile.plateNumber = fields.plateNumber?.[0] || vehcile.plateNumber;
            vehcile.vin = fields.vin?.[0] || vehcile.vin;
            vehcile.capacity = fields.capacity?.[0] || vehcile.capacity;
            vehcile.fuelType = fields.fuelType?.[0] || vehcile.fuelType;
            vehcile.odometerReading = fields.odometerReading?.[0] || vehcile.odometerReading;
            vehcile.serviceType = fields.serviceType?.[0] || vehcile.serviceType;
            vehcile.vehicleId = fields.vehicleId?.[0] || vehcile.vehicleId;

            existingDriver.vehicleDetail = vehcile;

            const vechileDocs = existingDriver.vehicleDocuments || {};
            if (insuranceCertificateUrl) vechileDocs.insuranceCertificate = insuranceCertificateUrl;
            if (pollutionCertificateUrl) vechileDocs.pollutionCertificate = pollutionCertificateUrl;
            if (registrationCertificateUrl) vechileDocs.registrationCertificate = registrationCertificateUrl;
            existingDriver.vehicleDocuments = vechileDocs;


            // Save changes
            await existingDriver.save();

            return res.json({
                success: true,
                message: "Driver updated successfully",
                driver: existingDriver
            });
        });
    } catch (err) {
        console.error("Update error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ DELETE DRIVER (DELETE)
const deleteDriver = async (req, res) => {
    try {
        const deletedDriver = await Driver.findByIdAndDelete(req.params.id);
        if (!deletedDriver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        res.json({ success: true, message: 'Driver deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// POST /driver/updateApproval
const updateApproval = async (req, res) => {
    const { driverId, approved } = req.body;
    // console.log(req.session);
    // Assuming admin info is stored in req.admin from middleware or session
    const adminId = req.session.admin?.id || null;
    const adminName = req.session.admin?.name || 'Unknown';

    try {
        await Driver.updateOne(
            { _id: driverId },
            {
                $set: {
                    approvalStatus: approved,
                    approvedBy: {
                        adminId: adminId,
                        adminName: adminName,
                        approvedAt: new Date()
                    }
                }
            }
        );

        res.json({ success: true, message: 'Approval status updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error updating status.' });
    }
};



module.exports = { saveDrivers, updateDriver, deleteDriver, driverList, driverPage, singleDriver, updateApproval }