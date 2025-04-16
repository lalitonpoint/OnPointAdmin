require('dotenv').config();
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(200).json({ message: 'Token is missing' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // contains userId and mobileNumber
        next();
    } catch (err) {
        return res.status(200).json({ message: 'Invalid token' });
    }
};
const headerAuth = (req, res, next) => {
    const deviceType = req.headers['devicetype']; // headers are lowercase
    if (!deviceType) {
        return res.status(400).json({ message: 'DeviceType is missing' });
    } else {
        next();
    }
};


module.exports = { verifyToken, headerAuth };
