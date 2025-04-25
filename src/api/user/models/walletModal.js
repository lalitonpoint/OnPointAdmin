const mongoose = require('mongoose');

// Mongoose Schema
const WalletSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    transactions: [
        {
            type: { type: String, enum: ['credit', 'debit'], required: true },
            amount: { type: Number, required: true },
            method: { type: String },
            order_id: { type: String },
            created_at: { type: Date, default: Date.now }
        }
    ]
});

const Wallet = mongoose.model('Wallet', WalletSchema);

// 🔥 This line is what you're missing:
module.exports = Wallet;
