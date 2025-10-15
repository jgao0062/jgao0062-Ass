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

// Storage keys
const USERS_KEY = 'auth_users'
const SESSION_KEY = 'auth_session'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getAllUsers() {
  return readJSON(USERS_KEY, [])
}

export function findUserByEmail(email) {
  const safeEmail = sanitizeEmail(email)
  if (!safeEmail) {
    securityLog('warning', 'Invalid email format attempted', { email })
    return null
  }
  return getAllUsers().find(u => u.email === safeEmail) || null
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

    // Store additional user data in localStorage for local features
    const userData = {
      id: user.uid,
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      email: safeEmail,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }

    // Save user data locally for compatibility with existing features
    const users = getAllUsers()
    users.push(userData)
    writeJSON(USERS_KEY, users)

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

    // Get user data from local storage
    const localUser = findUserByEmail(safeEmail)

    if (localUser) {
      // Update last login time
      const users = getAllUsers()
      const userIndex = users.findIndex(u => u.id === localUser.id)
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString()
        writeJSON(USERS_KEY, users)
      }
    }

    const session = {
      userId: user.uid,
      role: localUser?.role || 'user',
      email: user.email,
      firstName: localUser?.firstName || '',
      lastName: localUser?.lastName || '',
      ts: Date.now(),
      csrfToken: generateCSRFToken()
    }
    writeJSON(SESSION_KEY, session)

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
  const session = getSession()
  if (session) {
    securityLog('info', 'User logged out', { userId: session.userId, email: session.email })
  }

  try {
    // Sign out from Firebase
    await signOut(auth)
  } catch (error) {
    securityLog('warning', 'Firebase logout error', { error: error.message })
  }

  // Clear local session
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  return readJSON(SESSION_KEY, null)
}

export function isLoggedIn() {
  return !!getSession()
}

// Firebase Authentication state listener
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      const localUser = findUserByEmail(user.email)
      const session = {
        userId: user.uid,
        role: localUser?.role || 'user',
        email: user.email,
        firstName: localUser?.firstName || '',
        lastName: localUser?.lastName || '',
        ts: Date.now(),
        csrfToken: generateCSRFToken()
      }
      writeJSON(SESSION_KEY, session)
      callback({ user, session })
    } else {
      // User is signed out
      localStorage.removeItem(SESSION_KEY)
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
  if (!session) return false
  if (!requiredRole) return true
  return session.role === requiredRole
}

export function deleteUser(userId) {
  const users = getAllUsers()
  const filteredUsers = users.filter(u => u.id !== userId)
  writeJSON(USERS_KEY, filteredUsers)
  return { ok: true, message: 'User deleted successfully' }
}

// Update existing admin email and password
export async function updateAdminCredentials() {
  const users = getAllUsers()
  const adminIndex = users.findIndex(u => u.role === 'admin')
  if (adminIndex !== -1) {
    const newEmail = 'admin@gmail.com'
    const newPasswordHash = await hashString('Admin1234')
    users[adminIndex] = {
      ...users[adminIndex],
      email: newEmail,
      passwordHash: newPasswordHash
    }
    writeJSON(USERS_KEY, users)
  }
}

// Seed an admin user for demo if none exists
export async function ensureDefaultAdmin() {
  const users = getAllUsers()
  const hasAdmin = users.some(u => u.role === 'admin')

  if (hasAdmin) {
    // Update existing admin credentials
    await updateAdminCredentials()
    return
  }

  const email = 'admin@gmail.com'
  const password = 'Admin1234'

  // Check if admin already exists in Firebase
  try {
    await signInWithEmailAndPassword(auth, email, password)
    // If login succeeds, admin exists in Firebase
    securityLog('info', 'Admin user already exists in Firebase')
    return
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Admin doesn't exist in Firebase, create it
      try {
        await registerUser({
          firstName: 'Admin',
          lastName: 'User',
          email,
          password,
          role: 'admin'
        })
        securityLog('info', 'Default admin user created in Firebase')
      } catch (regError) {
        securityLog('error', 'Failed to create default admin', { error: regError.message })
      }
    } else {
      securityLog('warning', 'Error checking admin user', { error: error.message })
    }
  }
}

// Ratings storage: prevent double rating per (programId + userId)
const RATINGS_KEY = 'program_ratings'

export function getRatings() {
  return readJSON(RATINGS_KEY, {})
}

export function getProgramAverageRating(programId) {
  const all = getRatings()
  const list = all[programId] || []
  if (list.length === 0) return { average: 0, count: 0 }
  const sum = list.reduce((s, r) => s + r.value, 0)
  return { average: Math.round((sum / list.length) * 10) / 10, count: list.length }
}

export function userHasRated(programId, userId) {
  const all = getRatings()
  const list = all[programId] || []
  return list.some(r => r.userId === userId)
}

export function addRating(programId, userId, value) {
  const all = getRatings()
  const list = all[programId] || []

  // Check if user has already rated this program
  const existingRatingIndex = list.findIndex(r => r.userId === userId)

  if (existingRatingIndex !== -1) {
    // Update existing rating
    list[existingRatingIndex] = { userId, value: Math.max(1, Math.min(5, Number(value))) }
  } else {
    // Add new rating
    list.push({ userId, value: Math.max(1, Math.min(5, Number(value))) })
  }

  all[programId] = list
  writeJSON(RATINGS_KEY, all)
}

// User Activities Management
const USER_ACTIVITIES_KEY = 'user_activities'

export function getUserActivities(userId) {
  const allActivities = readJSON(USER_ACTIVITIES_KEY, {})
  return allActivities[userId] || []
}

export function addUserActivity(userId, programId, programName) {
  const allActivities = readJSON(USER_ACTIVITIES_KEY, {})
  const userActivities = allActivities[userId] || []

  // Check if user already joined this program
  const existingActivity = userActivities.find(activity => activity.programId === programId)

  if (!existingActivity) {
    const newActivity = {
      programId,
      programName,
      joinedDate: new Date().toISOString(),
      status: 'upcoming'
    }

    userActivities.push(newActivity)
    allActivities[userId] = userActivities
    writeJSON(USER_ACTIVITIES_KEY, allActivities)

    securityLog('info', 'User joined program', {
      userId,
      programId,
      programName
    })

    return { success: true, message: `Successfully joined ${programName}!` }
  } else {
    return { success: false, message: 'You have already joined this program' }
  }
}

export function removeUserActivity(userId, programId) {
  const allActivities = readJSON(USER_ACTIVITIES_KEY, {})
  const userActivities = allActivities[userId] || []

  const activityIndex = userActivities.findIndex(activity => activity.programId === programId)

  if (activityIndex !== -1) {
    const removedActivity = userActivities.splice(activityIndex, 1)[0]
    allActivities[userId] = userActivities
    writeJSON(USER_ACTIVITIES_KEY, allActivities)

    securityLog('info', 'User left program', {
      userId,
      programId,
      programName: removedActivity.programName
    })

    return { success: true, message: `Left ${removedActivity.programName}` }
  } else {
    return { success: false, message: 'Activity not found' }
  }
}

export function hasUserJoinedProgram(userId, programId) {
  const userActivities = getUserActivities(userId)
  return userActivities.some(activity => activity.programId === programId)
}


