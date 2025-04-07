const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    serviceName: { type: String, required: true },
    status: { type: Number, required: true, enum: [1, 2], default: 1 }, // 1: Active, 2: Inactive
    serviceImage: { type: String, required: true }, // Stores the path or URL of the image
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('truckservices', serviceSchema);