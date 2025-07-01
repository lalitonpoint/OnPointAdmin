const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    serviceName: { type: String, required: true },
    status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1 = Active, 2 = Inactive , 3 => Delete
    serviceImage: { type: String, required: true }, // Stores the path or URL of the image
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    serviceType: { type: Number, enum: [0, 1, 2, 3, 4], bydefault: 0 } // 1 => PTL , 2 => FTL Intercity , 3 => FTL Outer Station , 4 => Two Wheeler
});

module.exports = mongoose.model('services', serviceSchema);