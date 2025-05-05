const admin = require('../../../../config/firebaseConnection');
const PTL = require('../../../admin/models/ptlPackages/driverPackageAssignModel'); // Adjust the model path as needed
const { getDistanceAndDuration } = require('../utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'

// Save Driver Location
const saveDriverLocation = async (req, res) => {
    const driverId = req.headers['driverid'];
    const { lat, long } = req.body;

    if (!driverId || !lat || !long) {
        return res.status(200).json({ message: "Missing driverId, lat or long" });
    }

    try {
        const db = admin.database(); // Access Realtime Database
        await db.ref(`driverCurrentLocation/${driverId}/location`).set({
            latitude: lat,
            longitude: long,
            timestamp: Date.now()
        });

        res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Failed to update location", error: error.message });
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
        const db = admin.database();
        const locationRef = db.ref(`driverCurrentLocation/${driverId}/location`);

        const snapshot = await locationRef.once('value');

        if (!snapshot.exists()) {
            return { success: false, message: "Location not found for this driver" };
        }

        const locationData = snapshot.val();

        if (locationData) {
            return {
                success: true,
                lat: locationData.latitude,
                long: locationData.longitude
            };
        }

    } catch (error) {
        console.error("Error fetching location:", error);
        return { success: false, message: "Failed to fetch location", error: error.message };
    }
};

module.exports = {
    saveDriverLocation,
    orderAssign
};
