const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    tracking_id: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: Number,
        enum: [1, 2, 3, 4, 5], // 1: Pickup, 2: Out for Delivery, 3: In Progress, 4: Delivered, 5: Cancelled
        required: true
    },
    estimateDate: { // Renamed 'date' to 'estimateDate' to align with the table header
        type: Date,
        required: true
    },
    pickUpLocation: {
        type: String
    },
    dropLocation: {
        type: String
    },
    transportMode: {
        type: String
    },
    noOfPacking: {
        type: Number,
        required: true
    },
    deliveryTime: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tracking', shipmentSchema);