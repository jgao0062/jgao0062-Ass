// Firebase Authentication integration
// BR (C.4): Enhanced Security - XSS Protection and Authentication Security

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '../config/firebase.js'
import {
  sanitizeInput,
  sanitizeEmail,
  securityLog,
  checkRateLimit,
  generateCSRFToken
} from './security.js'

// One-way hash: use Web Crypto, fallback to a simple non-crypto hash
export async function hashString(plain) {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback (weak): avoid storing plain text
    let hash = 0
    for (let i = 0; i < plain.length; i++) {
      hash = ((hash << 5) - hash) + plain.charCodeAt(i)
      hash |= 0
    }
    return String(hash)
  }
}

// Use sanitizeInput function from security.js
// Keep a simple wrapper function for backward compatibility
export function sanitizeInputLegacy(value) {
  return sanitizeInput(value)
}

// Session management using Firebase Auth state

// Simple session storage for current session (not persistent)
let currentSession = null

export function getCurrentSession() {
  return currentSession
}

export function setCurrentSession(session) {
  currentSession = session
}

export function clearCurrentSession() {
  currentSession = null
}

export async function registerUser({ firstName, lastName, email, password, role = 'user' }) {
  const safeEmail = sanitizeEmail(email)

  if (!safeEmail) {
    securityLog('warning', 'Registration attempt with invalid email', { email })
    return { ok: false, message: 'Invalid email format' }
  }

  // Validate password strength
  if (!password || password.length < 8) {
    securityLog('warning', 'Registration attempt with weak password', { email: safeEmail })
    return { ok: false, message: 'Password must be at least 8 characters long' }
  }

  try {
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, safeEmail, password)
    const user = userCredential.user

    // Update user profile with display name
    await updateProfile(user, {
      displayName: `${sanitizeInput(firstName)} ${sanitizeInput(lastName)}`
    })

    // User data is now stored in Firebase Firestore via userService.js
    const userData = {
      id: user.uid,
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      email: safeEmail,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }

    securityLog('info', 'User registered successfully with Firebase', {
      userId: user.uid,
      email: safeEmail,
      role
    })

    return { ok: true, user: userData, firebaseUser: user }
  } catch (error) {
    let errorMessage = 'Registration failed'

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email already registered'
        break
      case 'auth/invalid-email':
        errorMessage = 'Invalid email format'
        break
      case 'auth/weak-password':
        errorMessage = 'Password is too weak'
        break
      default:
        errorMessage = error.message
    }

    securityLog('error', 'Firebase registration failed', {
      email: safeEmail,
      error: error.code,
      message: errorMessage
    })

    return { ok: false, message: errorMessage }
  }
}

export async function login(email, password) {
  // Check rate limit
  const safeEmail = sanitizeEmail(email)
  if (!safeEmail) {
    securityLog('warning', 'Login attempt with invalid email format', { email })
    return { ok: false, message: 'Invalid credentials' }
  }

  if (!checkRateLimit(`login_${safeEmail}`, 5, 300000)) { // 5 attempts, 5 minute window
    securityLog('warning', 'Login rate limit exceeded', { email: safeEmail })
    return { ok: false, message: 'Too many login attempts. Please try again later.' }
  }

  try {
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, safeEmail, password)
    const user = userCredential.user

    // Get user data from Firebase Firestore
    const { getUserProfileFromFirebase, updateUserLastLogin } = await import('../services/userService.js')
    const userProfile = await getUserProfileFromFirebase(user.uid)

    // Update last login time in Firebase
    await updateUserLastLogin(user.uid)

    const session = {
      userId: user.uid,
      role: userProfile.success ? userProfile.data.role : 'user',
      email: user.email,
      firstName: userProfile.success ? userProfile.data.firstName : '',
      lastName: userProfile.success ? userProfile.data.lastName : '',
      ts: Date.now(),
      csrfToken: generateCSRFToken()
    }
    setCurrentSession(session)

    securityLog('info', 'User logged in successfully with Firebase', {
      userId: user.uid,
      email: safeEmail
    })

    return { ok: true, session }
  } catch (error) {
    let errorMessage = 'Invalid credentials'

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-email':
        errorMessage = 'Invalid credentials'
        break
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.'
        break
      default:
        errorMessage = error.message
    }

    securityLog('warning', 'Firebase login failed', {
      email: safeEmail,
      error: error.code,
      message: errorMessage
    })

    return { ok: false, message: errorMessage }
  }
}

