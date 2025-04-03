// ✅ CREATE DRIVER (POST)

const Driver = require('../../models/driverManagement/driverModel');
const { uploadImage } = require("../../utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');

const saveDrivers = async (req, res) => {
    try {
        const form = new multiparty.Form();

        // Parse the form data
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(500).json({ error: "Failed to parse form data" });
            }

            const name = fields.name ? fields.name[0] : '';
            const email = fields.email ? fields.email[0] : '';
            const dateOfBirth = fields.dateOfBirth ? fields.dateOfBirth[0] : '';
            const gender = fields.gender ? fields.gender[0] : '';
            const mobileNo = fields.mobileNo ? fields.mobileNo[0] : '';
            const alternateMobileNo = fields.alternateMobileNo ? fields.alternateMobileNo[0] : '';

            if (!name || !email || !mobileNo) {
                return res.status(400).json({ error: "Name, Email, and Mobile No. are required" });
            }

            const file = files.profileImage ? files.profileImage[0] : null; // Get profileImage file

            let imageUrl = '';
            if (file && file.path && file.originalFilename) {
                const result = await uploadImage(file);
                imageUrl = result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;
            }

            const driver = new Driver({
                name,
                email,
                dateOfBirth,
                gender,
                mobileNo,
                alternateMobileNo,
                profileImage: imageUrl,
            });

            await driver.save();

            res.status(201).json({ success: true, message: 'Driver added successfully' });
        });

    } catch (err) {
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
        if (order?.[0]?.column !== undefined && order?.[0]?.dir) {
            const orderColumnIndex = order[0].column;
            const orderDirection = order[0].dir;
            const columnName = columns[orderColumnIndex]?.data;
            if (columnName) {
                sort[columnName] = orderDirection === 'asc' ? 1 : -1;
            }
        } else {
            sort.createdAt = -1; // Default sort by creation date descending
        }

        // 4. Fetch total and filtered record counts
        const totalRecords = await Driver.countDocuments();
        const filteredRecords = await Driver.countDocuments(filter);

        // 5. Fetch the paginated and sorted driver data
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

// ✅ UPDATE DRIVER (PUT)
const updateDriver = async (req, res) => {
    try {
        const form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data for update:", err);
                return res.status(500).json({ error: "Failed to parse form data for update" });
            }

            // Personal Details
            const name = fields.name ? fields.name[0] : undefined;
            const email = fields.email ? fields.email[0] : undefined;
            const dateOfBirth = fields.dateOfBirth ? fields.dateOfBirth[0] : undefined;
            const gender = fields.gender ? fields.gender[0] : undefined;
            const mobileNo = fields.mobileNo ? fields.mobileNo[0] : undefined;
            const alternateMobileNo = fields.alternateMobileNo ? fields.alternateMobileNo[0] : undefined;

            // Address Details - Permanent
            const permanentHouseNo = fields.permanentHouseNo ? fields.permanentHouseNo[0] : undefined;
            const permanentCity = fields.permanentCity ? fields.permanentCity[0] : undefined;
            const permanentState = fields.permanentState ? fields.permanentState[0] : undefined;
            const permanentPinCode = fields.permanentPinCode ? fields.permanentPinCode[0] : undefined;

            // Address Details - Current
            const currentHouseNo = fields.currentHouseNo ? fields.currentHouseNo[0] : undefined;
            const currentCity = fields.currentCity ? fields.currentCity[0] : undefined;
            const currentState = fields.currentState ? fields.currentState[0] : undefined;
            const currentPinCode = fields.currentPinCode ? fields.currentPinCode[0] : undefined;

            // Emergency Detail
            const emergencyName = fields.emergencyName ? fields.emergencyName[0] : undefined;
            const emergencyRelation = fields.emergencyRelation ? fields.emergencyRelation[0] : undefined;
            const emergencyPhone = fields.emergencyPhone ? fields.emergencyPhone[0] : undefined;

            // Additional Info
            const priorExperience = fields.priorExperience ? fields.priorExperience[0] : undefined;
            const preferredRegion = fields.preferredRegion ? fields.preferredRegion[0] : undefined;
            const languagesKnown = fields.languagesKnown ? fields.languagesKnown[0] : undefined;
            const nightShiftWilling = fields.nightShiftWilling ? fields.nightShiftWilling[0] : undefined;

            const profileImageFile = files.profileImage ? files.profileImage[0] : null;
            const aadhaarFrontFile = files.aadhaarFront ? files.aadhaarFront[0] : null;
            const aadhaarBackFile = files.aadhaarBack ? files.aadhaarBack[0] : null;
            const panCardFile = files.panCard ? files.panCard[0] : null;
            const drivingLicenseFile = files.drivingLicense ? files.drivingLicense[0] : null;
            const vehicleRCFile = files.vehicleRC ? files.vehicleRC[0] : null;
            const vehicleInsuranceFile = files.vehicleInsurance ? files.vehicleInsurance[0] : null;
            const bankPassbookFile = files.bankPassbook ? files.bankPassbook[0] : null;

            let profileImageUrl;
            let aadhaarFrontUrl;
            let aadhaarBackUrl;
            let panCardUrl;
            let drivingLicenseUrl;
            let vehicleRCUrl;
            let vehicleInsuranceUrl;
            let bankPassbookUrl;

            // Function to handle image upload
            const handleFileUpload = async (file) => {
                if (file && file.path && file.originalFilename) {
                    const result = await uploadImage(file);
                    return result.success ? result.url : `http://localhost:${process.env.PORT || 3000}${result.path}`;
                }
                return undefined;
            };

            profileImageUrl = await handleFileUpload(profileImageFile);
            aadhaarFrontUrl = await handleFileUpload(aadhaarFrontFile);
            aadhaarBackUrl = await handleFileUpload(aadhaarBackFile);
            panCardUrl = await handleFileUpload(panCardFile);
            drivingLicenseUrl = await handleFileUpload(drivingLicenseFile);
            vehicleRCUrl = await handleFileUpload(vehicleRCFile);
            vehicleInsuranceUrl = await handleFileUpload(vehicleInsuranceFile);
            bankPassbookUrl = await handleFileUpload(bankPassbookFile);

            const updateData = {
                name,
                email,
                dateOfBirth,
                gender,
                mobileNo,
                alternateMobileNo,
                profileImage: profileImageUrl,
                emergencyName,
                emergencyRelation,
                emergencyPhone,
                priorExperience,
                preferredRegion,
                languagesKnown,
                nightShiftWilling,
                aadhaarFront: aadhaarFrontUrl,
                aadhaarBack: aadhaarBackUrl,
                panCard: panCardUrl,
                drivingLicense: drivingLicenseUrl,
                vehicleRC: vehicleRCUrl,
                vehicleInsurance: vehicleInsuranceUrl,
                bankPassbook: bankPassbookUrl,
                permanentHouseNo,
                permanentCity,
                permanentState,
                permanentPinCode,
                currentHouseNo,
                currentCity,
                currentState,
                currentPinCode,
            };

            // Remove undefined properties to avoid overwriting with null values
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

            const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, updateData, { new: true });

            if (!updatedDriver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }
            res.json({ success: true, message: 'Driver updated successfully', driver: updatedDriver });
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = updateDriver;

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

module.exports = { saveDrivers, updateDriver, deleteDriver, driverList, driverPage, singleDriver }