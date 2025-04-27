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
            orderId: { type: String },
            createdAt: { type: Date, default: Date.now },
            transactionStatus: { type: Number, enum: [0, 1], default: 0, required: true }, // 0 => Not verified, 1 => Verified 

        }
    ]
});

const Wallet = mongoose.model('Wallet', WalletSchema);

// 🔥 This line is what you're missing:
module.exports = Wallet;
