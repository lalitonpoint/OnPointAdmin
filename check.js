const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Resolve full path safely
const serviceAccountPath = path.resolve(__dirname, "./config/firebaseCred.json");

if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ firebaseCred.json file not found at path:", serviceAccountPath);
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (err) {
    console.error("❌ Failed to load firebaseCred.json:", err.message);
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://onpoint-9cb10-default-rtdb.firebaseio.com",
    });

    const db = admin.database();
    const ref = db.ref("test_connection");

    ref.set({
        status: "✅ Firebase connected successfully!",
        checkedAt: new Date().toISOString()
    })
        .then(() => {
            console.log("✅ Firebase write success.");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Firebase write failed:", error.message);
            process.exit(1);
        });

} catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    process.exit(1);
}
