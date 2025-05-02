const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: Number, enum: [1, 2], default: 1 }, // 1 = Active, 2 = Inactive
    faqType: { type: Number, enum: [1, 2], default: 1 }, // 1 = Active, 2 = Inactive
    faqCategory: { type: Number, default: 0 } // 1 = Active, 2 = Inactive
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Faq', FaqSchema);
