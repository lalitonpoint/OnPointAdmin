// utils/generateOrderId.js
const OrderCounter = require('../models/orderCounterModal');

async function generateIncrementalOrderId() {
    const counter = await OrderCounter.findByIdAndUpdate(
        { _id: 'order' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const paddedSeq = counter.seq.toString().padStart(6, '0'); // 000001, 000002
    return `ORD${paddedSeq}`;
}

module.exports = generateIncrementalOrderId;
