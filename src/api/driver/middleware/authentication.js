require('dotenv').config();
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    const driverId = req.headers['driverid'];


    if (!token) {
        return res.status(200).json({ success: false, message: 'Token is missing' });
    }
    if (!driverId) {
        return res.status(200).json({ success: false, message: 'Driver Id is missing' });
    }



    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // contains driverId and mobileNumber
        next();
    } catch (err) {
        return res.status(200).json({ success: false, message: 'Invalid Jwt token' });
    }
};

const headerAuth = (req, res, next) => {
    const deviceType = req.headers['devicetype']; // headers are lowercase
    const deviceId = req.headers['deviceid']; // headers are lowercase
    const deviceToken = req.headers['devicetoken']; // headers are lowercase
    const serviceId = req.headers['serviceid']; // headers are lowercase
    const serviceType = req.headers['servicetype']; // headers are lowercase

    if (!deviceType) {
        return res.status(200).json({ success: false, message: 'DeviceType is missing' });
    } else if (!deviceId) {
        return res.status(200).json({ success: false, message: 'Device Id is missing' });
    } else if (!deviceToken) {
        return res.status(200).json({ success: false, message: 'Device Token is missing' });
    } else if (!serviceId) {
        return res.status(200).json({ success: false, message: 'Service Id Is Missing' });
    } else if (!serviceType) {
        return res.status(200).json({ success: false, message: 'Service Type Is Missing' });
    }
    else {
        next();
    }
};


module.exports = { verifyToken, headerAuth };
