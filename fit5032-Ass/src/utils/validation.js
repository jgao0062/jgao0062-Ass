// BR (B.1): User Input Validations - Two different types

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
    if (rule.required && (!value || !value.toString().trim())) {
      return 'This field is required'
    }
  
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message
    }
  
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message
    }
  
    if (rule.min && value < rule.min) {
      return rule.message
    }
  
    if (rule.max && value > rule.max) {
      return rule.message
    }
  
    return ''
  }
  
  export const validateEmail = (email) => {
    return validateField(email, validationRules.email)
  }
  
  export const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\s/g, '')
    return validateField(cleanPhone, validationRules.phone)
  }
  
  export const validateName = (name) => {
    return validateField(name, validationRules.name)
  }
  
  export const validateAge = (age) => {
  return validateField(parseInt(age), validationRules.age)
}

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return 'Password must contain both letters and numbers'
  }
  return ''
}

export const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) {
    return 'Please confirm your password'
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match'
  }
  return ''
}