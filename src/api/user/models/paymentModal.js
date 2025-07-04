const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    packageName: { type: String, required: true },
    packageType: { type: String, required: true },
    numberOfPackages: { type: Number, required: true },
    totalWeight: { type: Number, required: true },
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
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

    subTotal: { type: String, default: "0.00", required: true },
    shippingCost: { type: String, default: "0.00", required: true },
    specialHandling: { type: String, default: "0.00", required: true },
    gst: { type: String, default: "0.00", required: true },
    totalPayment: { type: String, default: "0.00", required: true },

    paymentMethod: { type: String },
    paymentGateway: { type: String },
    transportMode: { type: String },
    distance: { type: Number },
    duration: { type: String },
    orderStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 => InProgress , 1 => Pickup, 2 => In Transit , 3 => Out for Delivery , 4 => Delivered , 5 => Cancelled
    transactionStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 => Initiate, 1 => Complete , 2 => Pending , 3 => Failed , 4 => Refunded , 5 => Partial Payment
    isWalletPay: { type: Number, enum: [0, 1], default: 0 }, // 0 => Online Payment, 1 => Wallet Pay

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
