const DriverAssign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');
const { getDriverLocation } = require('./serviceController')
const { getDistanceAndDuration } = require('../utils/distanceCalculate'); // Assuming the common function is located in '../utils/distanceCalculate'

const masterDetail = async (req, res) => {
    try {
        const driverId = req.header('driverid');
        if (!driverId) {
            return res.status(200).json({ success: false, message: "Driver ID is required in headers." });
        }

        const pendingRequest = await DriverAssign.findOne({
            driverId,
            pickupStatus: { $ne: 0 },
            status: { $nin: [4, 5] }
        })
            .sort({ createdAt: -1 })
            .populate({ path: 'userId', select: 'fullName' });

        if (!pendingRequest) {
            return res.status(200).json({ success: true, pendingRequest: 0, data: [], message: 'No pending requests' });
        }

        const driverLocation = await getDriverLocation(driverId);
        if (!driverLocation.success) {
            return res.status(200).json({ success: false, message: "Please update driver's current location" });
        }

        const { lat, long } = driverLocation;
        const { distanceInKm: pickupDistance, duration: pickupDuration } = await getDistanceAndDuration(
            lat, long, pendingRequest.pickupLatitude, pendingRequest.pickupLongitude
        );

        const user = pendingRequest.userId;
        const assignType = pendingRequest.assignType;

        let step = 0;
        const { pickupStatus, status } = pendingRequest;

        if (pickupStatus === 1 && status === 0) step = 1;
        else if (pickupStatus === 2 && status === 0) step = 2;
        else if (pickupStatus === 2 && status === 2) step = 3;
        else if (pickupStatus === 2 && status === 3) step = 4;
        else if (pickupStatus === 2 && status === 4) step = 5;

        let topHeader = '', bottomHeader = '', message = '';

        switch (step) {
            case 1:
                topHeader = 'Arriving';
                bottomHeader = 'Way to Pickup';
                message = "Driver Go For Pickup";
                break;
            case 2:
                topHeader = 'Arrived';
                bottomHeader = 'Arrived';
                message = "Driver Arrived At User Location";
                break;
            case 3:
                topHeader = 'Start';
                bottomHeader = assignType === 1 ? 'Way To Warehouse' : 'Way to Drop-off';
                message = "Order In Transit";
                break;
            case 4:
                topHeader = 'Arriving';
                bottomHeader = assignType === 1 ? 'Arriving to Warehouse' : 'Arriving to User Location';
                message = "Order Out For Delivery";
                break;
            case 5:
                topHeader = 'Delivered';
                bottomHeader = assignType === 1 ? 'Delivered to Warehouse' : 'Delivered to User';
                message = assignType === 1 ? 'Order Delivered To Warehouse' : 'Order Delivered To User Location';
                break;
        }

        const data = [{
            topHeader,
            bottomHeader,
            pickupDistance,
            pickupDuration,
            userName: user?.fullName || 'N/A',
            address: pendingRequest.pickupAddress || 'N/A',
            pickupLatitude: pendingRequest.pickupLatitude || '',
            pickupLongitude: pendingRequest.pickupLongitude || '',
        }];

        res.status(200).json({
            success: true,
            pendingRequest: 1,
            data,
            message: 'Master Data',
        });

    } catch (err) {
        console.error('Error fetching Master data:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = { masterDetail };
