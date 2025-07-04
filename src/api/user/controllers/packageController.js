const axios = require('axios');
require('dotenv').config();
const settingModel = require('../../../admin/models/configuration/settingModel');
const { toFixed } = require('../utils/fixedValue');

// ==========================
// Main Package Calculation
// ==========================
const packageCalculation = async (pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, packages, res) => {
    try {
        const origin = `${pickupLatitude},${pickupLongitude}`;
        const destination = `${dropLatitude},${dropLongitude}`;

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: origin,
                destinations: destination,
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });

        const data = response.data;
        if (data.status !== 'OK' || data.rows?.[0]?.elements?.[0]?.status !== 'OK') {
            return res.status(200).json({ success: false, error: 'Unable to calculate distance.' });
        }

        const element = data.rows[0].elements[0];
        const distanceInKm = element.distance.value / 1000;
        const duration = element.duration.text;

        // Fetch shipping and pricing settings
        const {
            shippingCost = 0,
            specialHandling = 0,
            gst = 18,
            odaChargeMinimum = 750,
            fuelSurChargePercentage = 10,
            fovPercentage = 0.1,
            docketCharge = 100,
            ratePerKG = 12
        } = await fetchPaymentDetail();

        const totalEffectiveWeight = calculateTotalEffectiveWeight(packages);
        let basePrice = totalEffectiveWeight * ratePerKG;

        // Charges
        let fov = Math.max((basePrice * fovPercentage) / 100, 100);
        const fuelCharge = (basePrice * fuelSurChargePercentage) / 100;
        const subTotal = parseFloat((basePrice + fov + fuelCharge + docketCharge).toFixed(2));
        const gstAmount = parseFloat(((subTotal * gst) / 100).toFixed(2));

        // Final total
        let totalPayment = subTotal + gstAmount + shippingCost + specialHandling;

        // ODA logic placeholder
        const isODA = false; // Add real ODA detection logic here
        let odaCharge = 0;
        if (isODA) {
            odaCharge = Math.max(totalEffectiveWeight * 5, odaChargeMinimum);
            totalPayment += odaCharge;
        }

        return {
            subTotal: toFixed(subTotal),
            shippingCost: toFixed(shippingCost),
            specialHandling: toFixed(specialHandling),
            gstAmount: toFixed(gstAmount),
            gstPercentage: toFixed(gst),
            totalPayment: parseFloat(totalPayment.toFixed(2)),
            distance: distanceInKm.toFixed(2),
            duration,
            totalEffectiveWeight: totalEffectiveWeight.toFixed(2),
            odaCharge: isODA ? odaCharge : 0,
        };

    } catch (err) {
        console.error('Distance Matrix Error:', err.message);
        return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
    }
};

// ==========================
// Calculate Total Weight
// ==========================
const calculateTotalEffectiveWeight = (packages) => {
    let totalWeight = 0;
    for (const pkg of packages) {
        const volumetricWeight = (pkg.length * pkg.width * pkg.height * 7) / 1728;
        const effectiveWeight = Math.max(pkg.totalWeight, volumetricWeight);
        totalWeight += effectiveWeight * pkg.numberOfPackages;
    }
    return parseFloat(totalWeight.toFixed(2));
};

// ==========================
// Area Calculator (Optional)
// ==========================
const calculateTotalAreaInSqFt = (packages) => {
    let totalAreaInSqInches = 0;
    for (const pkg of packages) {
        const areaPerPackage = pkg.length * pkg.width;
        totalAreaInSqInches += areaPerPackage * pkg.numberOfPackages;
    }
    const totalAreaInSqFt = totalAreaInSqInches / 144;
    return {
        totalAreaInSqInches,
        totalAreaInSqFt: parseFloat(totalAreaInSqFt.toFixed(2))
    };
};

// ==========================
// Fetch Latest Payment Detail
// ==========================
const fetchPaymentDetail = async () => {
    try {
        const paymentData = await settingModel.find({ paymentDetails: { $exists: true } }).sort({ createdAt: -1 });
        if (paymentData.length > 0) {
            const details = paymentData[0].paymentDetails;
            return {
                gst: parseFloat(details.gst ?? 18),
                shippingCost: parseFloat(details.shippingCost ?? 0),
                specialHandling: parseFloat(details.specialHandling ?? 0),
                odaChargeMinimum: parseFloat(details.odaChargeMinimum ?? 750),
                fuelSurChargePercentage: parseFloat(details.fuelSurChargePercentage ?? 10),
                fovPercentage: parseFloat(details.fovPercentage ?? 0.1),
                docketCharge: parseFloat(details.docketCharge ?? 100),
                ratePerKG: parseFloat(details.ratePerKG ?? 12),
                prePaymentPercentage: parseFloat(details.prePaymentPercentage ?? 0),
                driverPercentageCut: parseFloat(details.driverPercentageCut ?? 0),
                loadingTime: parseInt(details.loadingTime ?? 0),
                unloadingTime: parseInt(details.unloadingTime ?? 0)
            };
        } else {
            console.warn('No payment details found.');
            return {};
        }
    } catch (error) {
        console.error('Error fetching payment details:', error.message);
        return {};
    }
};


const ftlPackageCalculation = async (pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, res, isBidding) => {
    try {
        const origin = `${pickupLatitude},${pickupLongitude}`;
        const destination = `${dropLatitude},${dropLongitude}`;

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: origin,
                destinations: destination,
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });

        const data = response.data;
        if (data.status !== 'OK' || data.rows?.[0]?.elements?.[0]?.status !== 'OK') {
            return res.status(200).json({ success: false, error: 'Unable to calculate distance.' });
        }

        const element = data.rows[0].elements[0];
        const distanceInKm = element.distance.value / 1000;
        const duration = element.duration.text;

        // Fetch shipping and pricing settings
        const {
            shippingCost = 0,
            specialHandling = 0,
            gst = 18,
            prePaymentPercentage = 0,
            driverPercentageCut = 0,
            loadingTime = 0,
            unloadingTime = 0
        } = await fetchPaymentDetail();

        let basePrice = isBidding == 0 ? distanceInKm * 5 : 0;

        // Charges
        const subTotal = parseFloat((basePrice).toFixed(2));
        const gstAmount = parseFloat(((subTotal * gst) / 100).toFixed(2));

        // Final total
        let totalPayment = subTotal + gstAmount + shippingCost + specialHandling;


        return {
            subTotal: toFixed(subTotal),
            shippingCost: toFixed(shippingCost),
            specialHandling: toFixed(specialHandling),
            gstPercentage: toFixed(gst),         // assuming `gst` is the percentage (e.g. 18)
            gstAmount: toFixed(gstAmount),
            totalPayment: toFixed(totalPayment),
            distance: toFixed(distanceInKm),
            duration,                            // keep as-is (string like "48 mins")
            prePaymentPercentage: toFixed(prePaymentPercentage),
            driverPercentageCut: toFixed(driverPercentageCut) || 0,
            loadingTime,                         // keep as-is if it's already a number or string
            unloadingTime
        };

    } catch (err) {
        console.error('Distance Matrix Error:', err.message);
        return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
    }
};


module.exports = { packageCalculation, calculateTotalAreaInSqFt, ftlPackageCalculation };
