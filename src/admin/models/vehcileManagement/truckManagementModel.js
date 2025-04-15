const mongoose = require('mongoose');
const { Schema } = mongoose;


const vehicleSchema = new Schema({
    name: { type: String, required: true, trim: true }, // Truck Name
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }, // Status
    vechileImage: { type: String, trim: true }, // Vehicle Image URL/Path
}, { timestamps: true }); // Enable automatic createdAt and updatedAt

const Vehicle = mongoose.model('ptl_service', vehicleSchema);
module.exports = Vehicle;