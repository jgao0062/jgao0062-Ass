const {onRequest} = require("firebase-functions/v2/https");
const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Load environment variables from .env file for local development
require('dotenv').config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

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

    // Check if message contains HTML tags
    const isHtml = message.includes('<html>') || message.includes('<div>') || message.includes('<p>');

    const msg = {
      to,
      from: 'jinggao1212@gmail.com',
      subject,
      text: isHtml ? message.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : message,
      html: isHtml ? message : `<p>${message}</p>`
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

// Get activity statistics function
exports.getActivityStats = onRequest((req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const db = admin.firestore();

    // Get all activities from the activities collection
    db.collection('activities').get()
      .then((snapshot) => {
        const programStats = {};
        const totalActivities = snapshot.size;

        // Count activities by programId
        snapshot.forEach((doc) => {
          const data = doc.data();
          const programId = data.programId;

          if (programId) {
            if (!programStats[programId]) {
              programStats[programId] = {
                count: 0,
                programName: data.programName || `Program ${programId}`,
                programId: programId
              };
            }
            programStats[programId].count++;
          }
        });

        // Convert to array and sort by count (most popular first)
        const sortedStats = Object.values(programStats)
          .sort((a, b) => b.count - a.count);

        return res.status(200).json({
          success: true,
          data: {
            totalActivities,
            programStats: sortedStats,
            chartData: {
              labels: sortedStats.map(stat => stat.programName),
              datasets: [{
                label: 'Participation Count',
                data: sortedStats.map(stat => stat.count),
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#FF6384',
                  '#C9CBCF',
                  '#4BC0C0',
                  '#FF6384'
                ],
                borderColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#FF6384',
                  '#C9CBCF',
                  '#4BC0C0',
                  '#FF6384'
                ],
                borderWidth: 1
              }]
            }
          }
        });
      })
      .catch((error) => {
        console.error('Firestore Error:', error);
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
