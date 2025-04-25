const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    business_name: { type: String, required: true },
    business_category: { type: String, required: true },
    address: { type: String, required: true },
    
    status: {
        type: Number,
        enum: [1, 2], // 1: Pickup, 2: Out for Delivery, 3: In Progress, 4: Delivered, 5: Cancelled
        required: true
    }
    },
     {
        timestamps: true

});

module.exports = mongoose.model("Vendor", VendorSchema);