const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // banner: { type: String, required: false },
    // poster: { type: String, required: false },
    description: { type: String, required: true },
    tags: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
