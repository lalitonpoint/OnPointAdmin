const admin = require('../../../../config/firebaseConnection');

// Function to send notification
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
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
        // res.json({ success: true, message: "Order assigned and notification sent.", response: response });

    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

// Example usage (inside order assignment logic)
const assignOrderToDriver = async (req, res) => {
    const { orderId, driverId } = req.body;


    const driverToken = 'dTL0_NH7SEGUfnuBemSwws:APA91bGNrUzxKwRUqgFcMqol9lMbWaglogn5alWSHI0c_weYRR2UN0ti875aIDTuXNMAN0c7HPYSBzxEg3Kwzvzv0RzhuDMFrOFyjWzQ8E70ARBylxEcWZE';

    // const driverToken = await getDriverToken(driverId); // Your DB logic

    const orderData = {
        orderId: orderId,
        pickupLocation: "Warehouse A",
        deliveryLocation: "Client B",
    };

    await sendOrderNotificationToDriver(driverToken, orderData);

    res.json({ success: true, message: "Order assigned and notification sent." });
}

module.exports = { assignOrderToDriver }
