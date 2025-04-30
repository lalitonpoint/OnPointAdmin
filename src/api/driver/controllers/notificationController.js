const admin = require('../../../../config/firebaseConnection');

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

const assignOrderToDriver = async (req, res) => {
    // const { orderId, driverId } = req.body;
    const orderId = "OPL-37IU9"

    // if (!orderId || !driverId) {
    //     return res.status(400).json({ success: false, message: "Missing orderId or driverId" });
    // }

    try {
        // Replace with real DB lookup

        // const driverDeviceToken = await getDriverToken(driverId);
        const driverDeviceToken = 'dPVvB-NNkkG_lWFJnYM9mF:APA91bHshfMe_oWlBA7wV-L9zUmG5VL6ALvwA8om_vD8uLkGSJCT_rt0tapAXYJrSkz91MNrBJYlL-8QC65HNQq2T34o6oF3ZzoT0EyHwrLhoAD2AYDT1kY';

        const orderData = {
            orderId,
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
