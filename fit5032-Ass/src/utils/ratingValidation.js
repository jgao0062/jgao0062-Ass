// BR (C.3): Rating - Validation utilities
export const ratingValidation = {
  // Validate rating input
  validateRatingInput(rating) {
    const errors = []

    if (rating === null || rating === undefined) {
      errors.push('Rating cannot be empty')
    }

    if (typeof rating !== 'number') {
      errors.push('Rating must be a number')
    }

    if (rating < 1 || rating > 5) {
      errors.push('Rating must be between 1-5')
    }

    if (!Number.isInteger(rating)) {
      errors.push('Rating must be an integer')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Validate user ID
  validateUserId(userId) {
    const errors = []

    if (!userId || userId.trim() === '') {
      errors.push('User ID cannot be empty')
    }

    if (userId.length < 3) {
      errors.push('User ID must be at least 3 characters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Validate program ID
  validateProgramId(programId) {
    const errors = []

    if (programId === null || programId === undefined) {
      errors.push('Program ID cannot be empty')
    }

    if (typeof programId !== 'number') {
      errors.push('Program ID must be a number')
    }

    if (programId <= 0) {
      errors.push('Program ID must be a positive number')
    }

    return {
      isValid: errors.length === 0,
      errors
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

  // Sanitize rating input
  sanitizeRating(rating) {
    if (typeof rating === 'string') {
      const parsed = parseFloat(rating)
      if (!isNaN(parsed)) {
        return Math.round(parsed)
      }
    }

    if (typeof rating === 'number') {
      return Math.round(rating)
    }

    return null
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
