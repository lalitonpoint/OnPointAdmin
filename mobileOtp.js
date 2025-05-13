const axios = require('axios');

const sendSMS = async (mobileNumber, otp) => {
    const apiKey = '444881AGhSNFD7zMI6822f745P1'; // Replace with your actual authkey
    const senderId = 'ONPNT'; // Approved sender ID
    const templateId = '6808ca80d6fc054bef421352'; // Approved Flow template ID

    try {
        const response = await axios.post('https://control.msg91.com/api/v5/flow/', {
            flow_id: templateId,
            sender: senderId,
            mobiles: mobileNumber, // e.g., 919354978804
            OTP: otp // ✅ matches {{OTP}} in template
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
sendSMS('919354978804', '123456');
