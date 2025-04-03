const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true }, // Ensuring unique titles
    type: { type: String, required: true, enum: ['Homepage', 'Sidebar', 'Popup'] }, // Optional enum validation for type
    status: { type: String, required: true, enum: ['Active', 'Inactive'], default: 'Active' }, // Using string with enum for status
    image: { type: String, required: true }, // Store the image URL or file path (from S3 or local server)
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);
