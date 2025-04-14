const ContactUs = require('../models/contactUsModel');

const createContact = async (req, res) => {
    try {
        const { name, email, mobile, typeOfService, message } = req.body;

        // Basic validation (you can add more robust validation)
        if (!name || !email || !mobile || !message) {
            return res.status(200).json({ success: false, message: 'Please fill in all required fields.' });
        }

        const newContact = new ContactUs({
            name,
            email,
            mobile,
            typeOfService,
            message
        });

        const savedContact = await newContact.save();

        res.status(201).json({ success: true, message: 'Your message has been received. Thank you!', data: savedContact });

    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ success: false, message: 'Failed to save your message. Please try again later.', error: error.message });
    }
};

module.exports = { createContact }