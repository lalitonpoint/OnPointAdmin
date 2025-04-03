const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        message: { type: String, required: true },
    },
    { timestamps: true } // This automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Contact", ContactSchema);
