const admin = require("firebase-admin");

const serviceAccount = require("./firebaseCred.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://onpoint-9cb10-default-rtdb.firebaseio.com/"
});

module.exports = admin