const mongoose = require('mongoose');

const DriverLocationSchema = new mongoose.Schema({
    driverId: {
        type: String,
    },
    userId: {
        type: String,
    },
    latitude: {
        type: String,
    },
    longitude: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('DriverLocation', DriverLocationSchema);
