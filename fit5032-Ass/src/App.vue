<template>
  <div id="app">
    <Navigation />
    <router-view />
  </div>
</template>

<script>
import Navigation from './components/NavigationComponent.vue'

export default {
  name: 'App',
  components: {
    Navigation
  },
  setup() {
    return {}
  }
}
</script>