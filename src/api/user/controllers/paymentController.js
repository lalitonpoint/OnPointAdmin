const InitiatePayment = require('../models/paymentModal');


const addPaymentDetail = async (req, res) => {
    try {
        const {
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            pickupPincode,
            dropPincode,
            pickupAddress,
            dropAddress,
            pickupNote,
            packages,
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

        // Basic validations
        const requiredStrings = {
            pickupAddress,
            dropAddress,
            paymentMethod,
            paymentGateway
        };

        for (const [key, value] of Object.entries(requiredStrings)) {
            if (!value || typeof value !== 'string') {
                return res.status(400).json({ success: false, message: `${key} is required and must be a string.` });
            }
        }

        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({ success: false, message: "At least one package is required." });
        }

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const { packageName, packageType, numberOfPackages, totalWeight, dimensions } = pkg;

            if (
                !packageName || typeof packageName !== 'string' ||
                !packageType || typeof packageType !== 'string'
            ) {
                return res.status(400).json({ success: false, message: `packageName and packageType must be strings (Package ${i + 1}).` });
            }

            if (
                typeof numberOfPackages !== 'number' || numberOfPackages <= 0 ||
                typeof totalWeight !== 'number' || totalWeight <= 0
            ) {
                return res.status(400).json({ success: false, message: `numberOfPackages and totalWeight must be positive numbers (Package ${i + 1}).` });
            }

            if (!Array.isArray(dimensions) || dimensions.length === 0) {
                return res.status(400).json({ success: false, message: `At least one dimension is required (Package ${i + 1}).` });
            }

            for (let j = 0; j < dimensions.length; j++) {
                const { length, width, height } = dimensions[j];
                if (
                    typeof length !== 'number' || length <= 0 ||
                    typeof width !== 'number' || width <= 0 ||
                    typeof height !== 'number' || height <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `All dimension values must be positive numbers (Package ${i + 1}, Dimension ${j + 1}).`
                    });
                }
            }
        }

        const initiatePayment = new InitiatePayment({
            pickupLatitude,
            pickupLongitude,
            dropLatitude,
            dropLongitude,
            pickupPincode,
            dropPincode,
            pickupAddress,
            dropAddress,
            pickupNote,
            packages,
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

        res.status(201).json({ success: true, message: "Payment details saved successfully.", data: initiatePayment });
    } catch (error) {
        console.error("Error in addPaymentDetail:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
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
