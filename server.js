const express = require('express');
const admin = require('firebase-admin');

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

app.get('/:targetDeviceToken', async (req, res) => {
  const targetDeviceToken = req.params.targetDeviceToken;

  if (!targetDeviceToken) {
    return res.status(400).json({ error: 'Device token is missing in the URL.' });
  }

  const message = {
    data: {
      "title": "New Order!",
      "body": "Check your dashboard now!",
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
