const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: false }, // Added blogImage field
    description: { type: String, required: true },
    tags: [{ type: String }], // Changed tags to an array of strings
    status: { type: Number, enum: [1, 2], default: 1 }, // Changed status to Number (1: Active, 2: Inactive)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', BlogSchema);