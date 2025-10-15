<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow">
          <div class="card-body p-4">
            <h3 class="mb-3 text-center">Sign In</h3>

            <form @submit.prevent="onSubmit">
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" v-model="email" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" v-model="password" required>
              </div>

              <div class="d-grid">
                <button class="btn btn-primary" type="submit" :disabled="submitting">
                  <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                  Login
                </button>
              </div>

              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../utils/auth.js'
import { escapeHtml, securityLog } from '../utils/security.js'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const submitting = ref(false)

    const onSubmit = async () => {
      error.value = ''
      submitting.value = true

      try {
        console.log('Attempting login with:', email.value) // Debug log
        const res = await login(email.value, password.value)
        submitting.value = false

        console.log('Login result:', res) // Debug log

        if (!res.ok) {
          // Escape error message to prevent XSS
          error.value = escapeHtml(res.message || 'Login failed')
          securityLog('warning', 'Login failed', { email: email.value, reason: res.message })
          return
        }

        securityLog('info', 'User login successful', { email: email.value })
        console.log('Login successful, session:', res.session) // Debug log

        // Trigger login event for other components
        window.dispatchEvent(new CustomEvent('userLoggedIn'))

        // Redirect to intended page or home using Vue Router
        const redirect = route.query.redirect || '/'
        
        // Validate redirect URL security
        if (redirect.startsWith('/')) {
          router.push(redirect)
        } else {
          router.push('/')
        }
      } catch (err) {
        submitting.value = false
        error.value = 'An unexpected error occurred. Please try again.'
        console.error('Login error:', err) // Debug log
        securityLog('error', 'Login error', { email: email.value, error: err.message })
      }
    }

    return { email, password, error, submitting, onSubmit }
  }
}
</script>