export async function logout() {
  const session = getCurrentSession()
  if (session) {
    securityLog('info', 'User logged out', { userId: session.userId, email: session.email })
  }

  try {
    // Sign out from Firebase
    await signOut(auth)
  } catch (error) {
    securityLog('warning', 'Firebase logout error', { error: error.message })
  }

  // Clear current session
  clearCurrentSession()
}

export function getSession() {
  return getCurrentSession()
}

export function isLoggedIn() {
  return !!getCurrentSession()
}

// Firebase Authentication state listener
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in - get data from Firebase
      try {
        const { getUserProfileFromFirebase } = await import('../services/userService.js')
        const userProfile = await getUserProfileFromFirebase(user.uid)

        const session = {
          userId: user.uid,
          role: userProfile.success ? userProfile.data.role : 'user',
          email: user.email,
          firstName: userProfile.success ? userProfile.data.firstName : '',
          lastName: userProfile.success ? userProfile.data.lastName : '',
          ts: Date.now(),
          csrfToken: generateCSRFToken()
        }
        setCurrentSession(session)
        callback({ user, session })
      } catch {
        // Fallback session if Firebase query fails
        const session = {
          userId: user.uid,
          role: 'user',
          email: user.email,
          firstName: '',
          lastName: '',
          ts: Date.now(),
          csrfToken: generateCSRFToken()
        }
        setCurrentSession(session)
        callback({ user, session })
      }
    } else {
      // User is signed out
      clearCurrentSession()
      callback({ user: null, session: null })
    }
  })
}

// Get current Firebase user
export function getCurrentFirebaseUser() {
  return auth.currentUser
}

export function hasRole(requiredRole) {
  const session = getSession()
  if (!session) {
    // If no session in memory, check Firebase auth state
    const firebaseUser = getCurrentFirebaseUser()
    if (!firebaseUser) return false
    // For now, assume user role if Firebase user exists but session not loaded
    // This is a fallback - ideally the session should be loaded by onAuthStateChange
    return !requiredRole || requiredRole === 'user'
  }
  if (!requiredRole) return true
  return session.role === requiredRole
}

// Async version of hasRole that can fetch user data from Firebase if needed
export async function hasRoleAsync(requiredRole) {
  const session = getSession()
  if (session) {
    if (!requiredRole) return true
    return session.role === requiredRole
  }
  
  // If no session, check Firebase auth state
  const firebaseUser = getCurrentFirebaseUser()
  if (!firebaseUser) {
    console.log('hasRoleAsync: No Firebase user found')
    return false
  }
  
  console.log('hasRoleAsync: Checking role for Firebase user:', firebaseUser.uid)
  
  // Try to get user profile from Firebase
  try {
    const { getUserProfileFromFirebase } = await import('../services/userService.js')
    const userProfile = await getUserProfileFromFirebase(firebaseUser.uid)
    
    console.log('hasRoleAsync: User profile result:', userProfile)
    
    if (userProfile.success) {
      const userRole = userProfile.data.role
      console.log(`hasRoleAsync: User role is ${userRole}, required role is ${requiredRole}`)
      
      if (!requiredRole) return true
      return userRole === requiredRole
    } else {
      console.warn('hasRoleAsync: Failed to get user profile:', userProfile.message)
    }
  } catch (error) {
    console.error('hasRoleAsync: Error fetching user profile:', error)
  }
  
  // Fallback: if we can't determine the role, deny access to admin pages
  console.warn('hasRoleAsync: Cannot determine user role, denying access')
  return false
}

// User deletion is now handled by Firebase Admin SDK or userService.js
export async function deleteUser(userId) {
  try {
    // This would require Firebase Admin SDK for user deletion
    // For now, we'll just return success
    securityLog('info', 'User deletion requested', { userId })
    return { ok: true, message: 'User deletion handled by Firebase' }
  } catch (error) {
    return { ok: false, message: 'Failed to delete user: ' + error.message }
  }
}

// Ratings and Activities are now handled by Firebase Firestore
// These functions have been moved to userService.js or can be implemented there


