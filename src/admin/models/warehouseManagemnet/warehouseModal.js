const { json } = require('body-parser');
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    Warehousename: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        enum: [1, 2], // 1: Pickup, 2: Out for Delivery, 3: In Progress, 4: Delivered, 5: Cancelled
        required: true
    },
    warehouseLocation: { // Renamed 'date' to 'estimateDate' to align with the table header
        type: String,
        required: true
    },
    warehouseAddress: {
        type: String
    },
    warehouseMessage: {
        type: String
    },
    pincode: {
        type: Number
    },
    phone: {
        type: Number
    },
    warehouseLatitude: { // Renamed 'date' to 'estimateDate' to align with the table header
        type: String,
        required: true
    },
    warehouseLongitude: { // Renamed 'date' to 'estimateDate' to align with the table header
        type: String,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Warehouse', shipmentSchema);