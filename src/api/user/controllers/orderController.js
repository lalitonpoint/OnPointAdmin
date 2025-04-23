const Order = require('../../../api/user/models/paymentModal');

const getOrderList = async (req, res) => {
    const { status } = req.body;

    try {
        let orderDetail;

        if (status) {
            orderDetail = await Order.find({ transactionStatus: status }).sort({ createdAt: -1 });
        } else {
            orderDetail = await Order.find().sort({ createdAt: -1 });
        }

        res.status(200).json({
            success: true,
            data: { orderDetail }
        });
    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

const singleOrderDetail = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(200).json({
            success: false,
            message: 'orderId is required'
        });
    }

    try {
        const order = await Order.findOne({ orderId }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(200).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { order }
        });
    } catch (err) {
        console.error('Error fetching Order Detail:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};


module.exports = { getOrderList, singleOrderDetail };
