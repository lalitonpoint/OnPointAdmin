const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: String,
        required: true
    },
    recipientType: {
        type: String,
        enum: ['user', 'driver'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    notificationType: {
        type: String,
        enum: ['order', 'wallet'],
        required: true
    },
    referenceId: {
        type: String,
    },
    referenceScreen: {
        type: String
    }
}, { timestamps: true });


module.exports = mongoose.model('Notification', notificationSchema);
