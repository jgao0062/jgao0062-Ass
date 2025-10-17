<template>
  <div id="app">
    <Navigation />
    <router-view />
    <ChatbotComponent />
  </div>
</template>

<script>
import Navigation from './components/NavigationComponent.vue'
import ChatbotComponent from './components/ChatbotComponent.vue'

export default {
  name: 'App',
  components: {
    Navigation,
    ChatbotComponent
  },
  setup() {
    return {}
  }
}
</script>
