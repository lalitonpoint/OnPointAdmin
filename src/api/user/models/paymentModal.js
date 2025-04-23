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
<<<<<<< HEAD
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: String },
    transactionDate: { type: Date },


    paymentMethod: { type: String },
    paymentGateway: { type: String },
=======
    paymentMethod: { type: String, required: true },
    paymentGateway: { type: String, required: true },

    // Optional/auto-filled fields
>>>>>>> e5123714ae405c24aab8fcbb5112ad287da49eee
    transactionStatus: { type: String, default: 'Initiated' },
    preTransactionId: { type: String },
    postTransactionId: { type: String },
    invoiceNo: { type: String },
    invoiceUrl: { type: String },
    paymentId: { type: String },
    paymentResponse: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('PaymentDetails', InitiatePaymentSchema);
