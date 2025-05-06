const admin = require("firebase-admin");

const serviceAccount = require("./config/firebaseCred.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://onpoint-9cb10-default-rtdb.firebaseio.com"
});

// Reference to the database
const db = admin.database();

// Example: Store message
function storeMessage(userId, message) {
    console.log("🔥 Attempting to store message...");
    const ref = db.ref("messages");
    const newRef = ref.push();
    newRef.set({
        userId: userId,
        message: message,
        timestamp: '1746505614'
    }).then(() => {
        console.log("✅ Message stored successfully");
    }).catch(err => {
        console.error("❌ Error storing message:", err);
    });
}

// Call it
storeMessage("user_123", "Hello from Node.js to Firebase Realtime DB");
