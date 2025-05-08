const mongoose = require('mongoose');

const deliveryStageSchema = new mongoose.Schema({
    key: { type: String, required: true },
    status: { type: Number, default: 0 }, // 0 = pending, 1 = done
    deliveryDateTime: { type: Date, default: '' }
}, { _id: false });


const shipmentSchema = new mongoose.Schema({
    packageId: {
        type: String,
        required: true
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
    },
    status: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5], // 1: Pickup, 2: Out for Delivery, 3: In Progress, 4: Delivered, 5: Cancelled
        default: 0,
        required: true
    },
    assignType: {
        type: String,
        required: true
    },
    deliveryStatus: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }

    ,

    pickupPincode: { type: String },
    dropPincode: { type: String },
    pickupAddress: { type: String },
    dropAddress: { type: String },
    pickupLatitude: { type: String },
    pickupLongitude: { type: String },
    dropLatitude: { type: String },
    dropLongitude: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model('PtlDriverRelation', shipmentSchema);
