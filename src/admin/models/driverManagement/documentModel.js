const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isMandatory: { type: Boolean, required: true }, // Required Field
    isUnique: { type: Boolean, required: true },    // Required Field
    uniqueType: { type: String, required: true },
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
