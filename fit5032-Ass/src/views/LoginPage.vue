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
import { login } from '../utils/auth.js'

export default {
  name: 'LoginPage',
  setup() {
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const submitting = ref(false)

    const onSubmit = async () => {
      error.value = ''
      submitting.value = true
      const res = await login(email.value, password.value)
      submitting.value = false
      if (!res.ok) {
        error.value = res.message || 'Login failed'
        return
      }
      // Navigate back or to home
      window.history.length > 1 ? history.back() : (window.location.href = '/')
    }

    return { email, password, error, submitting, onSubmit }
  }
}
</script>


