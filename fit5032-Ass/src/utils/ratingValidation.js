// BR (C.3): Rating - Validation utilities
// BR (C.4): Enhanced Security - XSS Protection and Input Validation

import { sanitizeInput, sanitizeNumber, securityLog } from './security.js'
export const ratingValidation = {
  // Validate rating input
  validateRatingInput(rating) {
    const errors = []

    if (rating === null || rating === undefined) {
      errors.push('Rating cannot be empty')
      return { isValid: false, errors }
    }

    // Sanitize and validate input
    const sanitizedRating = sanitizeNumber(rating, 1, 5)
    if (sanitizedRating === null) {
      errors.push('Rating must be a valid number between 1-5')
      securityLog('warning', 'Invalid rating input attempted', { rating })
    } else if (!Number.isInteger(sanitizedRating)) {
      errors.push('Rating must be an integer')
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedRating
    }
  },

  // Validate user ID
  validateUserId(userId) {
    const errors = []

    if (!userId || userId.trim() === '') {
      errors.push('User ID cannot be empty')
      return { isValid: false, errors }
    }

    // Sanitize user ID input
    const sanitizedUserId = sanitizeInput(userId.toString())
    if (sanitizedUserId.length < 3) {
      errors.push('User ID must be at least 3 characters')
    }

    // Check for dangerous characters
    if (/<script|javascript:|vbscript:/i.test(sanitizedUserId)) {
      errors.push('User ID contains invalid characters')
      securityLog('warning', 'Suspicious user ID input', { userId })
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedUserId
    }
  },

  // Validate program ID
  validateProgramId(programId) {
    const errors = []

    if (programId === null || programId === undefined) {
      errors.push('Program ID cannot be empty')
      return { isValid: false, errors }
    }

    // Sanitize and validate program ID
    const sanitizedProgramId = sanitizeNumber(programId, 1, Infinity)
    if (sanitizedProgramId === null) {
      errors.push('Program ID must be a valid positive number')
      securityLog('warning', 'Invalid program ID input', { programId })
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedProgramId
    }
  },

  // Comprehensive validation for rating submission
  validateRatingSubmission(programId, userId, rating) {
    const programValidation = this.validateProgramId(programId)
    const userValidation = this.validateUserId(userId)
    const ratingValidation = this.validateRatingInput(rating)

    const allErrors = [
      ...programValidation.errors,
      ...userValidation.errors,
      ...ratingValidation.errors
    ]

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      programValid: programValidation.isValid,
      userValid: userValidation.isValid,
      ratingValid: ratingValidation.isValid
    }
  },

  // Sanitize rating input - use sanitizeNumber from security.js
  sanitizeRating(rating) {
    return sanitizeNumber(rating, 1, 5)
  },

  // Format rating display
  formatRating(rating) {
    if (rating === null || rating === undefined) {
      return 'No rating available'
    }

    return `${rating.toFixed(1)}/5.0`
  },

  // Get rating description
  getRatingDescription(rating) {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Average'
    if (rating >= 2.0) return 'Poor'
    return 'Very Poor'
  }
}
