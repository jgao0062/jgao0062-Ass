<template>
    <nav class="navbar navbar-expand-lg sticky-top">
      <div class="container">
        <router-link to="/" class="navbar-brand">
          <i class="fas fa-heartbeat"></i> Melbourne Community Sports Health
        </router-link>
        <button 
          class="navbar-toggler" 
          type="button" 
          @click="toggleMobileMenu"
          :aria-expanded="showMobileMenu"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="navbar-collapse" :class="{ 'show': showMobileMenu }">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link to="/" class="nav-link" @click="closeMobileMenu">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/programs" class="nav-link" @click="closeMobileMenu">Programs</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/register" class="nav-link" @click="closeMobileMenu">Join Us</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/login" class="nav-link" @click="closeMobileMenu">Login</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </template>
  
  <script>
  import { ref } from 'vue'
  
  export default {
    name: 'Navigation',
    setup() {
      const showMobileMenu = ref(false)
  
      const toggleMobileMenu = () => {
        showMobileMenu.value = !showMobileMenu.value
      }
  
      const closeMobileMenu = () => {
        showMobileMenu.value = false
      }
  
      return {
        showMobileMenu,
        toggleMobileMenu,
        closeMobileMenu
      }
    }
  }
  </script>