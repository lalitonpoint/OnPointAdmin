const { json } = require('body-parser');
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    trackingId: {
        type: String,
        unique: true,
        required: true
    },
    consignerName: {
        type: String
    },
    status: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6], // 1: Pickup, 2: In Transit, 3: In Progress, 4: Delivered, 5: Cancelled , 6: Hold
        bydefault: 0,
        required: true
    },
    deliveryDate: { // Renamed 'date' to 'estimateDate' to align with the table header
        type: Date
    },
    estimateDate: { // Renamed 'date' to 'estimateDate' to align with the table header
        type: Date,
        required: true
    },
    pickUpLocation: {
        type: String
    },
    dropLocation: {
        type: String
    },
    transportMode: {
        type: String
    },
    // noOfPacking: {
    //     type: Number,
    //     required: true
    // },
    pod: {
        type: String, default: ''
    },
    deliveryStatus: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    invoiceDate: {
        type: Date,
        default: ''

    },
    connectionDate: {
        type: Date, default: ''
    },
    consigneeName: {
        type: String
    },
    mobile: {
        type: String
    },
    consignorPincode: {
        type: String
    },
    lrNo: {
        type: String
    },
    referenceNo: {
        type: String
    },
    invoiceNumber: {
        type: String
    },
    invoiceValue: {
        type: Number
    },
    boxes: {
        type: String
    },
    ewayBillNo: {
        type: String
    },
    connectionPartner: {
        type: String
    },
    partnerCnNumber: {
        type: String
    },
    actualWeight: {
        type: Number
    },
    chargedWeight: {
        type: Number
    },
    tat: {
        type: String
    },
    edd: {
        type: String
    },
    add: {
        type: String
    },
    remarks: {
        type: String
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Tracking', shipmentSchema);