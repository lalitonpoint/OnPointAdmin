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

    subTotal: { type: String, default: "0.00", required: true },
    shippingCost: { type: String, default: "0.00", required: true },
    specialHandling: { type: String, default: "0.00", required: true },
    gst: { type: String, default: "0.00", required: true },
    gstPercentage: { type: String, default: "0.00", required: true },
    prePaymentPercentage: { type: String, default: "0.00" },
    totalPayment: { type: String, default: "0.00", required: true },
    prePayment: { type: String, default: "0.00" },
    postPayment: { type: String, default: "0.00" },
    estimatePrice: { type: String, default: "0.00" },

    paymentMethod: { type: String },
    paymentGateway: { type: String },
    distance: { type: Number },
    duration: { type: String },
    isBidding: { type: Number, enum: [0, 1], bydefault: 0.00 }, // 0 => No Bid , 1 => Bidding
    step: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], default: 0 },
    isPartialPayment: { type: Number, enum: [0, 1, 2], default: 0 }, // 0 => FTL Without Bidding Payment , 1 => FTL Bidding Partial Payment , 2 => FTL Bidding Full Payment
    isAccepted: { type: Number, enum: [0, 1, 2, 3], default: 0 }, // 0 => Not Accepted , 1 => Accepted , 2 => Rejected , 3 => Bid
    orderStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 => InProgress , 1 => Pickup, 2 => In Transit , 3 => Out for Delivery , 4 => Delivered , 5 => Cancelled
    transactionStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 }, // 0 => Initiate, 1 => Complete , 2 => Pending , 3 => Failed , 4 => Refunded , 5 => Partial Payment
    isWalletPay: { type: Number, enum: [0, 1], bydefault: 0.00 }, // 0 => Online Payment, 1 => Wallet Pay
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    preTransactionId: { type: String, default: "0" },
    postTransactionId: { type: String, default: "0" },
    finalPreTransactionId: { type: String, default: "0" },
    finalPostTransactionId: { type: String, default: "0" },
    invoiceNo: { type: String },
    invoiceUrl: { type: String },
    orderId: { type: String },
    paymentId: { type: String },
    paymentResponse: { type: mongoose.Schema.Types.Mixed },
    transactionDate: { type: Date },
    vehcileName: { type: String },
    vehicleImage: { type: String },
    vehcileBodyType: { type: String },
    vehcileCapacity: { type: String },
    vehcileTireType: { type: String },
    recipientName: { type: String },
    confirmNumber: { type: String },
    pod: { type: String },
    loadingTime: { type: String }, // time in minutes
    unloadingTime: { type: String },  // time in minutes
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DriverProfile'
    }
}, { timestamps: true });

module.exports = mongoose.model('FTLPayment', InitiatePaymentSchema);
