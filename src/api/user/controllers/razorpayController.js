
const razorpayWebhook = async (req, res) => {

    try {
        res.status(200).json({ success: true, message: 'Webhook', response: req });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { razorpayWebhook };