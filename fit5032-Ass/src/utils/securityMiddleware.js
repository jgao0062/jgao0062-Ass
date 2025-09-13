// BR (C.4): Security - Simplified HTTP Security Headers and CSP Implementation
// Basic security middleware for client-side applications

/**
 * Set basic security-related meta tags
 */
export function setSecurityHeaders() {
  if (typeof document === 'undefined') return

  // Set basic security meta tags
  const securityMetas = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
  ]

  securityMetas.forEach(meta => {
    if (!document.querySelector(`meta[name="${meta.name}"]`)) {
      const metaElement = document.createElement('meta')
      metaElement.name = meta.name
      metaElement.content = meta.content
      document.head.appendChild(metaElement)
    }
  })
}

/**
 * Initialize basic application security settings
 */
export function initializeAppSecurity() {
  // Set security headers
  setSecurityHeaders()

  // Basic XSS monitoring
  const originalConsoleLog = console.log
  console.log = function(...args) {
    const message = args.join(' ')
    if (message.includes('<script') || message.includes('javascript:')) {
      console.warn('Potential XSS attempt detected:', message)
    }
    originalConsoleLog.apply(console, args)
  }
}

/**
 * Validate URL redirects (simplified)
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is safe
 */
export function validateRedirectUrl(url) {
  if (!url || typeof url !== 'string') return false

  try {
    const urlObj = new URL(url, window.location.origin)

    // Only allow same-origin redirects
    if (urlObj.origin !== window.location.origin) {
      return false
    }

    // Disallow dangerous protocols
    if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Basic secure localStorage operations
 */
export const secureStorage = {
  setItem(key, value) {
    try {
      // Basic validation
      if (typeof key !== 'string' || key.length > 100) {
        throw new Error('Invalid storage key')
      }

      const serialized = JSON.stringify(value)
      if (serialized.length > 10000) { // 10KB limit
        throw new Error('Storage value too large')
      }

      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error('Secure storage error:', error)
      return false
    }
  },

  getItem(key) {
    try {
      if (typeof key !== 'string' || key.length > 100) {
        return null
      }

      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Secure storage error:', error)
      return null
    }
  },

  removeItem(key) {
    try {
      if (typeof key !== 'string' || key.length > 100) {
        return false
      }

      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Secure storage error:', error)
      return false
    }
  }
}

// Auto initialize security settings
if (typeof window !== 'undefined') {
  // Wait for DOM to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppSecurity)
  } else {
    initializeAppSecurity()
  }
}
