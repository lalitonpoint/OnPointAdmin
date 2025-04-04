const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    designation: { type: String, required: true },
    profileImage: { type: String, required: true, default: 'default-profile-image.jpg' }, // Default image
    rating: { type: Number, required: true, min: 1, max: 5 },
    status: { type: Number, required: true, enum: [1, 2], default: 1 }, // Default status is 'Active'
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
