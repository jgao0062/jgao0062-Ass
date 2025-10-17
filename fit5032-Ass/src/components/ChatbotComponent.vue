<!-- eslint-disable -->
<template>
  <div class="chatbot-container">
    <!-- Chatbot Toggle Button -->
    <button
      class="chatbot-toggle-btn"
      @click="toggleChat"
      :class="{ 'active': isOpen }"
    >
      <i class="fas fa-robot" v-if="!isOpen"></i>
      <i class="fas fa-times" v-else></i>
    </button>

    <!-- Chatbot Window -->
    <div class="chatbot-window" v-if="isOpen" :class="{ 'chatbot-open': isOpen }">
      <div class="chatbot-header">
        <h5 class="mb-0">
          <i class="fas fa-robot me-2"></i>
          Melbourne Community Sports AI Assistant
        </h5>
        <button class="btn-close" @click="closeChat">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="chatbot-messages" ref="messagesContainer">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="{
            'user-message': message.type === 'user',
            'bot-message': message.type === 'bot',
            'message-enter': true
          }"
        >
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="message bot-message">
          <div class="message-content">
            <div class="message-text">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chatbot-input">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            v-model="inputMessage"
            @keyup.enter="sendMessage"
            placeholder="Type your question..."
            :disabled="isLoading"
          >
          <button
            class="btn btn-primary"
            @click="sendMessage"
            :disabled="isLoading || !inputMessage.trim()"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatbotComponent',
  data() {
    return {
      isOpen: false,
      inputMessage: '',
      messages: [
        {
          type: 'bot',
          text: 'Hello! I am your AI assistant from Melbourne Community Sports. How can I help you today?',
          timestamp: new Date()
        }
      ],
      isLoading: false,
      apiKey: 'AIzaSyAAVZzym1GsyW7AkXt2mlS-h6Or-xzcoxY'
    }
  },
  methods: {
    toggleChat() {
      this.isOpen = !this.isOpen
      if (this.isOpen) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    closeChat() {
      this.isOpen = false
    },

    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) return

      const userMessage = this.inputMessage.trim()
      this.inputMessage = ''

      // Add user message
      this.messages.push({
        type: 'user',
        text: userMessage,
        timestamp: new Date()
      })

      this.isLoading = true
      this.scrollToBottom()

      try {
        const response = await this.callGeminiAPI(userMessage)
        this.messages.push({
          type: 'bot',
          text: response,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error calling Gemini API:', error)
        this.messages.push({
          type: 'bot',
          text: 'Sorry, I am unable to answer your question right now. Please try again later.',
          timestamp: new Date()
        })
      } finally {
        this.isLoading = false
        this.scrollToBottom()
      }
    },

    async callGeminiAPI(message) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`

      const requestBody = {
        contents: [{
          parts: [{
            text: message
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('Invalid response format')
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },

    formatTime(timestamp) {
      return timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chatbot-toggle-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3), 0 0 0 10px rgba(99, 102, 241, 0.1);
  }
  100% {
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }
}

.chatbot-toggle-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  animation: none;
}

.chatbot-toggle-btn.active {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.chatbot-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 520px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 20px 40px var(--shadow-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
  position: relative;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatbot-window.chatbot-open {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.chatbot-window::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.02)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
  z-index: 0;
}

.chatbot-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chatbot-header h5 {
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.chatbot-messages {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
  background: transparent;
  position: relative;
  z-index: 1;
}

.message {
  margin-bottom: 18px;
  display: flex;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  justify-content: flex-end;
}

.bot-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 85%;
  padding: 14px 18px;
  border-radius: 20px;
  position: relative;
  backdrop-filter: blur(10px);
}

.user-message .message-content {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-bottom-right-radius: 8px;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bot-message .message-content {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-bottom-left-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-light);
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  font-weight: 400;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 6px;
  font-weight: 400;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chatbot-input {
  padding: 25px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  position: relative;
  z-index: 1;
}

.input-group {
  display: flex;
  gap: 12px;
}

.form-control {
  flex: 1;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 25px;
  padding: 12px 18px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-control:focus {
  background-color: var(--bg-input);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25);
  color: var(--text-primary);
}

.form-control::placeholder {
  color: var(--text-muted);
}

.btn {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border: none;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Scrollbar styles */
.chatbot-messages::-webkit-scrollbar {
  width: 6px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* Responsive design */
@media (max-width: 768px) {
  .chatbot-window {
    width: 320px;
    height: 450px;
  }

  .chatbot-container {
    bottom: 15px;
    right: 15px;
  }

  .chatbot-toggle-btn {
    width: 55px;
    height: 55px;
    font-size: 22px;
  }

  .chatbot-messages {
    padding: 20px;
  }

  .chatbot-input {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .chatbot-window {
    width: calc(100vw - 30px);
    height: 400px;
    right: -10px;
  }

  .chatbot-container {
    bottom: 10px;
    right: 10px;
  }
}
</style>
