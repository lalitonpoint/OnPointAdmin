const axios = require('axios');

const sendOtp = async (mobileNumber, otp) => {
    const apiKey = '444881AGhSNFD7zMI6822f745P1';
    const senderId = 'ONPNT';
    const templateId = '6808ca80d6fc054bef421352';

    // Ensure number is like '919xxxxxxxxx'
    if (!/^\d{12}$/.test(mobileNumber)) {
        return console.error('❌ Invalid mobile number. Use format like 919xxxxxxxxx');
    }

    if (!/^\d{4}$/.test(otp)) {
        return console.error('❌ Invalid OTP. Use 6-digit numeric OTP.');
    }

    try {
        const response = await axios.post('https://api.msg91.com/api/v5/otp', {
            flow_id: templateId,
            sender: senderId,
            mobile: `${mobileNumber}`, // Must be in 91XXXXXXXXXX format
            OTP: otp // This must match the {{OTP}} variable in the flow
        }, {
            headers: {
                authkey: apiKey,
                'Content-Type': 'application/json',
            }
        });

        if (response.data.type === 'success') {
            console.log('✅ SMS sent successfully:', response.data);
        } else {
            console.error('❌ MSG91 returned an error:', response.data);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Response error:', error.response.data);
        } else if (error.request) {
            console.error('❌ Request error:', error.request);
        } else {
            console.error('❌ General error:', error.message);
        }
    }
};

// 🔁 Example usage
sendOtp('919354978804', '1234');
