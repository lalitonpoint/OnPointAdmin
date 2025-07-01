const DriverBankDetails = require('../modals/bankDetailModal');

// Add or update driver's bank detailsconst DriverBankDetails = require('../modals/bankDetailModal');

const addBankDetails = async (req, res) => {
    try {
        const driverId = req.header('driverid');
        const { accountHolderName, accountNumber, ifscCode, bankName, branchName } = req.body;

        // 1️⃣ Validate required fields
        if (!driverId || !accountHolderName || !accountNumber || !ifscCode || !bankName || !branchName) {
            return res.status(200).json({
                success: false,
                message: 'All fields are required: driverId, accountHolderName, accountNumber, ifscCode, bankName, branchName'
            });
        }

        // 2️⃣ Prepare update payload
        const payload = { accountHolderName, accountNumber, ifscCode, bankName, branchName };

        // 3️⃣ Find existing details
        const existing = await DriverBankDetails.findOne({ driverId });

        let result;
        if (existing) {
            // 🔄 Update path
            result = await DriverBankDetails.findByIdAndUpdate(
                existing._id,
                { $set: payload },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                message: 'Bank details updated successfully',
                data: result
            });
        } else {
            // ➕ Create path
            const bankDetails = new DriverBankDetails({ driverId, ...payload });
            result = await bankDetails.save();
            return res.status(201).json({
                success: true,
                message: 'Bank details added successfully',
                data: result
            });
        }

    } catch (error) {
        console.error('Error in addOrUpdateBankDetails:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const getBankDetails = async (req, res) => {
    try {
        const driverId = req.header('driverid');

        if (!driverId) {
            return res.status(200).json({
                success: false,
                message: 'Driver ID is required'
            });
        }

        const bankDetails = await DriverBankDetails.findOne({ driverId });

        if (!bankDetails) {
            return res.status(200).json({
                success: false,
                message: 'No bank details found for this driver'
            });
        }

        res.status(200).json({
            success: true,
            data: bankDetails,
            message: 'Bank details Fetch successfully',

        });

    } catch (error) {
        console.error('Error fetching bank details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};



module.exports = { addBankDetails, getBankDetails };
