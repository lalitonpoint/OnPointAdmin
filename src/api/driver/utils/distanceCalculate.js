const axios = require('axios');

const getDistanceAndDuration = async (pickupLatitude, pickupLongitude, dropLatitude, dropLongitude) => {
    try {
        // const origin = `28.628177771489916,77.37401796388887`;
        // const destination = `28.740181365930166,76.57085135674956`;

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
            throw new Error('Google Maps API error. Please try again.');
        }

        const element = data.rows?.[0]?.elements?.[0];

        if (!element || element.status !== 'OK') {
            let errorMessage = 'Unable to calculate distance.';

            if (element?.status === 'NOT_FOUND') {
                errorMessage = 'Please enter valid coordinates.';
            } else if (element?.status === 'ZERO_RESULTS') {
                errorMessage = 'No route could be found between the given points.';
            }

            throw new Error(errorMessage);
        }

        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
        const duration = element.duration.text;

        return { distanceInKm, duration };

    } catch (error) {
        console.error('Error in Google Maps API:', error);
        throw new Error('Failed to fetch distance from Google Maps API');
    }
};

const checkRadius = async (pickupLat, pickupLng, driverLat, driverLng) => {

    const distance = getDistanceFromLatLonInKm(pickupLat, pickupLng, driverLat, driverLng);
    const radiusInKm = 100;

    if (distance <= radiusInKm) {
        // Driver is in the pickup radius
        console.log("Show request to driver");
        return true;

    } else {
        // Driver is outside the radius
        console.log("Don't show request");
        return false;

    }

}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}


module.exports = { getDistanceAndDuration, checkRadius }