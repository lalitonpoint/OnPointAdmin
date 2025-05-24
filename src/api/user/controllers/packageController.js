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
        if (data.status !== 'OK' || data.rows?.[0]?.elements?.[0]?.status !== 'OK') {
            return res.status(200).json({ success: false, error: 'Unable to calculate distance.' });
        }

        const element = data.rows[0].elements[0];
        const distanceInKm = element.distance.value / 1000;
        const duration = element.duration.text;

        // ======================
        // PTL Calculation Begins
        // ======================

        const RATE_PER_KG = 12;
        const DOCKET_CHARGE = 100;
        const FOV_PERCENT = 0.1;
        const FUEL_SURCHARGE_PERCENT = 10;
        const MINIMUM_CHARGE = 500;
        const ODA_CHARGE_MINIMUM = 750;

        let totalEffectiveWeight = 0;

        for (const pkg of packages) {
            const volumetricWeight = (pkg.length * pkg.width * pkg.height * 7) / 1728;
            const effectiveWeightPerPkg = Math.max(pkg.totalWeight, volumetricWeight);
            totalEffectiveWeight += effectiveWeightPerPkg * pkg.numberOfPackages;
        }

        totalEffectiveWeight = parseFloat(totalEffectiveWeight.toFixed(2));

        // Base price
        let basePrice = totalEffectiveWeight * RATE_PER_KG;

        // Extra Charges
        let fov = Math.max((basePrice * FOV_PERCENT) / 100, 100);
        if (fov < 100)
            fov = 100;
        const fuelCharge = (basePrice * FUEL_SURCHARGE_PERCENT) / 100;
        const otherCharges = DOCKET_CHARGE;

        let subTotal = basePrice + fov + fuelCharge + otherCharges;

        // GST
        const { shippingCost, specialHandling, gst } = await fetchPaymentDetail();
        const gstAmount = (subTotal * gst) / 100;

        let totalPayment = subTotal + gstAmount + shippingCost + specialHandling;

        // // Apply minimum charge rule
        // if (totalPayment < MINIMUM_CHARGE) {
        //     totalPayment = MINIMUM_CHARGE;
        // }

        // Apply ODA logic (example logic, you can replace with your actual ODA check)
        const isODA = false; // replace with actual ODA check if needed
        let odaCharge = 0;

        if (isODA) {
            odaCharge = Math.max(totalEffectiveWeight * 5, ODA_CHARGE_MINIMUM);
            totalPayment += odaCharge;
        }

        totalPayment = parseFloat(totalPayment.toFixed(2));
        subTotal = parseFloat(subTotal.toFixed(2));
        const gstFinal = parseFloat(gstAmount.toFixed(2));

        return {
            subTotal,
            shippingCost,
            specialHandling,
            gstAmount: gstFinal,
            totalPayment,
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

const calculateTotalAreaInSqFt = (packages) => {
    let totalAreaInSqInches = 0;

    for (const pkg of packages) {
        const { numberOfPackages, totalWeight, length, width, height } = pkg;

        // const { length, width } = dimensions[0]; // assumes only one dimension per package type
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
