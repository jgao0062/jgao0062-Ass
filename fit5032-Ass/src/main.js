import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.min.css'

// Import custom styles
import './assets/styles/main.css'

// Import security modules
import { initializeAppSecurity } from './utils/securityMiddleware.js'
import { initializeSecurity } from './utils/security.js'

// Import views
import Home from './views/HomePage.vue'
import Programs from './views/ProgramsPage.vue'
import Register from './views/RegisterPage.vue'
import Login from './views/LoginPage.vue'
import Admin from './views/AdminPage.vue'
import MyActivities from './views/MyActivitiesPage.vue'
import { isLoggedIn, hasRole, ensureDefaultAdmin } from './utils/auth.js'

const routes = [
  { path: '/', component: Home },
  { path: '/programs', component: Programs },
  { path: '/register', component: Register },
  { path: '/login', component: Login },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/my-activities', component: MyActivities, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guards: auth + role, support redirect back after login
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta && r.meta.requiresAuth)
  const role = to.matched.find(r => r.meta && r.meta.role)?.meta?.role

  if (!requiresAuth) return next()
  if (!isLoggedIn()) return next({ path: '/login', query: { redirect: to.fullPath } })
  if (role && !hasRole(role)) return next('/')

  // Log security access
  console.log(`[SECURITY] User accessing protected route: ${to.path}`)
  return next()
})

// Initialize security settings
initializeSecurity()
initializeAppSecurity()

ensureDefaultAdmin()
const app = createApp(App)
app.use(router)
app.mount('#app')
