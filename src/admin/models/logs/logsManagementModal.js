// src/models/Log.js

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    adminType: { type: String, required: true },
    backendUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    backendUserName: { type: String, required: true },
    backendUserEmail: { type: String, required: true },
    operation: { type: String, required: true },
    isLoggedIn: { type: Boolean, required: true },
    jsonData: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
