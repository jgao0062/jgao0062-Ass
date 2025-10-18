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
import MapPage from './views/MapPage.vue'
import AppointmentPage from './views/AppointmentPage.vue'
import { isLoggedIn, hasRole, onAuthStateChange } from './utils/auth.js'

const routes = [
  { path: '/', component: Home },
  { path: '/programs', component: Programs },
  { path: '/register', component: Register },
  { path: '/login', component: Login },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/my-activities', component: MyActivities, meta: { requiresAuth: true } },
  { path: '/map', component: MapPage, meta: { requiresAuth: true, role: 'user' } },
  { path: '/appointments', component: AppointmentPage, meta: { requiresAuth: true, role: 'user' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guards: auth + role, support redirect back after login
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta && r.meta.requiresAuth)
  const role = to.matched.find(r => r.meta && r.meta.role)?.meta?.role

  if (!requiresAuth) return next()

  console.log(`[ROUTER] Checking access to protected route: ${to.path}`)

  // Wait for Firebase auth state to be initialized
  const { getCurrentFirebaseUser, onAuthStateChange } = await import('./utils/auth.js')

  // Check if Firebase auth is already initialized
  let firebaseUser = getCurrentFirebaseUser()

  if (!firebaseUser) {
    console.log('[ROUTER] No Firebase user found, waiting for auth state...')

    // Wait for Firebase auth state to be initialized
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChange(({ user }) => {
        console.log('[ROUTER] Auth state received:', !!user)
        unsubscribe()

        if (user) {
          // User is authenticated, check role if needed
          if (role) {
            import('./utils/auth.js').then(({ hasRoleAsync }) => {
              hasRoleAsync(role).then((hasRequiredRole) => {
                console.log(`[ROUTER] Role check for ${role}:`, hasRequiredRole)
                if (hasRequiredRole) {
                  console.log(`[SECURITY] User accessing protected route: ${to.path}`)
                  next()
                } else {
                  console.log(`[ROUTER] Access denied - user does not have required role: ${role}`)
                  next('/')
                }
                resolve()
              })
            })
          } else {
            console.log(`[SECURITY] User accessing protected route: ${to.path}`)
            next()
            resolve()
          }
        } else {
          // No user, redirect to login
          console.log('[ROUTER] No authenticated user, redirecting to login')
          next({ path: '/login', query: { redirect: to.fullPath } })
          resolve()
        }
      })

      // Timeout fallback
      setTimeout(() => {
        console.log('[ROUTER] Auth state timeout, redirecting to login')
        next({ path: '/login', query: { redirect: to.fullPath } })
        resolve()
      }, 3000)
    })
  }

  // Firebase user exists, check role if required
  if (role) {
    const { hasRoleAsync } = await import('./utils/auth.js')
    const hasRequiredRole = await hasRoleAsync(role)
    console.log(`[ROUTER] Role check for ${role}:`, hasRequiredRole)
    if (!hasRequiredRole) {
      console.log(`[ROUTER] Access denied - user does not have required role: ${role}`)
      return next('/')
    }
  }

  // Log security access
  console.log(`[SECURITY] User accessing protected route: ${to.path}`)
  return next()
})

// Initialize security settings
initializeSecurity()
initializeAppSecurity()

// Firebase data initialization removed - data already exists in Firebase

// Initialize Firebase authentication state listener BEFORE mounting the app
let authInitialized = false
onAuthStateChange(({ user, session }) => {
  if (user && session) {
    console.log('Firebase auth state: User logged in', session)
    // Trigger login event for components
    window.dispatchEvent(new CustomEvent('userLoggedIn'))
  } else {
    console.log('Firebase auth state: User logged out')
    // Trigger logout event for components
    window.dispatchEvent(new CustomEvent('userLoggedOut'))
  }

  // Mark auth as initialized after first state change
  if (!authInitialized) {
    authInitialized = true
    console.log('Firebase auth state initialized')
  }
})

const app = createApp(App)
app.use(router)

// Mount the app immediately - router guards will handle auth state
app.mount('#app')
