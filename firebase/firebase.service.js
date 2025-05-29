const admin = require("firebase-admin");

async function sendMessage(token, title, body, data) {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token,
  };

  try {
    const resp = await admin.messaging().send(message);
    return resp;
  } catch (e) {
    return null;
  }
}

module.exports = { sendMessage };
