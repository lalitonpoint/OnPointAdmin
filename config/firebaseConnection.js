const admin = require("firebase-admin");
const settingModel = require('../src/admin/models/configuration/settingModel');

let firebaseAdmin;

const initFirebaseAdmin = async () => {
    if (firebaseAdmin) return firebaseAdmin; // Singleton

    const fireCredentialData = await settingModel
        .findOne({ 'firebase': { $exists: true } })
        .sort({ createdAt: -1 });

    console.log(fireCredentialData);

    if (!fireCredentialData || !fireCredentialData.firebase) {
        throw new Error("Firebase credentials not found in DB.");
    }

    const credentials = fireCredentialData.firebase;
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
            type: credentials.type,
            project_id: credentials.project_id,
            private_key_id: credentials.private_key_id,
            private_key: credentials.private_key,
            client_email: credentials.client_email,
            client_id: credentials.client_id,
            auth_uri: credentials.auth_uri,
            token_uri: credentials.token_uri,
            auth_provider_x509_cert_url: credentials.auth_provider_x509_cert_url,
            client_x509_cert_url: credentials.client_x509_cert_url,
            universe_domain: credentials.universe_domain
        }),
        databaseURL: credentials.databaseURL
    });

    return firebaseAdmin;
}

module.exports = { initFirebaseAdmin };
