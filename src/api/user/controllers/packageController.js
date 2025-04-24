const axios = require('axios');
require('dotenv').config();
const settingModel = require('../../../admin/models/configuration/settingModel');

const packageCalculation = async (pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, packages, res) => {
    try {
        const origin = `${pickupLatitude},${pickupLongitude}`;
        const destination = `${dropLatitude},${dropLongitude}`;

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: origin,
                destinations: destination,
                key: process.env.GOOGLE_MAPS_API_KEY,
            }
        });

        const data = response.data;

        if (data.status !== 'OK') {
            return res.status(200).json({ success: false, message: 'Google Maps API error. Please try again.' });
        }

        const element = data.rows?.[0]?.elements?.[0];

        if (!element || element.status !== 'OK') {
            let errorMessage = 'Unable to calculate distance.';

            if (element?.status === 'NOT_FOUND') {
                errorMessage = 'Please enter valid coordinates.';
            } else if (element?.status === 'ZERO_RESULTS') {
                errorMessage = 'No route could be found between the given points.';
            }

            return res.status(200).json({ success: false, error: errorMessage });
        }

        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
        const duration = element.duration.text;

        const { totalAreaInSqFt } = calculateTotalAreaInSqFt(packages);

        const ratePerKm = 5;
        const ratePerSqFt = 2;

        const deliveryCharge = (distanceInKm * ratePerKm) + (totalAreaInSqFt * ratePerSqFt);
        const subTotal = parseFloat(deliveryCharge.toFixed(2));

        const { shippingCost, specialHandling, gst } = await fetchPaymentDetail();
        const gstAmount = parseFloat(((subTotal * gst) / 100).toFixed(2));
        const totalPayment = parseFloat((subTotal + shippingCost + specialHandling + gstAmount).toFixed(2));

        // console.log('subTotal12345678', shippingCost);
        return {
            subTotal,
            shippingCost,
            specialHandling,
            gstAmount,
            totalPayment,
            distanceInKm: distanceInKm.toFixed(2),
            duration
        };
    } catch (err) {
        console.error('Distance Matrix Error:', err.message);
        return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
    }
};

const calculateTotalAreaInSqFt = (packages) => {
    let totalAreaInSqInches = 0;

    for (const pkg of packages) {
        const { numberOfPackages, dimensions } = pkg;
        if (!dimensions || dimensions.length === 0) continue;

        const { length, width } = dimensions[0]; // assumes only one dimension per package type
        const areaPerPackage = length * width;
        const totalAreaForType = areaPerPackage * numberOfPackages;

        totalAreaInSqInches += totalAreaForType;
    }

    const totalAreaInSqFt = totalAreaInSqInches / 144;

    return {
        totalAreaInSqInches,
        totalAreaInSqFt: parseFloat(totalAreaInSqFt.toFixed(2))
    };
};

const fetchPaymentDetail = async () => {
    try {
        const paymentData = await settingModel
            .find({ paymentDetails: { $exists: true } })
            .sort({ createdAt: -1 });

        if (paymentData.length > 0) {
            const details = paymentData[0].paymentDetails;
            // console.log('details', details);

            const gst = parseFloat(details.gst || 18);
            const shippingCost = parseFloat(details.shippingCost || 0);
            const specialHandling = parseFloat(details.specialHandling || 0);

            return { shippingCost, specialHandling, gst };
        } else {
            console.warn('No payment details found.');
            return { shippingCost: 0, specialHandling: 0, gst: 18 };
        }
    } catch (error) {
        console.error('Error fetching payment details:', error.message);
        return { shippingCost: 0, specialHandling: 0, gst: 18 };
    }
};

module.exports = { packageCalculation };
