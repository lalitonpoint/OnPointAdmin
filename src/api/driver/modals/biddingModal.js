const mongoose = require('mongoose');

const biddingSchema = new mongoose.Schema({
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ftlpayments' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
    biddingAmount: {
        type: Number,  // Capital N
        required: true,
    }
}, { timestamps: true });

const Bidding = mongoose.model('bidding', biddingSchema);

module.exports = Bidding;
