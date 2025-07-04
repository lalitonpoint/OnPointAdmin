const axios = require('axios');

// SMS Function (MSG91 OTP SMS)
function send_sms(data) {
    const mobile = data.mobile;
    const otp = data.otp;
    const template_id = '6808ca80d6fc054bef421352'; // ✅ Replace with actual MSG91 template ID
    const authkey = '444881AGhSNFD7zMI6822f745P1';

    const url = `https://control.msg91.com/api/v5/otp?otp=${otp}&otp_expiry=5&template_id=${template_id}&mobile=${mobile}&authkey=${authkey}&realTimeResponse=1`;

    const payload = {
        Param1: otp // Only include dynamic params if template uses them
    };

    const headers = {
        'Content-Type': 'application/json'
    };

    return axios.post(url, payload, { headers })
        .then(response => response.data)
        .catch(error => {
            console.error('SMS sending failed:', error.response ? error.response.data : error.message);
            return false;
        });
}

// EMAIL Function (MSG91 Transactional Email API)
function send_email(data) {
    const email = data.email;
    const otp = data.otp;
    const authkey = '444881AGhSNFD7zMI6822f745P1'; // ✅ Replace with actual MSG91 Email Auth Key
    const domain = 'onpoint.com'; // ✅ This domain must be verified in MSG91 panel
    const from = 'onpoint@gmail.com'; // ✅ Must be verified sender email in MSG91

    const payload = {
        to: [email],
        from: from,
        subject: 'Your OTP Code',
        html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
        domain: domain
    };

    const headers = {
        'Content-Type': 'application/json',
        'authkey': authkey
    };

    return axios.post('https://api.msg91.com/api/v5/email/send', payload, { headers })
        .then(response => response.data)
        .catch(error => {
            console.error('Email sending failed:', error.response ? error.response.data : error.message);
            return false;
        });
}

// Combined Function to Send OTP via SMS + Email
async function send_otp(data) {
    const smsResponse = await send_sms(data);
    const emailResponse = await send_email(data);

    return {
        sms: smsResponse,
        email: emailResponse
    };
}

// Test Trigger
send_otp({
    mobile: '+919354978804',
    email: 'rajkumar10881088@email.com',
    otp: '123456'
})
    .then(response => console.log('OTP Sent:', response))
    .catch(err => console.error('Error:', err));
