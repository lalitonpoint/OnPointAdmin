const Rating = require('../models/ratingModal')

const driverRating = async (req, res) => {
    try {
        const { driverId, rating, comment } = req.body;

        const userId = req.headers['userid'];

        if (!driverId || !userId || !rating) {
            return res.status(200).json({ success: false, message: 'Missing required fields' });
        }

        const newRating = new Rating({ driverId, userId, rating, comment });
        await newRating.save();

        res.status(201).json({ success: true, message: 'Thanks For Rating.', data: newRating });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { driverRating };