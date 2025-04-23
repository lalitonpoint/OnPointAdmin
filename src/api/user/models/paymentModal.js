const mongoose = require('mongoose');

const dimensionSchema = new mongoose.Schema({
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
}, { _id: false });


const packageSchema = new mongoose.Schema({
    packageName: { type: String, required: true },
    packageType: { type: String, required: true },
    numberOfPackages: { type: Number, required: true },
    totalWeight: { type: Number, required: true },
    dimensions: { type: dimensionSchema, required: true }
}, { _id: false });

const InitiatePaymentSchema = new mongoose.Schema({
    pickupPincode: { type: String },
    dropPincode: { type: String },
    pickupAddress: { type: String },
    dropAddress: { type: String },
    pickupLatitude: { type: String },
    pickupLongitude: { type: String },
    dropLatitude: { type: String },
    dropLongitude: { type: String },
    pickupNote: { type: String },
    packages: { type: [packageSchema], required: true },
    subTotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    specialHandling: { type: Number, required: true },
    gst: { type: Number, required: true },
    totalPayment: { type: Number, required: true },
    paymentMethod: { type: String },
    paymentGateway: { type: String },

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
