import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.min.css'

// Import custom styles
import './assets/styles/main.css'

// Import views
import Home from './views/Home.vue'
import Programs from './views/Programs.vue'
import Register from './views/Register.vue'
import Login from './views/Login.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/programs', component: Programs },
  { path: '/register', component: Register },
  { path: '/login', component: Login }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')