const admin = require('../../../../config/firebaseConnection');
const PTL = require('../../../admin/models/ptlPackages/driverPackageAssignModel'); // Adjust the model path as needed
const { getDistanceAndDuration } = require('../utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'
const DriverLocation = require('../modals/driverLocModal'); // Assuming the common function is located in '../utils/distanceCalculate'

// Save Driver Locationconst DriverLocation = require('../models/DriverLocation'); // adjust the path as needed

const saveDriverLocation = async (req, res) => {
    const driverId = req.headers['driverid'];
    const { lat, long } = req.body;

    if (!driverId || !lat || !long) {
        return res.status(200).json({ message: "Missing driverId, lat, or long" });
    }

    try {
        const existingLocation = await DriverLocation.findOne({ driverId });

        if (existingLocation) {
            // Update existing location
            existingLocation.latitude = lat;
            existingLocation.longitude = long;
            await existingLocation.save();
        } else {
            // Create new location
            const newLocation = new DriverLocation({
                driverId,
                latitude: lat,
                longitude: long
            });
            await newLocation.save();
        }

        res.status(200).json({ success: true, message: "Location updated successfully" });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ success: false, message: "Failed to update location", error: error.message });
    }
};

const orderAssign = async (req, res) => {
    try {
        const driverId = req.headers['driverid'];

        if (!driverId) {
            return res.status(200).json({ success: false, message: "Driver ID is required" });
        }

        const driverRequest = await PTL.find({ driverId: driverId, status: 0 }).sort({ createdAt: -1 });

        if (!driverRequest.length) {
            return res.status(200).json({ success: true, message: "No requests found for this driver", driverRequest: [] });
        }

        const driverCurrentLocation = await getDriverLocation(driverId);

        if (!driverCurrentLocation.success) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }

        // Loop through all requests and calculate distance/duration
        const enrichedRequests = await Promise.all(driverRequest.map(async (request) => {
            const { distanceInKm, duration } = await getDistanceAndDuration(
                driverCurrentLocation.lat,
                driverCurrentLocation.long,
                request.pickupLatitude,
                request.pickupLongitude
            );

            const requestObj = request.toObject();
            requestObj.pickupDistance = distanceInKm;
            requestObj.pickupDuration = duration;

            return requestObj;
        }));

        return res.json({
            success: true,
            driverRequest: enrichedRequests,
            message: `${enrichedRequests.length} Request(s) Incoming`
        });

    } catch (error) {
        console.error('Error in /order-assign:', error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get Driver Location
const getDriverLocation = async (driverId) => {
    try {
        const existingLocation = await DriverLocation.findOne({ driverId });


        if (!existingLocation) {
            return { success: false, message: "Location not found for this driver" };
        }


        if (existingLocation) {
            return {
                success: true,
                lat: existingLocation.latitude,
                long: existingLocation.longitude
            };
        }

    } catch (error) {
        console.error("Error fetching location:", error);
        return { success: false, message: "Failed to fetch location", error: error.message };
    }
};


const tripHistory = async (req, res) => {
    try {
        const driverId = req.header('driverid'); // or req.query / req.body based on how driverId is passed

        if (!driverId) {
            return res.status(200).json({
                success: false,
                message: "Driver ID is required"
            });
        }

        const tripHistoryDetail = await PTL.find({
            driverId,
            status: { $in: [0, 4, 5] }
        });

        const categoryLabels = {
            0: 'All',
            4: 'Completed',
            5: 'Cancelled'
        };

        const groupedTrips = tripHistoryDetail.reduce((acc, trip) => {
            const category = categoryLabels[trip.status] || 'Unknown'; // assuming 'status' field
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(trip);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: groupedTrips,
            message: "Trips Detail Fetch Successfully",


        });

    } catch (error) {
        console.error("Error fetching trip history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch trip history",
            error: error.message
        });
    }
};

const tripHistoryCount = async (req, res) => {
    try {
        const driverId = req.header('driverid'); // or req.query / req.body

        if (!driverId) {
            return res.status(200).json({
                success: false,
                message: "Driver ID is required"
            });
        }

        const tripHistoryDetail = await PTL.find({
            driverId,
            status: { $in: [4, 5] }
        });

        // Count status 4 and 5 separately
        const completedCount = tripHistoryDetail.filter(trip => trip.status === 4).length;
        const cancelledCount = tripHistoryDetail.filter(trip => trip.status === 5).length;

        res.status(200).json({
            success: true,
            data: {
                completedCount,
                cancelledCount
            },
            message: "Trip counts fetched successfully"
        });

    } catch (error) {
        console.error("Error fetching trip history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch trip history",
            error: error.message
        });
    }
};

module.exports = {
    saveDriverLocation,
    orderAssign,
    tripHistory,
    tripHistoryCount
};
