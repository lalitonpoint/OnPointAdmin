const axios = require('axios');

const sendEmailOTP = async (toEmail, otpCode) => {
    const apiKey = 'YOUR_MSG91_API_KEY';  // Your MSG91 authkey
    const fromEmail = 'no-reply@yourdomain.com'; // Must be approved by MSG91
    const subject = 'Your OTP Code';
    const body = `Your One-Time Password (OTP) is: <b>${otpCode}</b>. It is valid for 10 minutes.`;

    try {
        const response = await axios.post(
            'https://api.msg91.com/api/v5/email/send',
            {
                to: toEmail,
                from: fromEmail,
                subject: subject,
                body: body,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    authkey: apiKey,
                },
            }
        );

        console.log('Email sent:', response.data);
    } catch (error) {
        console.error('Error sending email:', error.response?.data || error.message);
    }
};

// Example usage
sendEmailOTP('user@example.com', '472839');
