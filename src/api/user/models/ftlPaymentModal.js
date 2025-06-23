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

    subTotal: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00"),
        required: true
    },
    shippingCost: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00"),
        required: true
    },
    specialHandling: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00"),
        required: true
    },
    gst: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00"),
        required: true
    },
    gstPercentage: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00"),
        required: true
    },
    prePaymentPercentage: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00")
    },
    totalPayment: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00"),
        required: true
    },
    prePayment: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00")
    },
    postPayment: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00")
    },
    estimatePrice: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.00")
    },

    paymentMethod: { type: String },
    paymentGateway: { type: String },
    distance: { type: Number },
    duration: { type: String },

    isBidding: { type: Number, enum: [0, 1], default: 0 },
    step: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], default: 0 },
    isPartialPayment: { type: Number, enum: [0, 1, 2], default: 0 },
    isAccepted: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    orderStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
    transactionStatus: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
    isWalletPay: { type: Number, enum: [0, 1], default: 0 },

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
    loadingTime: { type: String },
    unloadingTime: { type: String },

    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DriverProfile',
        default: null
    }
}, { timestamps: true });


// ✅ Auto-convert Decimal128 fields to float in JSON responses
InitiatePaymentSchema.set('toJSON', {
    transform: function (doc, ret) {
        for (let key in ret) {
            if (
                ret[key] &&
                typeof ret[key] === 'object' &&
                ret[key]._bsontype === 'Decimal128'
            ) {
                ret[key] = parseFloat(ret[key].toString());
            }
        }
        return ret;
    }
});

module.exports = mongoose.model('FTLPayment', InitiatePaymentSchema);
