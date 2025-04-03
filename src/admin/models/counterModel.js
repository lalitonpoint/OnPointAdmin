const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Identifier (e.g., 'user_id')
    value: { type: Number, required: true, default: 0 } // Last used ID
});

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
