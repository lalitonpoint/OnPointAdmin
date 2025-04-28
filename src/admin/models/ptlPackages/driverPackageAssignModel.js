const { json } = require('body-parser');
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    packageid: {
        type: String,
        required: true
    },
    driverId: {
        type: String
        
    },
    warehouseId :{
        type: String
    },
    status: {
        type: Number,
         enum: [1, 2, 3, 4, 5], // 1: Pickup, 2: Out for Delivery, 3: In Progress, 4: Delivered, 5: Cancelled
        required: true
    }
    // deliveryDate: { // Renamed 'date' to 'estimateDate' to align with the table header
    //     type: Date,
    //     required: true
    // },
    // pickUpLocation: {
    //     type: String
    // },
    // dropLocation: {
    //     type: String
    // },
    // transportMode: {
    //     type: String
    // },
    // noOfPacking: {
    //     type: Number,
    //     required: true
    // },
    // pod: {
    //     type: String, default: ''
    // },
    // deliveryStatus: {
    //     type: mongoose.Schema.Types.Mixed,
    //     default: {}
    // }
}, {
    timestamps: true
});

module.exports = mongoose.model('ptldriverrelation', shipmentSchema);