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

/**
 * Route:
 *   /:token/:title/:body
 *
 * Example final URL (encoded):
 *   https://fcm.qellner.com/abcd123/Order%2012%21/Check%20Dashboard
 */
app.get('/:token/:title/:body', async (req, res) => {
  const { token, title, body } = req.params;

  if (!token || !title || !body) {
    return res.status(400).json({
      error: 'Missing token, title, or body in the URL.'
    });
  }

  const decodedToken = decodeURIComponent(token);
  const decodedTitle = decodeURIComponent(title);
  const decodedBody = decodeURIComponent(body);

  const message = {
    data: {
      title: decodedTitle,
      body: decodedBody,
      icon: "/qellner_logo_icon.png",
      url: "https://qellner.com"
    },
    token: decodedToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).json({
      success: true,
      messageId: response,
      sent: {
        token: decodedToken,
        title: decodedTitle,
        body: decodedBody
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send FCM message.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`FCM server running on port ${PORT}`);
});
