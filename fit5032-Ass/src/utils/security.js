// BR (C.4): Security - Simplified XSS Protection and Input Sanitization
// Core security utilities for basic protection

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped safe text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return String(text || '')
  }

  const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Sanitize user input - basic cleaning
 * @param {string} input - User input
 * @returns {string} - Sanitized safe input
 */
export function sanitizeInput(input) {
  if (input == null) return ''

  const str = String(input)

  // Remove control characters and excessive whitespace
  let cleaned = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Limit length
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 1000)
  }

  return cleaned
}

/**
 * Validate and sanitize email address
 * @param {string} email - Email address
 * @returns {string|null} - Safe email address or null
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null

  const cleaned = email.toLowerCase().trim()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  if (!emailRegex.test(cleaned) || cleaned.length > 254) {
    return null
  }

  return cleaned
}

/**
 * Validate and sanitize phone number (Australian format)
 * @param {string} phone - Phone number
 * @returns {string|null} - Safe phone number or null
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return null

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Validate Australian mobile number format
  if (cleaned.length === 10 && cleaned.startsWith('04')) {
    return cleaned
  }

  return null
}

/**
 * Validate and sanitize numeric input (simplified)
 * @param {any} value - Input value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number|null} - Safe number or null
 */
export function sanitizeNumber(value, min = -Infinity, max = Infinity) {
  const num = Number(value)

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  if (num < min || num > max) {
    return null
  }

  return num
}

/**
 * Generate CSRF token (simplified)
 * @returns {string} - CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(16) // Reduced from 32
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token (simplified)
 * @param {string} token - CSRF token
 * @param {string} sessionToken - Session token
 * @returns {boolean} - Whether token is valid
 */
export function validateCSRFToken(token, sessionToken) {
  return token && sessionToken && token === sessionToken
}

/**
 * Rate limit check (simplified)
 * @param {string} key - Limit key
 * @param {number} maxAttempts - Maximum attempts
 * @param {number} windowMs - Time window (milliseconds)
 * @returns {boolean} - Whether request is allowed
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now()
  const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]')

  // Clean expired records
  const validAttempts = attempts.filter(time => now - time < windowMs)

  if (validAttempts.length >= maxAttempts) {
    return false
  }

  // Record current attempt
  validAttempts.push(now)
  localStorage.setItem(`rate_limit_${key}`, JSON.stringify(validAttempts))

  return true
}

/**
 * Simple security logging
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} data - Additional data
 */
export function securityLog(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: escapeHtml(message),
    data: sanitizeInput(JSON.stringify(data))
  }

  console.log(`[SECURITY ${level.toUpperCase()}]`, logEntry)
}

/**
 * Initialize basic security settings
 */
export function initializeSecurity() {
  // Add basic security meta tags
  if (typeof document !== 'undefined') {
    const metaTags = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { name: 'format-detection', content: 'telephone=no' }
    ]

    metaTags.forEach(meta => {
      if (!document.querySelector(`meta[name="${meta.name}"]`)) {
        const metaElement = document.createElement('meta')
        metaElement.name = meta.name
        metaElement.content = meta.content
        document.head.appendChild(metaElement)
      }
    })
  }

  securityLog('info', 'Security module initialized')
}

// Auto initialize
if (typeof window !== 'undefined') {
  initializeSecurity()
}
