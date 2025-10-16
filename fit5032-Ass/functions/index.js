const {onRequest} = require("firebase-functions/v2/https");
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid once at module level
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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