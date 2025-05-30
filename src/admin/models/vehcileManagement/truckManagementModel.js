const mongoose = require('mongoose');
const { Schema } = mongoose;


const vehicleSchema = new Schema({
    name: { type: String, required: true, trim: true }, // Truck Name
    status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1 = Active, 2 = Inactive , 3 => Delete
    vechileImage: { type: String, trim: true }, // Vehicle Image URL/Path
    serviceType: { type: mongoose.Schema.Types.ObjectId, ref: 'services' },
    bodyType: { type: String, trim: true },
}, { timestamps: true }); // Enable automatic createdAt and updatedAt

const Vehicle = mongoose.model('vehicles', vehicleSchema);
module.exports = Vehicle;