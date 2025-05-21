const axios = require('axios');

const sendSms = (data) => {
    const mobile = data.mobile;
    const otp = data.otp;
    const template_id = '6808ca80d6fc054bef421352'; // Replace with dynamic template ID if needed
    const authkey = '444881AGhSNFD7zMI6822f745P1'; // Authkey remains constant

    const url = `https://control.msg91.com/api/v5/otp?otp=${otp}&otp_expiry=1&template_id=${template_id}&mobile=${mobile}&authkey=${authkey}&realTimeResponse=1`;

    const payload = {
        Param1: 'value1',
        Param2: 'value2',
        Param3: 'value3'
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


module.exports = { sendSms }
// sendSms({ mobile: '919354978804', otp: '123456' })
//     .then(response => console.log('SMS sent response:', response))
//     .catch(err => console.error('Error:', err));
