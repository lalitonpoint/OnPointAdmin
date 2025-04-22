const axios = require('axios');
require('dotenv').config();
const Parcel = require('../models/parcelModel');

const pickupDropLocation = async (req, res) => {
    const { pickupPincode, dropPincode, pickupAddress, dropAddress } = req.body;
    const userId = req.headers['userid'];

    if (!pickupPincode || !dropPincode || !userId) {
        return res.status(200).json({ message: 'Pickup, drop pin codes and userId are required.' });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: pickupPincode,
                destinations: dropPincode,
                key: process.env.GOOGLE_MAPS_API_KEY,
            }
        });

        const data = response.data;

        if (data.status !== 'OK') {
            return res.status(400).json({ message: 'Google Maps API error. Please try again.' });
        }

        const element = data.rows?.[0]?.elements?.[0];

        if (!element || element.status !== 'OK') {
            let errorMessage = 'Unable to calculate distance.';

            if (element?.status === 'NOT_FOUND') {
                errorMessage = 'Please Enter The Valid Pincode.';
            } else if (element?.status === 'ZERO_RESULTS') {
                errorMessage = 'No route could be found between the given pincodes.';
            }

            return res.status(200).json({ error: errorMessage });
        }

        const distanceInKm = element.distance?.text;
        const duration = element.duration?.text;
        const deliveryCharge = (element.distance?.value || 0) / 1000 * 5;

        const parcelDetail = new Parcel({
            userId,
            pickupPincode,
            dropPincode,
            pickupAddress,
            dropAddress,
            distance: distanceInKm,
            duration,
            deliveryCharge: Math.ceil(deliveryCharge),
            status: 1
        });

        await parcelDetail.save();

        res.status(200).json({
            message: 'Delivery details saved successfully.',
            data: parcelDetail
        });

    } catch (err) {
        console.error('Distance Matrix Error:', err.message);
        res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
};

module.exports = { pickupDropLocation };
