// Lightweight local auth and security helpers

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

// Sanitize input: remove script tags and escape angle brackets
export function sanitizeInput(value) {
  if (value == null) return ''
  const str = String(value)
  return str
    .replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
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
  const safeEmail = String(email || '').toLowerCase()
  return getAllUsers().find(u => u.email === safeEmail) || null
}

export async function registerUser({ firstName, lastName, email, password, role = 'user' }) {
  const users = getAllUsers()
  const safeEmail = String(email || '').toLowerCase()
  if (users.some(u => u.email === safeEmail)) {
    return { ok: false, message: 'Email already registered' }
  }
  const hashed = await hashString(password || '')
  const user = {
    id: Date.now(),
    firstName: sanitizeInput(firstName),
    lastName: sanitizeInput(lastName),
    email: safeEmail,
    passwordHash: hashed,
    role
  }
  users.push(user)
  writeJSON(USERS_KEY, users)
  return { ok: true, user }
}

export async function login(email, password) {
  const user = findUserByEmail(email)
  if (!user) return { ok: false, message: 'Invalid credentials' }
  const hashed = await hashString(password || '')
  if (user.passwordHash !== hashed) return { ok: false, message: 'Invalid credentials' }
  const session = { userId: user.id, role: user.role, email: user.email, firstName: user.firstName, ts: Date.now() }
  writeJSON(SESSION_KEY, session)
  return { ok: true, session }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  return readJSON(SESSION_KEY, null)
}

export function isLoggedIn() {
  return !!getSession()
}

export function hasRole(requiredRole) {
  const session = getSession()
  if (!session) return false
  if (!requiredRole) return true
  return session.role === requiredRole
}

// Seed an admin user for demo if none exists
export async function ensureDefaultAdmin() {
  const users = getAllUsers()
  const hasAdmin = users.some(u => u.role === 'admin')
  if (hasAdmin) return
  const email = 'admin@example.com'
  if (!users.some(u => u.email === email)) {
    await registerUser({ firstName: 'Admin', lastName: 'User', email, password: 'Admin1234', role: 'admin' })
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
  list.push({ userId, value: Math.max(1, Math.min(5, Number(value))) })
  all[programId] = list
  writeJSON(RATINGS_KEY, all)
}


