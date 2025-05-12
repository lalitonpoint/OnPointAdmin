const axios = require('axios');

const sendSMS = async (mobileNumber, message) => {
    const apiKey = 'ONPNT';
    const senderId = 'apiKey'; // 6-character sender ID approved by MSG91
    const templateId = '1707174539966744871'; // Use approved template ID for DLT
    const route = '4'; // Transactional SMS

    try {
        const response = await axios.post('https://control.msg91.com/api/v5/flow/', {
            flow_id: templateId,
            sender: senderId,
            mobiles: mobileNumber,
            VAR1: message, // Replace VAR1 with your template variables
        }, {
            headers: {
                authkey: apiKey,
                'Content-Type': 'application/json',
            }
        });

        console.log('SMS sent:', response.data);
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);
    }
};

// Example usage
sendSMS('919999999999', 'Your OTP is 123456');
