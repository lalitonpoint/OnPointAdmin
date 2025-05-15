const admin = require('../../../../config/firebaseConnection');
const Driver = require('../../../api/driver/modals/driverModal');
const Package = require('../../../api/user/models/paymentModal');

// Send FCM to driver
const sendOrderNotificationToDriver = async (driverToken, orderData) => {
    const message = {
        token: driverToken,
        notification: {
            title: "New Order Assigned",
            body: `Order #${orderData.orderId} has been assigned to you.`,
        },
        data: {
            orderId: String(orderData.orderId),
            pickupLocation: orderData.pickupLocation,
            deliveryLocation: orderData.deliveryLocation,
        },
        android: {
            priority: "high",
            notification: {
                sound: "default",
            },
        },
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

const assignOrderToDriver = async (driverId, packageId) => {

    const packageData = await Package.findById(packageId);
    const driverData = await Driver.findById(driverId);

    try {
        const driverDeviceToken = driverData.deviceToken;

        const orderData = {
            orderId: packageData.orderId,
            pickupLocation: "Warehouse A",
            deliveryLocation: "Client B",
        };

        await sendOrderNotificationToDriver(driverDeviceToken, orderData);

        res.json({ success: true, message: "Order assigned and notification sent." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { assignOrderToDriver };
