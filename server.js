const express = require('express');
const admin = require('firebase-admin');

// --- Firebase Initialization (No Change) ---
const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!jsonString) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(jsonString);
} catch (error) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = 4000;

// --- Middleware to parse JSON body (NEW) ---
app.use(express.json());

// --- Updated POST route handler ---
app.post('/', async (req, res) => {
  // Extract data from the request body (NEW)
  const targetDeviceToken = req.body.token;
  const notificationTitle = req.body.title;
  const notificationBody = req.body.body;

  // Validation
  if (!targetDeviceToken || !notificationTitle || !notificationBody) {
    return res.status(400).json({ error: 'Missing required fields: token, title, or body in the request body.' });
  }

  const message = {
    data: {
      // Use the dynamic values from the PocketBase hook (UPDATED)
      "title": notificationTitle,
      "body": notificationBody,
      "icon": "/qellner_logo_icon.png",
      "url": "https://qellner.com"
    },
    token: targetDeviceToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).json({ success: true, messageId: response, description: 'FCM message sent successfully.' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send FCM message.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
