const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({

    status: {
        type: Number,
        enum: [1, 2], // 1: Active, 2: Inactive, 3: In Progress, 4: Delivered, 5: Cancelled
        required: true
    },
    pincode: {
        type: Number
    },
    message: {
        type: String
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('WebWarehouse', shipmentSchema);