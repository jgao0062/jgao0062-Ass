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
            <li class="nav-item" v-if="!session">
              <router-link to="/login" class="nav-link" @click="closeMobileMenu">Login</router-link>
            </li>
            <li class="nav-item dropdown" v-else>
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {{ session.firstName || session.email }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><router-link to="/admin" class="dropdown-item" v-if="session && session.role==='admin'">Admin</router-link></li>
                <li><button class="dropdown-item" @click="onLogout">Logout</button></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </template>

  <script>
  import { ref } from 'vue'
  import { getSession, logout } from '../utils/auth.js'

  export default {
    name: 'NavigationComponent',
    setup() {
      const showMobileMenu = ref(false)
      const session = ref(getSession())

      const toggleMobileMenu = () => {
        showMobileMenu.value = !showMobileMenu.value
      }

      const closeMobileMenu = () => {
        showMobileMenu.value = false
      }

      const onLogout = () => {
        logout()
        session.value = null
        closeMobileMenu()
        window.location.href = '/'
      }

      return {
        showMobileMenu,
        toggleMobileMenu,
        closeMobileMenu,
        session,
        onLogout
      }
    }
  }
  </script>
