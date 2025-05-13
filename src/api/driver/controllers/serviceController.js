const admin = require('../../../../config/firebaseConnection');
const PTL = require('../../../admin/models/ptlPackages/driverPackageAssignModel'); // Adjust the model path as needed
const { getDistanceAndDuration } = require('../utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'
const DriverLocation = require('../modals/driverLocModal'); // Assuming the common function is located in '../utils/distanceCalculate'
const mongoose = require('mongoose');
const { generateOTP } = require('../utils/generateOtp');
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');


// Save Driver Locationconst DriverLocation = require('../models/DriverLocation'); // adjust the path as needed
const saveDriverLocation = async (req, res) => {
    const driverId = req.headers['driverid'];
    const { lat, long } = req.body;

    if (!driverId || !lat || !long) {
        return res.status(200).json({ success: false, message: "Missing driverId, lat, or long" });
    }

    try {
        let latitude = lat;
        let longitude = long;

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

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            data: {
                lat: latitude,
                long: longitude
            }
        });
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
            return res.status(200).json({ success: true, message: "No requests found for this driver", data: [] });
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
        const id = req.body.assignId;
        const orderStatus = parseInt(req.body.status);






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

        if (!(orderStatus in statusKeyMap)) {
            return res.status(200).json({ success: false, message: 'Invalid status. Must be between 0 and 5.' });
        }




        if (orderStatus <= order.status) {
            return res.status(200).json({
                success: false,
                message: statusMessageMap[order.status] || 'Order is already updated to this status'
            });
        }

        const now = new Date();

        // Backfill only blank intermediate statuses (i.e., if status is 0 or date is missing)
        const updateFields = {};

        for (let i = order.status + 1; i <= orderStatus; i++) {
            if (order.deliveryStatus[i]) {
                // If status is 0 or deliveryDateTime is empty, update them
                if (order.deliveryStatus[i].status !== 1 || !order.deliveryStatus[i].deliveryDateTime) {
                    updateFields[`deliveryStatus.${i}.status`] = 1;
                    updateFields[`deliveryStatus.${i}.deliveryDateTime`] = now;
                }
            }
        }

        // Set the new main status
        updateFields.status = orderStatus;

        // Perform the update operation
        await PTL.updateOne({ _id: id }, { $set: updateFields });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: await PTL.findById(id) // Fetch the updated order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const pickupOrder = async (req, res) => {
    try {
        const { assignId: id, pickupStatus } = req.body;
        const driverId = req.header('driverid')

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(200).json({ success: false, message: 'Assign Id is required' });
        }



        const order = await PTL.findById(id).populate({ path: 'userId', select: 'fullName' });
        if (!order) {
            return res.status(200).json({ success: false, message: 'Order not found' });
        }

        const user = order.userId;
        let topHeader = '';
        let bottomHeader = '';


        // === Step 1: Trip started (Go to pickup)
        if (pickupStatus === 0) {
            topHeader = 'Start Trip';
            bottomHeader = 'Way To Pickup';

            const driverCurrentLocation = await getDriverLocation(driverId);
            if (!driverCurrentLocation.success) {
                return res.status(200).json({ success: false, message: "Please update driver's current location" });
            }

            const { distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
                driverCurrentLocation.lat,
                driverCurrentLocation.long,
                order.pickupLatitude,
                order.pickupLongitude
            );

            return res.json({
                success: true,
                data: {
                    topHeader,
                    bottomHeader,
                    pickupDistance,
                    pickupDuration,
                    username: user.fullName,
                    address: order.pickupAddress,
                    pickupLatitude: order.pickupLatitude,
                    pickupLongitude: order.pickupLongitude,

                },
                message: "Driver Way to Pickup"
            });
        }

        // === Step 2: Arrived at pickup location
        if (pickupStatus === 1) {
            // ❗ Check if the trip was started first
            // if (order.pickupStatus !== 0) {
            //     return res.status(200).json({ success: false, message: "You can only arrive after starting the pickup trip" });
            // }

            const updatedOrder = await PTL.findByIdAndUpdate(id, { $set: { pickupStatus: 1 } }, { new: true });
            if (!updatedOrder) {
                return res.status(200).json({ success: false, message: "Failed to update pickup status" });
            }

            topHeader = 'Arrived';
            bottomHeader = 'Arrived';

            const driverCurrentLocation = await getDriverLocation(driverId);
            if (!driverCurrentLocation.success) {
                return res.status(200).json({ success: false, message: "Please update driver's current location" });
            }

            const { distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
                driverCurrentLocation.lat,
                driverCurrentLocation.long,
                order.pickupLatitude,
                order.pickupLongitude
            );

            return res.json({
                success: true,
                data: {
                    topHeader,
                    bottomHeader,
                    pickupDistance,
                    pickupDuration,
                    username: user.fullName,
                    address: order.pickupAddress,
                    pickupLatitude: order.pickupLatitude,
                    pickupLongitude: order.pickupLongitude,
                },
                message: "Driver Go For Pickup"

            });
        }

        // === Step 3: Picked up successfully
        if (pickupStatus === 2) {
            // if (order.pickupStatus !== 1) {
            //     return res.status(200).json({ success: false, message: "You can only mark pickup after arriving" });
            // }

            const updatedOrder = await PTL.findByIdAndUpdate(
                id,
                { $set: { pickupStatus: 2, status: 1 } },
                { new: true }
            );

            if (!updatedOrder) {
                return res.status(200).json({ success: false, message: "Failed to mark order as picked up" });
            }

            return res.status(200).json({
                success: true,
                message: "Driver Arrived At PickupLoaction",
                data: { verification: updatedOrder.pickupStatus == 2 ? 1 : 0 },
            });
        }

        return res.status(200).json({ success: false, message: "Invalid pickup status" });

    } catch (error) {
        console.error("pickupOrder error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};



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


const formatMobile = (countryCode, mobileNumber) => {
    try {
        const fullNumber = `${countryCode}${mobileNumber}`;
        const parsed = parsePhoneNumber(fullNumber);
        if (parsed && parsed.isValid()) {
            return {
                formatted: parsed.number, // E.164 format: +919354978804
                countryCode: parsed.countryCallingCode,
                nationalNumber: parsed.nationalNumber,
            };
        }
        return null;
    } catch (error) {
        return null;
    }
};

const otpStorage = {}; // Use Redis for production

const pickupSendOtp = async (req, res) => {

    try {
        const { countryCode, mobileNumber } = req.body;

        if (!countryCode || !mobileNumber) {
            return res.status(200).json({ success: false, message: 'Country code and mobile number are required.' });
        }

        const parsed = formatMobile(countryCode, mobileNumber);

        if (!parsed || !isValidPhoneNumber(parsed.formatted)) {
            return res.status(200).json({ success: false, message: 'Invalid mobile number format.' });
        }

        const otp = "123456";
        // const otp = generateOTP();
        otpStorage[parsed.formatted] = otp;

        console.log(`Generated OTP for ${parsed.formatted}: ${otp}`);
        res.status(200).json({ success: true, message: 'OTP sent successfully on ' + parsed.formatted, otp: otp });
        return;

        try {
            const message = await client.messages.create({
                body: `Your OTP for login is: ${otp}`,
                to: parsed.formatted,
                from: twilioPhoneNumber,
            });

            console.log(`OTP sent to ${parsed.formatted}, SID: ${message.sid}`);
            return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
        } catch (error) {
            console.error('Twilio Error:', error);
            return res.status(500).json({ success: false, message: 'Failed to send OTP via SMS.' });
        }

    } catch (error) {
        console.error('sendOtp Error:', error);
        return res.status(500).json({ success: false, message: 'Unexpected error in sending OTP.' });
    }
};


module.exports = {
    saveDriverLocation,
    orderAssign,
    tripHistory,
    tripHistoryCount,
    updateOrderStatus,
    pickupOrder,
    pickupSendOtp
};
