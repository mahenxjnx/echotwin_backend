// firebaseAdmin.js
const admin = require('firebase-admin');

const serviceAccount = require('./your-service-account-file.json'); // put this in .gitignore

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { db };
