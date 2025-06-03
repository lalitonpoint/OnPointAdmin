const mongoose = require('mongoose');


const InitiatePaymentSchema = new mongoose.Schema({
    pickupPincode: { type: String },
    dropPincode: { type: String },
    pickupAddress: { type: String },
    dropAddress: { type: String },
    pickupLatitude: { type: String },
    pickupLongitude: { type: String },
    dropLatitude: { type: String },
    dropLongitude: { type: String },
    subTotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    specialHandling: { type: Number, required: true },
    gst: { type: Number, required: true },
    totalPayment: { type: Number, required: true },
    paymentMethod: { type: String },
    paymentGateway: { type: String },
    distance: { type: Number },
    duration: { type: String },
    isBidding: { type: Number, enum: [0, 1], default: 0 }, // 0 => No Bid , 1 => Bidding
    isAccepted: { type: Number, enum: [0, 1, 2, 3], default: 0 }, // 0 => Not Accepted , 1 => Accepted , 2 => Rejected , 3 => Bid
    orderStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 => InProgress , 1 => Pickup, 2 => In Transit , 3 => Out for Delivery , 4 => Delivered , 5 => Cancelled
    transactionStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 => Initiate, 1 => Complete , 2 => Pending , 3 => Failed , 4 => Refunded , 5 => Partial Payment
    isWalletPay: { type: Number, enum: [0, 1], default: 0 }, // 0 => Online Payment, 1 => Wallet Pay
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    preTransactionId: { type: String, default: "0" },
    postTransactionId: { type: String, default: "0" },
    invoiceNo: { type: String },
    invoiceUrl: { type: String },
    orderId: { type: String },
    paymentId: { type: String },
    paymentResponse: { type: mongoose.Schema.Types.Mixed },
    transactionDate: { type: Date },
    vehcileName: { type: String },
    vechileImage: { type: String },
    vehcileBodyType: { type: String },
    vehcileCapacity: { type: String },
    vehcileTireType: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('FTLPayment', InitiatePaymentSchema);
