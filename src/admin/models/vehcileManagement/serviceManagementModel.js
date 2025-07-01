const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    serviceName: { type: String, required: true },
    status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1 = Active, 2 = Inactive, 3 = Deleted
    serviceImage: { type: String, required: true }, // Stores the image path or URL
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    serviceType: { type: Number, enum: [0, 1, 2, 3, 4], default: 0 } // 0 = default, 1 = PTL, 2 = FTL Intercity, etc.
});

module.exports = mongoose.model('services', serviceSchema);
