const admin = require('../../../../config/firebaseConnection');
const Driver = require('../../../api/driver/modals/driverModal');
const Package = require('../../user/models/paymentModal');
const Assign = require('../../../admin/models/ptlPackages/driverPackageAssignModel');

// // Send FCM to driver
// const sendOrderNotificationToDriver = async (driverToken, orderData) => {
//     if (!driverToken) {
//         console.error("Driver token is missing.");
//         return false;
//     }

//     const message = {
//         token: driverToken,
//         notification: {
//             title: "New Order Assigned",
//             body: `Order #${orderData.orderId} has been assigned to you.`,
//         },
//         data: {
//             orderId: String(orderData.orderId),
//             pickupLocation: orderData.pickupLocation || '',
//             deliveryLocation: orderData.deliveryLocation || '',
//         },
//         android: {
//             priority: "high",
//             notification: {
//                 sound: "default",
//             },
//         },
//     };

//     try {
//         const response = await admin.messaging().send(message);
//         console.log("Notification sent successfully:", response);
//         return true;
//     } catch (error) {
//         console.error("Error sending notification:", error);
//         return false;
//     }
// };

const sendOrderNotificationToDriver = async (driverToken, orderData) => {
    if (!driverToken) {
        console.error("Driver token is missing.");
        return false;
    }

    const message = {
        token: driverToken,
        notification: {
            title: "New Order Assigned",
            body: `Order #${orderData.orderId} has been assigned to you.`,
        },
        data: {
            orderId: String(orderData.orderId),
            pickupLocation: orderData.pickupLocation || '',
            deliveryLocation: orderData.deliveryLocation || '',
        },
        android: {
            priority: "high",
            notification: {
                sound: "default",
            },
        },
        apns: {
            payload: {
                aps: {
                    alert: {
                        title: "New Order Assigned",
                        body: `Order #${orderData.orderId} has been assigned to you.`,
                    },
                    sound: "default",
                    badge: 1,
                },
            },
            headers: {
                'apns-priority': '10',
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
        return true;
    } catch (error) {
        console.error("Error sending notification:", error);
        return false;
    }
};

const assignOrderToDriver = async (driverId, packageId, assignId) => {

    console.log('DriverID', driverId)
    console.log('packageId', packageId)
    console.log('assignId', assignId)

    try {
        const [packageData, driverData, assignData] = await Promise.all([
            Package.findById(packageId),
            Driver.findById(driverId),
            Assign.findById(assignId),
        ]);

        if (!packageData || !driverData || !assignData) {
            console.warn("One or more records not found");
            return false;
        }

        const orderData = {
            orderId: packageData.orderId,
            pickupLocation: assignData.pickupAddress,
            deliveryLocation: assignData.dropAddress,
        };

        console.log('orderData', orderData);
        console.log('driverData.deviceToken', driverData.deviceToken);

        const notificationSent = await sendOrderNotificationToDriver(driverData.deviceToken, orderData);
        return notificationSent;
    } catch (error) {
        console.error("Error assigning order:", error.message);
        return false;
    }
};

module.exports = { assignOrderToDriver };
