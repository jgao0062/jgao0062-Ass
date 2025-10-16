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
      subject: `Welcome to ${programData.name}!`,
      message: `
Dear ${userData.firstName} ${userData.lastName},

Congratulations on successfully joining ${programData.name}!

Program Details:
- Program Name: ${programData.name}
- Description: ${programData.description || 'No description available'}
- Schedule: ${programData.schedule || 'No schedule available'}
- Location: ${programData.location || 'No location available'}

We look forward to spending wonderful time with you!

If you have any questions, please feel free to contact us.

Best regards,
Fitness Center Team
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
