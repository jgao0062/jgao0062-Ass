// BR (B.1): User Input Validations - Two different types
// BR (C.4): Enhanced Security - XSS Protection and Input Validation

import { sanitizeInput, sanitizeEmail, sanitizePhone } from './security.js'

export const validationRules = {
    // Email validation using regex
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },

    // Australian phone number validation using regex
    phone: {
      required: true,
      pattern: /^04\d{8}$/,
      message: 'Please enter a valid Australian mobile number (04XX XXX XXX)'
    },

    // Name validation using string length
    name: {
      required: true,
      minLength: 2,
      message: 'Must be at least 2 characters long'
    },

    // Age validation using number range
    age: {
      required: true,
      min: 16,
      max: 99,
      message: 'Age must be between 16 and 99'
    }
  }

export const validateField = (value, rule) => {
  // First sanitize input to prevent XSS attacks
  const sanitizedValue = sanitizeInput(value)

  if (rule.required && (!sanitizedValue || !sanitizedValue.toString().trim())) {
    return 'This field is required'
  }

  if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
    return rule.message
  }

  if (rule.minLength && sanitizedValue.length < rule.minLength) {
    return rule.message
  }

  if (rule.min && sanitizedValue < rule.min) {
    return rule.message
  }

  if (rule.max && sanitizedValue > rule.max) {
    return rule.message
  }

  return ''
}

export const validateEmail = (email) => {
  // Use security tool to sanitize email
  const sanitizedEmail = sanitizeEmail(email)
  if (!sanitizedEmail) {
    return 'Please enter a valid email address'
  }
  return validateField(sanitizedEmail, validationRules.email)
}

export const validatePhone = (phone) => {
  // Use security tool to sanitize phone number
  const sanitizedPhone = sanitizePhone(phone)
  if (!sanitizedPhone) {
    return 'Please enter a valid Australian mobile number (04XX XXX XXX)'
  }
  return validateField(sanitizedPhone, validationRules.phone)
}

export const validateName = (name) => {
  // Sanitize name input
  const sanitizedName = sanitizeInput(name)
  return validateField(sanitizedName, validationRules.name)
}

export const validateAge = (age) => {
  const sanitizedAge = sanitizeInput(age)
  const ageNumber = parseInt(sanitizedAge)
  if (isNaN(ageNumber)) {
    return 'Please enter a valid age'
  }
  return validateField(ageNumber, validationRules.age)
}

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required'
  }

  // Sanitize password input (but preserve special characters for password strength)
  const sanitizedPassword = sanitizeInput(password)
  if (sanitizedPassword.length < 8) {
    return 'Password must be at least 8 characters long'
  }

  // Check password strength
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(sanitizedPassword)) {
    return 'Password must contain both letters and numbers'
  }

  // Check for dangerous characters
  if (/<script|javascript:|vbscript:/i.test(sanitizedPassword)) {
    return 'Password contains invalid characters'
  }

  return ''
}

export const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) {
    return 'Please confirm your password'
  }

  const sanitizedConfirm = sanitizeInput(confirmPassword)
  const sanitizedPassword = sanitizeInput(password)

  if (sanitizedConfirm !== sanitizedPassword) {
    return 'Passwords do not match'
  }
  return ''
}
