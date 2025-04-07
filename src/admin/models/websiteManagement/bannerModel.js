const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Ensuring unique titles
    bannerType: { type: Number, required: true, enum: [1, 2] }, // 1 => Image, 2 => Video
    bannerFile: { type: String, required: true }, // Store the file URL or path
    status: { type: Number, required: true, enum: [1, 2], default: 1 }, // 1 => Active, 2 => Inactive
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Banner', BannerSchema);