require('dotenv').config();
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    const userId = req.headers['userid'];

    const serviceId = req.headers['serviceid'];
    const serviceType = req.headers['servicetype'];
    // console.log(userId);

    if (!token) {
        return res.status(200).json({ success: false, message: 'Jwt Token is missing' });
    }
    if (!userId) {
        return res.status(200).json({ success: false, message: 'User Id is missing' });
    }
    if (!serviceId) {
        return res.status(200).json({ success: false, message: 'Service ID is missing' });
    }
    if (!serviceType) {
        return res.status(200).json({ success: false, message: 'Service Type Is Missing' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // contains userId and mobileNumber
        next();
    } catch (err) {
        return res.status(200).json({ success: false, message: 'Invalid Jwt token' });
    }
};
const headerAuth = (req, res, next) => {
    const deviceType = req.headers['devicetype']; // headers are lowercase
    if (!deviceType) {
        return res.status(200).json({ success: false, message: 'DeviceType is missing' });
    } else {
        next();
    }
};


module.exports = { verifyToken, headerAuth };
