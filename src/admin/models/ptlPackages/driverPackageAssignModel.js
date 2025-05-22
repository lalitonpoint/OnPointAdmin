const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    packageId: {
        type: String,
        required: true,
        ref: 'PaymentDetails'

    },
    driverId: {
        type: String,
        required: true,
        ref: 'DriverProfile'
    },
    userId: {
        type: String,
        required: true,
        ref: 'User'

    },
    warehouseId: {
        type: String,
        ref: 'Warehouse',
        required: false, // or default: null

    },
    status: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5], // 1: Pickup, 2: Out for Delivery, 3: In Progress, 4: Delivered, 5: Cancelled
        default: 0,
        required: true
    },
    pickupStatus: {
        type: Number,
        enum: [0, 1, 2], // 0: Not Pickup 1: Go to Pickup , 2: arrived at user location
        default: 0
    },
    pickupMobile: {
        type: String
    },

    assignType: {
        type: String,
        required: true
    },
    deliveryStatus: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    pickupPincode: { type: String },
    dropPincode: { type: String },
    pickupAddress: { type: String },
    dropAddress: { type: String },
    pickupLatitude: { type: String },
    pickupLongitude: { type: String },
    dropLatitude: { type: String },
    dropLongitude: { type: String },
    totalDuration: { type: String },
    totalDistance: { type: String },
    pickupMobile: { type: String },
    step: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5],
        default: 0
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('PtlDriverRelation', shipmentSchema);
