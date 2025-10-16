<!-- Email Test Component -->
<template>
  <div class="email-test-container">
    <h3>Email Service Test</h3>
    <div class="test-form">
      <div class="form-group">
        <label for="testEmail">Test Email:</label>
        <input 
          id="testEmail" 
          v-model="testEmail" 
          type="email" 
          placeholder="Enter email to test"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label for="testSubject">Subject:</label>
        <input 
          id="testSubject" 
          v-model="testSubject" 
          type="text" 
          placeholder="Email subject"
          class="form-control"
        />
      </div>
      <div class="form-group">
        <label for="testMessage">Message:</label>
        <textarea 
          id="testMessage" 
          v-model="testMessage" 
          placeholder="Email message"
          class="form-control"
          rows="4"
        ></textarea>
      </div>
      <button @click="sendTestEmail" :disabled="isLoading" class="btn btn-primary">
        {{ isLoading ? 'Sending...' : 'Send Test Email' }}
      </button>
    </div>
    
    <div v-if="result" class="result-message" :class="result.success ? 'success' : 'error'">
      {{ result.message }}
    </div>
  </div>
</template>

<script>
import { sendEmail } from '../services/emailService.js'

export default {
  name: 'EmailTest',
  data() {
    return {
      testEmail: '',
      testSubject: 'Test Email from Fitness Center',
      testMessage: 'This is a test email to verify the email service is working correctly.',
      isLoading: false,
      result: null
    }
  },
  methods: {
    async sendTestEmail() {
      if (!this.testEmail) {
        this.result = {
          success: false,
          message: 'Please enter an email address'
        }
        return
      }

      this.isLoading = true
      this.result = null

      try {
        const emailData = {
          to: this.testEmail,
          subject: this.testSubject,
          message: this.testMessage
        }

        const result = await sendEmail(emailData)
        this.result = result
      } catch (error) {
        this.result = {
          success: false,
          message: 'Error: ' + error.message
        }
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
.email-test-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.test-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.result-message {
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
}

.result-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
