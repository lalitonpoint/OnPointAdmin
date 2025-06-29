const DriverBankDetails = require('../modals/bankDetailModal');

// Add or update driver's bank details
const addBankDetails = async (req, res) => {
    try {
        const driverId = req.header('driverid');
        const { accountHolderName, accountNumber, ifscCode, bankName, branchName } = req.body;

        // Check for missing fields
        if (!driverId || !accountHolderName || !accountNumber || !ifscCode || !bankName || !branchName) {
            return res.status(200).json({
                success: false,
                message: 'All fields are required: driverId, accountHolderName, accountNumber, ifscCode, bankName, branchName'
            });
        }

        // ✅ Check if driver already has bank details
        const existingDetails = await DriverBankDetails.findOne({ driverId });

        if (existingDetails) {
            return res.status(200).json({
                success: false,
                message: 'Bank details already exist for this driver'
            });
        }

        const bankDetails = new DriverBankDetails({
            driverId,
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName,
            branchName
        });

        await bankDetails.save();

        res.status(201).json({
            success: true,
            message: 'Bank details added successfully',
            data: bankDetails
        });
    } catch (error) {
        console.error('Error saving bank details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { addBankDetails };
