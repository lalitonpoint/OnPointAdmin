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

        const driverRequest = await PTL.find({ driverId, status: 0 }).sort({ createdAt: -1 })
            .populate({ path: 'userId', select: 'fullName' })
            .populate({ path: 'packageId', select: 'packages' });

        if (!driverRequest.length) {
            return res.status(200).json({ success: true, message: "No requests found for this driver", driverRequest: [] });
        }

        const driverCurrentLocation = await getDriverLocation(driverId);

        if (!driverCurrentLocation.success) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }

        const enrichedRequests = await Promise.all(driverRequest.map(async (request) => {
            const requestObj = request.toObject();

            // Default values
            let pickupDistance = 0, pickupDuration = 0;
            let dropDistance = 0, dropDuration = 0;

            // Calculate pickup distance & duration
            try {
                ({ distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
                    driverCurrentLocation.lat,
                    driverCurrentLocation.long,
                    request.pickupLatitude,
                    request.pickupLongitude
                ));
            } catch (e) {
                console.error(`Error in pickup distance for request ${request._id}:`, e.message);
            }

            // Calculate drop distance & duration
            try {
                ({ distanceInKm: dropDistance, duration: dropDuration } = await getDistanceAndDuration(
                    request.pickupLatitude,
                    request.pickupLongitude,
                    request.dropLatitude,
                    request.dropLongitude
                ));
            } catch (e) {
                console.error(`Error in drop distance for request ${request._id}:`, e.message);
            }

            requestObj.pickupDistance = pickupDistance;
            requestObj.pickupDuration = pickupDuration;
            requestObj.dropDistance = dropDistance;
            requestObj.dropDuration = dropDuration;
            requestObj.arrivalTime = getArrivalTime(pickupDuration);
            requestObj.userName = requestObj.userId?.fullName || '';
            requestObj.packageName = await requestObj.packageId?.packages
                ?.map(p => p.packageName)
                ?.filter(Boolean)
                ?.join(', ') || '';
            requestObj.packageId = requestObj.packageId?._id;

            delete requestObj.createdAt;
            delete requestObj.updatedAt;
            delete requestObj.__v;
            delete requestObj.deliveryStatus;
            delete requestObj.userId;
            // delete requestObj.packageId;




            return requestObj;
        }));

        return res.json({
            success: true,
            data: enrichedRequests,
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

const updateOrderStatus = async (req, res) => {
    try {
        const driverId = req.header('driverid');
        const packageId = req.body.packageId;
        const orderStatus = parseInt(req.body.status);

        // Allowed statuses and corresponding keys
        const statusKeyMap = {
            0: 'pending',
            1: 'pickup',
            2: 'in_transit',
            3: 'out_for_delivery',
            4: 'delivered',
            5: 'cancelled'
        };

        const statusMessageMap = {
            0: 'Order is already pending',
            1: 'Order is already picked up',
            2: 'Order is already in transit',
            3: 'Order is already out for delivery',
            4: 'Order is already delivered',
            5: 'Order is already cancelled'
        };

        // Validate status
        if (!Object.keys(statusKeyMap).includes(orderStatus.toString())) {
            return res.status(200).json({ success: false, message: 'Invalid status. Must be between 0 and 5.' });
        }

        if (!packageId) {
            return res.status(200).json({ success: false, message: 'packageId is required' });
        }

        // Find the latest order
        const order = await PTL.findOne({ driverId, packageId }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Ensure new status is greater than current status
        if (orderStatus <= order.status) {
            return res.status(200).json({
                success: false,
                message: statusMessageMap[order.status] || 'Order is already updated to this status'
            });
        }

        // Ensure deliveryStatus is an array
        if (!Array.isArray(order.deliveryStatus)) {
            order.deliveryStatus = [];
        }

        // Append to deliveryStatus history
        order.deliveryStatus.push({
            key: statusKeyMap[orderStatus],
            status: orderStatus,
            deliveryDateTime: new Date()
        });
        // console.log('order', order);

        // Update order status
        order.status = orderStatus;

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const parseDurationText = (durationText) => {

}


function getArrivalTime(durationInText) {

    const regex = /(?:(\d+)\s*hour[s]?)?\s*(?:(\d+)\s*min[s]?)?/;
    const matches = durationInText.match(regex);
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const durationInSeconds = (hours * 60 + minutes) * 60; // in seconds

    const now = new Date(); // Current time
    const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);

    // Format to readable IST time
    return arrivalTime.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}



module.exports = {
    saveDriverLocation,
    orderAssign,
    tripHistory,
    tripHistoryCount,
    updateOrderStatus
};
