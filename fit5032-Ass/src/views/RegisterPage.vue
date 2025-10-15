<template>
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card shadow">
            <div class="card-body p-5">
              <h2 class="text-center mb-4">Join Our Community</h2>
              <p class="text-center text-muted mb-4">
                Register to access all our sports programs and community events
              </p>

              <form @submit.prevent="submitRegistration">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">First Name *</label>
                      <input
                        type="text"
                        class="form-control"
                        v-model="registration.firstName"
                        :class="getValidationClass('firstName')"
                        @blur="validateField('firstName')"
                        placeholder="Enter your first name"
                      >
                      <div class="form-text text-muted">
                        <i class="fas fa-info-circle"></i> Must be at least 2 characters long
                      </div>
                      <div v-if="errors.firstName" class="validation-error">{{ errors.firstName }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Last Name *</label>
                      <input
                        type="text"
                        class="form-control"
                        v-model="registration.lastName"
                        :class="getValidationClass('lastName')"
                        @blur="validateField('lastName')"
                        placeholder="Enter your last name"
                      >
                      <div class="form-text text-muted">
                        <i class="fas fa-info-circle"></i> Must be at least 2 characters long
                      </div>
                      <div v-if="errors.lastName" class="validation-error">{{ errors.lastName }}</div>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Email Address *</label>
                  <input
                    type="email"
                    class="form-control"
                    v-model="registration.email"
                    :class="getValidationClass('email')"
                    @blur="validateField('email')"
                    placeholder="Enter your email address"
                  >
                  <div class="form-text text-muted">
                    <i class="fas fa-info-circle"></i> Please enter a valid email address (e.g., user@example.com)
                  </div>
                  <div v-if="errors.email" class="validation-error">{{ errors.email }}</div>
                  <div v-if="registration.email && !errors.email" class="validation-success">
                    <i class="fas fa-check"></i> Valid email format
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    class="form-control"
                    v-model="registration.phone"
                    :class="getValidationClass('phone')"
                    @blur="validateField('phone')"
                    placeholder="04XX XXX XXX"
                  >
                  <div class="form-text text-muted">
                    <i class="fas fa-info-circle"></i> Please enter a valid Australian mobile number (04XX XXX XXX)
                  </div>
                  <div v-if="errors.phone" class="validation-error">{{ errors.phone }}</div>
                  <div v-if="registration.phone && !errors.phone" class="validation-success">
                    <i class="fas fa-check"></i> Valid Australian mobile number
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Password *</label>
                      <input
                        type="password"
                        class="form-control"
                        v-model="registration.password"
                        :class="getValidationClass('password')"
                        @blur="validateField('password')"
                        placeholder="Create a password"
                      >
                      <div class="form-text text-muted">
                        <i class="fas fa-info-circle"></i> Must be at least 8 characters with letters and numbers
                      </div>
                      <div v-if="errors.password" class="validation-error">{{ errors.password }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Confirm Password *</label>
                      <input
                        type="password"
                        class="form-control"
                        v-model="registration.confirmPassword"
                        :class="getValidationClass('confirmPassword')"
                        @blur="validateField('confirmPassword')"
                        placeholder="Confirm your password"
                      >
                      <div class="form-text text-muted">
                        <i class="fas fa-info-circle"></i> Must match your password
                      </div>
                      <div v-if="errors.confirmPassword" class="validation-error">{{ errors.confirmPassword }}</div>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Age *</label>
                      <input
                        type="number"
                        class="form-control"
                        v-model="registration.age"
                        :class="getValidationClass('age')"
                        @blur="validateField('age')"
                        min="16"
                        max="99"
                        placeholder="Enter your age"
                      >
                      <div class="form-text text-muted">
                        <i class="fas fa-info-circle"></i> Age must be between 16 and 99
                      </div>
                      <div v-if="errors.age" class="validation-error">{{ errors.age }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label">Preferred Language</label>
                      <select class="form-select" v-model="registration.language">
                        <option value="English">English</option>
                        <option value="Mandarin">Mandarin</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Vietnamese">Vietnamese</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Italian">Italian</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Interested Programs (Select all that apply)</label>
                  <div class="row">
                    <div class="col-md-6" v-for="program in availablePrograms.slice(0, 6)" :key="program.id">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :value="program.name"
                          v-model="registration.interestedPrograms"
                          :id="'program-' + program.id"
                        >
                        <label class="form-check-label" :for="'program-' + program.id">
                          {{ program.name }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Emergency Contact Name *</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="registration.emergencyContact"
                    :class="getValidationClass('emergencyContact')"
                    @blur="validateField('emergencyContact')"
                    placeholder="Enter emergency contact name"
                  >
                  <div class="form-text text-muted">
                    <i class="fas fa-info-circle"></i> Must be at least 2 characters long
                  </div>
                  <div v-if="errors.emergencyContact" class="validation-error">{{ errors.emergencyContact }}</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    class="form-control"
                    v-model="registration.emergencyPhone"
                    :class="getValidationClass('emergencyPhone')"
                    @blur="validateField('emergencyPhone')"
                    placeholder="04XX XXX XXX"
                  >
                  <div class="form-text text-muted">
                    <i class="fas fa-info-circle"></i> Please enter a valid Australian mobile number (04XX XXX XXX)
                  </div>
                  <div v-if="errors.emergencyPhone" class="validation-error">{{ errors.emergencyPhone }}</div>
                </div>

                <div class="mb-4">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="registration.agreeTerms"
                      id="agreeTerms"
                      :class="{ 'is-invalid': errors.agreeTerms }"
                      @change="validateField('agreeTerms')"
                    >
                    <label class="form-check-label" for="agreeTerms">
                      I agree to the <a href="#" class="text-primary">Terms and Conditions</a>
                      and <a href="#" class="text-primary">Privacy Policy</a> *
                    </label>
                    <div v-if="errors.agreeTerms" class="validation-error">{{ errors.agreeTerms }}</div>
                  </div>
                </div>

                <div class="d-grid gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    :disabled="isSubmitting"
                  >
                    <span v-if="isSubmitting">
                      <div class="loading-spinner me-2"></div>
                      Processing...
                    </span>
                    <span v-else>
                      <i class="fas fa-user-check"></i> Complete Registration
                    </span>
                  </button>
                </div>
              </form>

              <!-- Success Message -->
              <div v-if="showSuccessMessage" class="alert alert-success mt-4">
                <i class="fas fa-check-circle"></i>
                <strong>Registration Successful!</strong> Welcome to our community.
                <br>
                <small class="text-muted">
                  <i class="fas fa-database"></i> Your registration data has been saved to Firebase database
                </small>
              </div>

              <!-- Login Link -->
              <div class="text-center mt-4">
                <p class="text-muted">
                  Already have an account?
                  <router-link to="/login" class="text-primary text-decoration-none">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                  </router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <script>
  import { ref, reactive, onMounted } from 'vue'
  import { validateEmail, validatePhone, validateName, validateAge, validatePassword, validateConfirmPassword } from '../utils/validation.js'
  import { registerUser } from '../utils/auth.js'
  import { escapeHtml, securityLog } from '../utils/security.js'
  import { saveUserRegistrationToFirebase, saveUserProfileToFirebase, getAllPrograms } from '../services/userService.js'


  export default {
    name: 'RegisterPage',
    setup() {
      const isSubmitting = ref(false)
      const showSuccessMessage = ref(false)
      const availablePrograms = ref([])

      // Load programs from Firebase
      const loadPrograms = async () => {
        try {
          const result = await getAllPrograms()
          if (result.success) {
            availablePrograms.value = result.data
          }
        } catch (error) {
          console.error('Error loading programs from Firebase:', error)
        }
      }

      onMounted(() => {
        loadPrograms()
      })

      // BR (B.1): Form data structure for dynamic binding
      const registration = reactive({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        age: '',
        language: 'English',
        interestedPrograms: [],
        emergencyContact: '',
        emergencyPhone: '',
        agreeTerms: false
      })

      const errors = reactive({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        age: '',
        emergencyContact: '',
        emergencyPhone: '',
        agreeTerms: ''
      })

            // BR (B.1): Two different types of validation
      const validateField = (fieldName) => {
        switch (fieldName) {
          case 'firstName':
          case 'lastName':
          case 'emergencyContact':
            errors[fieldName] = validateName(registration[fieldName])
            break

          case 'email':
            errors.email = validateEmail(registration.email)
            break

          case 'phone':
          case 'emergencyPhone':
            errors[fieldName] = validatePhone(registration[fieldName])
            break

          case 'password':
            errors.password = validatePassword(registration.password)
            break

          case 'confirmPassword':
            errors.confirmPassword = validateConfirmPassword(registration.confirmPassword, registration.password)
            break

          case 'age':
            errors.age = validateAge(registration.age)
            break

          case 'agreeTerms':
            errors.agreeTerms = registration.agreeTerms ? '' : 'You must agree to the terms and conditions'
            break
        }
      }

      const getValidationClass = (fieldName) => {
        if (errors[fieldName]) return 'is-invalid'
        if (registration[fieldName] && !errors[fieldName]) return 'is-valid'
        return ''
      }

            const validateForm = () => {
        const fieldsToValidate = [
          'firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'age',
          'emergencyContact', 'emergencyPhone', 'agreeTerms'
        ]

        fieldsToValidate.forEach(field => validateField(field))
        return fieldsToValidate.every(field => !errors[field])
      }

      // localStorage functions removed - now using Firebase only

      const submitRegistration = async () => {
        if (!validateForm()) {
          return
        }

        isSubmitting.value = true

        try {
          // BR (B.2): Update dynamic data after registration
          const registrationData = {
            ...registration,
            registrationDate: new Date().toISOString(),
            id: Date.now()
          }

          // Create Firebase auth account
          const registerResult = await registerUser({
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            password: registration.password,
            role: 'user'
          })

          if (!registerResult.ok) {
            securityLog('error', 'Registration failed', {
              email: registration.email,
              reason: registerResult.message
            })
            throw new Error(registerResult.message)
          }

          const firebaseUserId = registerResult.firebaseUser.uid

          // Save user basic information to Firebase database
          const profileResult = await saveUserProfileToFirebase({
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            phone: registration.phone,
            age: registration.age,
            language: registration.language,
            role: 'user'
          }, firebaseUserId)

          if (!profileResult.success) {
            securityLog('warning', 'Failed to save user profile to Firebase', {
              userId: firebaseUserId,
              error: profileResult.message
            })
          }

          // Save complete registration data to Firebase database
          const registrationResult = await saveUserRegistrationToFirebase(registrationData, firebaseUserId)

          if (!registrationResult.success) {
            securityLog('warning', 'Failed to save registration data to Firebase', {
              userId: firebaseUserId,
              error: registrationResult.message
            })
          }

          // Update participant counts for selected programs (in memory only)
          registration.interestedPrograms.forEach(programName => {
            const program = availablePrograms.value.find(p => p.name === programName)
            if (program) {
              program.participants += 1
            }
          })

          // Note: Stats and registration data are now stored in Firebase only

          // Reset form
          Object.keys(registration).forEach(key => {
            if (Array.isArray(registration[key])) {
              registration[key] = []
            } else if (typeof registration[key] === 'boolean') {
              registration[key] = false
            } else {
              registration[key] = ''
            }
          })
          registration.language = 'English'

          // Clear errors
          Object.keys(errors).forEach(key => {
            errors[key] = ''
          })

          isSubmitting.value = false
          showSuccessMessage.value = true

          securityLog('info', 'Registration completed successfully', {
            userId: firebaseUserId,
            email: registration.email,
            firebaseProfileSaved: profileResult.success,
            firebaseRegistrationSaved: registrationResult.success
          })

          console.log('Registration completed successfully!')
          console.log('Data saved to Firebase:')
          console.log('- Firebase Authentication:', firebaseUserId)
          console.log('- Firebase Firestore User Profile:', profileResult.success ? '[OK]' : '[FAIL]')
          console.log('- Firebase Firestore Registration Data:', registrationResult.success ? '[OK]' : '[FAIL]')

          // Hide success message after 5 seconds
          setTimeout(() => {
            showSuccessMessage.value = false
          }, 5000)

        } catch (error) {
          isSubmitting.value = false
          securityLog('error', 'Registration process failed', {
            email: registration.email,
            error: error.message
          })

          // Display error message to user
          alert('Registration failed: ' + error.message)
          console.error('Registration failed:', error)
        }
      }

      return {
        registration,
        errors,
        availablePrograms,
        isSubmitting,
        showSuccessMessage,
        validateField,
        getValidationClass,
        submitRegistration
      }
    }
  }
  </script>
