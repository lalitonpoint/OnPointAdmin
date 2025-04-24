
const razorpayWebhook = async (req, res) => {
    try {
        res.status(201).json({ success: true, message: 'Webhook', response: res });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { razorpayWebhook };