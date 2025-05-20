const admin = require('../../../../config/firebaseConnection');
const PTL = require('../../../admin/models/ptlPackages/driverPackageAssignModel'); // Adjust the model path as needed
const { getDistanceAndDuration } = require('../utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'
const DriverLocation = require('../modals/driverLocModal'); // Assuming the common function is located in '../utils/distanceCalculate'
const PaymentDetail = require('../../../api/user/models/paymentModal'); // Assuming the common function is located in '../utils/distanceCalculate'
const mongoose = require('mongoose');
const { generateOTP } = require('../utils/generateOtp');
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');
const { uploadImage } = require("../../../admin/utils/uploadHelper"); // Import helper for file upload
const multiparty = require('multiparty');
const DriverModal = require('../../../api/driver/modals/driverModal'); // Assuming the common function is located in '../utils/distanceCalculate'



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
        const driverId = req.header('driverid');

        if (!driverId) {
            return res.status(200).json({
                success: false,
                message: "Driver ID is required"
            });
        }

        const trips = await PTL.find({
            driverId,
            status: { $in: [0, 1, 2, 3, 4, 5] }
        })
            .populate({ path: 'userId', select: 'fullName' })
            .populate({ path: 'packageId', select: 'orderId' });

        const groupedTrips = {
            All: [],
            Completed: [],
            Cancelled: []
        };

        for (const trip of trips) {
            const tripData = {
                userName: trip?.userId?.fullName || '',
                status: trip.status,
                orderId: trip?.packageId?.orderId || '',
                pickAddress: trip.pickupAddress || '',
                dropAddress: trip.dropAddress || '',
                totalDistance: trip.totalDistance || '',
                totalDuration: trip.totalDuration || '',
                createdAt: trip.createdAt
            };

            // Push all trips to "All"
            groupedTrips.All.push(tripData);

            // Push to specific status-based categories
            if (trip.status === 4) {
                groupedTrips.Completed.push(tripData);
            } else if (trip.status === 5) {
                groupedTrips.Cancelled.push(tripData);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Trips detail fetched successfully",
            data: groupedTrips
        });

    } catch (error) {
        console.error("Error fetching trip history:", error);
        return res.status(500).json({
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

        const driverData = await DriverModal.find({ _id: driverId, status: 1 });

        console.log('dddd', driverData[0]);

        // Count status 4 and 5 separately
        const completedCount = tripHistoryDetail.filter(trip => trip.status === 4).length;
        const cancelledCount = tripHistoryDetail.filter(trip => trip.status === 5).length;

        res.status(200).json({
            success: true,
            data: {
                completedCount,
                cancelledCount,
                driverApprovalStatus: driverData[0].approvalStatus || 0
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

const pickupOrder = async (req, res) => {
    try {
        const { assignId: id, pickupStatus, step } = req.body;
        const driverId = req.header('driverid');

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(200).json({ success: false, message: 'Assign Id is required or invalid' });
        }

        if (![0, 1, 2].includes(pickupStatus)) {
            return res.status(200).json({ success: false, message: 'Invalid pickup status' });
        }

        if (typeof step == "undefined") {
            return res.status(200).json({ success: false, message: 'Step Is required' });
        }


        if (![0, 1, 2, 3, 4, 5].includes(step)) {
            return res.status(200).json({ success: false, message: 'Invaild Step' });
        }

        const order = await PTL.findById(id).populate({ path: 'userId', select: 'fullName' });
        if (!order) {
            return res.status(200).json({ success: false, message: 'Order not found' });
        }

        const user = order.userId;
        const driverLocation = await getDriverLocation(driverId);

        if (!driverLocation.success) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }

        const { lat, long } = driverLocation;
        const { distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
            lat, long, order.pickupLatitude, order.pickupLongitude
        );

        const stepStatusMap = {
            0: 0,
            1: 1,
            2: 2
        };

        if (pickupStatus != stepStatusMap[step]) {
            return res.status(200).json({ success: false, message: 'Order Status Is According To Steps' });
        }

        let topHeader = '', bottomHeader = '', message = '';

        switch (pickupStatus) {
            case 0: // Start trip
                topHeader = 'Start Trip';
                bottomHeader = 'Way To Pickup';
                buttonText = 'Go Now';
                message = "Driver Way to Pickup";
                break;

            case 1: // Arriving at pickup
                await PTL.findByIdAndUpdate(id, { $set: { pickupStatus: 1, step: step } });
                topHeader = 'Arriving';
                bottomHeader = 'Way to Pickup';
                buttonText = 'Arriving to Pickup';
                message = "Driver Go For Pickup";
                break;

            case 2: //  Arrived at pickup
                await PTL.findByIdAndUpdate(id, { $set: { pickupStatus: 2, step: step } });
                topHeader = 'Arrived';
                bottomHeader = 'Arrived at Pickup Location';
                buttonText = 'Arrived';
                message = "Driver Arrived At Pickup Location";
                break;
        }


        return res.status(200).json({
            success: true,
            data: {
                topHeader,
                bottomHeader,
                pickupDistance,
                pickupDuration,
                userName: user.fullName,
                address: order.pickupAddress,
                pickupLatitude: order.pickupLatitude,
                pickupLongitude: order.pickupLongitude,
                dropLatitude: order.dropLatitude,
                dropLongitude: order.dropLongitude,
                assignType: order.assignType,
                step: step
            },
            message
        });

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

const pickupVerifyOtp = async (req, res) => {
    try {
        const { countryCode, mobileNumber, otp, assignId: id } = req.body;

        // Validate required fields
        if (!countryCode || !mobileNumber || !otp || !id) {
            return res.status(200).json({
                success: false,
                message: 'Country code, mobile number, OTP, and AssignId are required.',
            });
        }

        const parsed = formatMobile(countryCode, mobileNumber);

        if (!parsed || !isValidPhoneNumber(parsed.formatted)) {
            return res.status(200).json({
                success: false,
                message: 'Invalid mobile number format.',
            });
        }

        const storedOTP = otpStorage[parsed.formatted];

        if (!storedOTP) {
            return res.status(200).json({
                success: false,
                message: 'OTP expired or not found.',
            });
        }

        if (otp !== storedOTP) {
            return res.status(200).json({
                success: false,
                message: 'Invalid OTP.',
            });
        }

        // OTP is valid, delete it from memory
        delete otpStorage[parsed.formatted];
        console.log(`OTP verified for ${parsed.formatted}`);

        // Update PTL document
        const now = new Date();
        const updateFields = {
            status: 1,
            pickupMobile: parsed.formatted,
            'deliveryStatus.0.status': 1,
            'deliveryStatus.0.deliveryDateTime': now
        };

        const result = await PTL.updateOne({ _id: id }, { $set: updateFields });

        if (result.modifiedCount === 0) {
            return res.status(200).json({
                success: false,
                message: 'No record found to update.',
            });
        }

        // Fetch updated PTL data with populated user info and package detail
        const [ptlData, packageDetail] = await Promise.all([
            PTL.findById(id).populate({ path: 'userId', select: 'fullName mobileNumber countryCode' }),
            PTL.findById(id).then(data => PaymentDetail.findById(data.packageId)) // Avoid re-querying PTL twice
        ]);

        if (!ptlData || !ptlData.userId || !packageDetail) {
            return res.status(200).json({
                success: false,
                message: 'Required data not found after update.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP verified and Order Is Successfully Pickup.',
            data: {
                totalPackage: packageDetail.packages.length,
                userName: ptlData.userId.fullName,
                userContact: ptlData.userId.countryCode + ptlData.userId.mobileNumber,
                notes: packageDetail.pickupNote,
                address: ptlData.pickupAddress,
                packages: packageDetail.packages,
                pickupLatitude: ptlData.pickupLatitude,
                pickupLongitude: ptlData.pickupLongitude,
                dropLatitude: ptlData.dropLatitude,
                dropLongitude: ptlData.dropLongitude,
                buttonText: ptlData.assignType == 1 ? 'Way To Warehouse' : 'Way To User Location'
            }
        });

    } catch (error) {
        console.error('verifyOtp Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Unexpected error in OTP verification.',
            msg: error.message
        });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const form = new multiparty.Form({ maxFilesSize: 100 * 1024 * 1024 });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form data:", err);
                return res.status(200).json({ error: "Failed to parse form data" });
            }

            const id = fields.assignId?.[0] || '';
            const orderStatus = parseInt(fields.status?.[0], 10);
            const step = parseInt(fields.step?.[0], 10);
            const driverId = req.header('driverid');

            if (!id) {
                return res.status(200).json({ success: false, message: 'Assign Id is required' });
            }

            if (!orderStatus) {
                return res.status(200).json({ success: false, message: 'Status is required' });
            }

            if (typeof step == "undefined") {
                return res.status(200).json({ success: false, message: 'Step Is required' });
            }


            if (![0, 1, 2, 3, 4, 5].includes(step)) {
                return res.status(200).json({ success: false, message: 'Invaild Step' });
            }

            const stepStatusMap = {
                3: 2,
                4: 3,
                5: 4
            };

            if (orderStatus != stepStatusMap[step]) {
                return res.status(200).json({ success: false, message: 'Order Status Is According To Steps' });
            }



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

            const order = await PTL.findById(id).populate({ path: 'userId', select: 'fullName' });
            if (!order) {
                return res.status(200).json({ success: false, message: 'Order not found' });
            }

            // if (orderStatus <= order.status) {
            //     return res.status(200).json({
            //         success: false,
            //         message: statusMessageMap[order.status] || 'Order is already updated to this status'
            //     });
            // }

            const now = new Date();
            const updateFields = { status: orderStatus };

            // Update delivery status chain
            for (let i = order.status + 1; i <= orderStatus; i++) {
                if (order.deliveryStatus[i]?.status !== 1 || !order.deliveryStatus[i].deliveryDateTime) {
                    updateFields[`deliveryStatus.${i}.status`] = 1;
                    updateFields[`deliveryStatus.${i}.deliveryDateTime`] = now;
                }
            }

            // POD upload if required
            if (order.assignType == 2 && orderStatus == 4) {
                const recipientName = fields.recipientName?.[0] || null;
                const confirmNumber = fields.confirmNumber?.[0] || null;
                const pod = files.pod?.[0];

                const requiredFields = {
                    recipientName,
                    confirmNumber,
                    pod
                };

                for (const [key, value] of Object.entries(requiredFields)) {
                    if (value == null) {
                        return res.status(200).json({ success: false, message: `${key} is required.` });
                    }
                }



                const result = await uploadImage(pod);
                if (!result.success) {
                    console.error("Error uploading image:", result.error || result.message);
                    return res.status(500).json({ error: "Failed to upload POD image" });
                }

                updateFields.recipientName = recipientName;
                updateFields.confirmNumber = confirmNumber;
                updateFields.pod = result.url;
            }
            updateFields.step = step;


            // Update DB
            await PTL.updateOne({ _id: id }, { $set: updateFields });

            // Driver location & distance calc
            const driverLocation = await getDriverLocation(driverId);
            if (!driverLocation.success) {
                return res.status(200).json({ success: false, message: "Please update driver's current location" });
            }

            const { lat, long } = driverLocation;
            const { distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
                lat, long, order.pickupLatitude, order.pickupLongitude
            );

            const user = order.userId;
            let topHeader = '', bottomHeader = '', buttonText = '', message = '';

            switch (orderStatus) {
                case 2:
                    topHeader = 'Start';
                    bottomHeader = order.assignType == 1 ? 'Way To Warehouse' : 'Way to Drop-off';
                    buttonText = 'Go Now'
                    message = "Order In Transit";
                    break;
                case 3:
                    topHeader = 'Arriving';
                    bottomHeader = order.assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                    buttonText = order.assignType == 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                    message = "Order Out For Delivery";
                    break;
                case 4:
                    topHeader = 'Deliver';
                    bottomHeader = order.assignType == 1 ? 'Delivered to Warehouse' : 'Delivered to User';
                    buttonText = 'Delivered';
                    message = order.assignType == 1 ? 'Order Delivered To Warehouse' : 'Order Delivered To User Location';
                    break;
                default:
                    message = 'Order status updated successfully';
            }

            return res.status(200).json({
                success: true,
                message,
                data: {
                    topHeader,
                    bottomHeader,
                    pickupDistance,
                    pickupDuration,
                    userName: user.fullName,
                    address: order.pickupAddress,
                    pickupLatitude: order.pickupLatitude,
                    pickupLongitude: order.pickupLongitude,
                    dropLatitude: order.dropLatitude,
                    dropLongitude: order.dropLongitude,
                    assignType: order.assignType,
                    step: step
                }
            });
        });
    } catch (error) {
        console.error("Internal error:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};



module.exports = {
    saveDriverLocation,
    orderAssign,
    tripHistory,
    tripHistoryCount,
    updateOrderStatus,
    pickupOrder,
    pickupSendOtp,
    pickupVerifyOtp,
    getDriverLocation
};
