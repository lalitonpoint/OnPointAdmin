const mongoose = require('mongoose');

const dimensionSchema = new mongoose.Schema({
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
}, { _id: false });

const InitiatePaymentSchema = new mongoose.Schema({
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    packageName: { type: String, required: true },
    packageType: { type: String, required: true },
    numberOfPackages: { type: Number, required: true },
    totalWeight: { type: Number, required: true },
    dimensions: { type: [dimensionSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    specialHandling: { type: Number, required: true },
    gst: { type: Number, required: true },
    totalPayment: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentGateway: { type: String, required: true },

    // Optional/auto-filled fields
    transactionStatus: { type: String, default: 'Initiated' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    preTransactionId: { type: String },
    postTransactionId: { type: String },
    invoiceNo: { type: String },
    invoiceUrl: { type: String },
    orderId: { type: String },
    paymentId: { type: String },
    paymentResponse: { type: mongoose.Schema.Types.Mixed },
    transactionDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('PaymentDetails', InitiatePaymentSchema);
