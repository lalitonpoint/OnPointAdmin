const Order = require('../../../api/user/models/paymentModal');

const getOrderList = async (req, res) => {
    const { orderType } = req.body;

    try {
        let orderDetail;

        if (orderType) {
            orderDetail = await Order.find({ transactionStatus: orderType }).sort({ createdAt: -1 });
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

module.exports = { getOrderList };
