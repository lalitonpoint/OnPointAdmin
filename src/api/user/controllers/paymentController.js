const InitiatePayment = require('../models/paymentModal');

const addPaymentDetail = async (req, res) => {
    try {
        const {
            pickupLocation,
            dropLocation,
            packageName,
            packageType,
            numberOfPackages,
            totalWeight,
            dimensions,
            subtotal,
            shippingCost,
            specialHandling,
            gst,
            totalPayment,
            paymentMethod,
            paymentGateway,
            transactionStatus,
            userId,
            preTransactionId
        } = req.body;

        // Validate required string fields
        const requiredStrings = {
            pickupLocation,
            dropLocation,
            packageName,
            packageType,
            paymentMethod,
            paymentGateway
        };

        for (const [key, value] of Object.entries(requiredStrings)) {
            if (!value || typeof value !== 'string') {
                return res.status(200).json({ success: false, message: `${key} is required and must be a string.` });
            }
        }

        // Validate numeric fields
        if (
            typeof numberOfPackages !== 'number' || numberOfPackages <= 0 ||
            typeof totalWeight !== 'number' || totalWeight <= 0 ||
            typeof subtotal !== 'number' ||
            typeof shippingCost !== 'number' ||
            typeof specialHandling !== 'number' ||
            typeof gst !== 'number' ||
            typeof totalPayment !== 'number'
        ) {
            return res.status(200).json({ success: false, message: "Invalid or missing numeric fields" });
        }

        // Validate dimensions
        if (!Array.isArray(dimensions) || dimensions.length === 0) {
            return res.status(200).json({ success: false, message: "At least one dimension entry is required" });
        }

        for (let i = 0; i < dimensions.length; i++) {
            const { length, width, height } = dimensions[i];
            if (
                typeof length !== 'number' || length <= 0 ||
                typeof width !== 'number' || width <= 0 ||
                typeof height !== 'number' || height <= 0
            ) {
                return res.status(200).json({
                    success: false,
                    message: `Invalid dimension at index ${i}: All values must be positive numbers.`
                });
            }
        }

        // Optional: Generate invoice/order ID here if needed
        const initiatePayment = new InitiatePayment({
            pickupLocation,
            dropLocation,
            packageName,
            packageType,
            numberOfPackages,
            totalWeight,
            dimensions,
            subtotal,
            shippingCost,
            specialHandling,
            gst,
            totalPayment,
            paymentMethod,
            paymentGateway,
            transactionStatus,
            userId,
            preTransactionId,
            transactionDate: new Date()
        });

        await initiatePayment.save();

        res.status(201).json({ success: true, data: initiatePayment });
    } catch (error) {
        console.error("Error in addPaymentDetail:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const completePayment = async (req, res) => {
    try {
        const { paymentId, transactionStatus, transactionId, totalPayment, transactionDate } = req.body;

        if (!paymentId || !transactionStatus || !transactionId || !totalPayment || !transactionDate) {
            return res.status(200).json({ success: false, message: "Missing required payment completion details" });
        }

        const paymentRecord = await InitiatePayment.findOne({ preTransactionId: transactionId });

        if (!paymentRecord) {
            return res.status(200).json({ success: false, message: "Payment record not found" });
        }

        paymentRecord.transactionStatus = transactionStatus; // e.g. 'Completed'
        paymentRecord.postTransactionId = transactionId;
        paymentRecord.paymentId = paymentId;
        paymentRecord.totalPayment = totalPayment;
        paymentRecord.transactionDate = new Date(transactionDate);

        await paymentRecord.save();

        return res.status(200).json({ success: true, message: "Payment completed successfully", data: paymentRecord });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = { addPaymentDetail, completePayment };
