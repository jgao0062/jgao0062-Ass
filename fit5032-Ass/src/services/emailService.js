// Email Service for sending emails via Firebase Functions
import { securityLog } from '../utils/security.js'

const EMAIL_FUNCTION_URL = 'https://sendemail-jfy7r5r5fq-uc.a.run.app'

/**
 * Send email using Firebase Functions
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.message - Email message
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail(emailData) {
  try {
    const response = await fetch(EMAIL_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    const result = await response.json()

    if (result.success) {
      securityLog('info', 'Email sent successfully', {
        to: emailData.to,
        subject: emailData.subject,
        messageId: result.messageId
      })
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      }
    } else {
      securityLog('error', 'Failed to send email', {
        to: emailData.to,
        subject: emailData.subject,
        error: result.error
      })
      return {
        success: false,
        message: result.error || 'Failed to send email'
      }
    }
  } catch (error) {
    securityLog('error', 'Email service error', {
      to: emailData.to,
      subject: emailData.subject,
      error: error.message
    })
    return {
      success: false,
      message: 'Email service error: ' + error.message
    }
  }
}

/**
 * Send program join confirmation email
 * @param {Object} userData - User data
 * @param {Object} programData - Program data
 * @returns {Promise<Object>} Send result
 */
export async function sendProgramJoinEmail(userData, programData) {
  try {
    const emailData = {
      to: userData.email,
      subject: `Welcome to ${programData.name} - Melbourne Community Sports`,
      message: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${programData.name}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">Welcome to Melbourne Community Sports!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your fitness journey starts here</p>
  </div>

  <!-- Main Content -->
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1e293b; margin-top: 0;">Dear ${userData.firstName} ${userData.lastName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Congratulations on successfully joining <strong style="color: #6366f1;">${programData.name}</strong>!
      We're thrilled to have you as part of our community.
    </p>

    <!-- Program Details Card -->
    <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 25px 0;">
      <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">Program Details</h3>

      <div style="display: grid; gap: 15px;">
        <div style="display: flex; align-items: center;">
          <span style="background: #6366f1; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 15px;">NAME</span>
          <span style="font-weight: 600;">${programData.name}</span>
        </div>

        ${programData.description ? `
        <div style="display: flex; align-items: flex-start;">
          <span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 15px; margin-top: 2px;">DESCRIPTION</span>
          <span>${programData.description}</span>
        </div>
        ` : ''}

        ${programData.schedule ? `
        <div style="display: flex; align-items: center;">
          <span style="background: #f59e0b; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 15px;">SCHEDULE</span>
          <span>${programData.schedule}</span>
        </div>
        ` : ''}

        ${programData.location ? `
        <div style="display: flex; align-items: center;">
          <span style="background: #ef4444; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 15px;">LOCATION</span>
          <span>${programData.location}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
        We look forward to spending wonderful time with you!
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        If you have any questions, please feel free to contact us at
        <a href="mailto:support@melbournesports.com" style="color: #6366f1; text-decoration: none;">support@melbournesports.com</a>
      </p>

      <p style="color: #64748b; font-size: 14px; margin: 10px 0 0 0;">
        Best regards,<br>
        <strong style="color: #1e293b;">Melbourne Community Sports Team</strong>
      </p>
    </div>
  </div>

</body>
</html>
      `.trim()
    }

    return await sendEmail(emailData)
  } catch (error) {
    securityLog('error', 'Failed to send program join email', {
      userId: userData.id,
      programId: programData.id,
      error: error.message
    })
    return {
      success: false,
      message: 'Failed to send confirmation email: ' + error.message
    }
  }
}
