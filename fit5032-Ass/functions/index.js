const {onRequest} = require("firebase-functions/v2/https");
const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');

// Load environment variables from .env file for local development
require('dotenv').config();

// Initialize SendGrid once at module level
// Support both new .env format and legacy functions.config()
const apiKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.api_key;
if (!apiKey) {
  throw new Error('SendGrid API key not found. Please set SENDGRID_API_KEY environment variable or configure sendgrid.api_key in Firebase Functions config.');
}
sgMail.setApiKey(apiKey);

// Email sending function
exports.sendEmail = onRequest((req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, message' });
    }

    const msg = {
      to,
      from: 'jinggao1212@gmail.com',
      subject,
      text: message,
      html: `<p>${message}</p>`
    };

    sgMail.send(msg)
      .then(([response]) => {
        return res.status(200).json({
          success: true,
          message: 'Email sent successfully',
          messageId: response?.headers?.['x-message-id']
        });
      })
      .catch((error) => {
        console.error('SendGrid Error:', error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      });

  } catch (error) {
    console.error('Function Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});