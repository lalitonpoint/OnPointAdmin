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


    // const driverToken = 'dRC3aC4CRMiP6H_08OOjQw:APA91bGVz_Ds2rWn4YWZFH8ssoek7iOUvACczieDBwVt0Kkc4wlkbxwGYT9944APWwM7q90tCn-bDHSWroQCSx6E6uTU62d9-7W8Tyh-wbQYbQpDH3fJnYQ';
    const driverToken = 'czptey0uTCiGGmmAh7lsWU:APA91bFaKSTNfmJ5FXaXxJnQ0VmhTNzvk-i4KfOHJq-R17txaaH8c3K7R5PtlQ6Ek58HwWAr5JVIlfVx-Hn7Lbb_UnpLysO7kRT4ZZqxkZWFUJ53qYkmbtU';

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
