const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    tracking_id: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: Number,
        enum: [1, 2, 3, 4, 5], // 1: Pickup, 2: Out for Delivery, etc.
        required: true
    },
    date: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tracking', shipmentSchema);
