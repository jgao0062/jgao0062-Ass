// Firebase Firestore User Data Service
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { securityLog } from '../utils/security.js'

// User data collection names
const USERS_COLLECTION = 'users'
const REGISTRATIONS_COLLECTION = 'registrations'

/**
 * Save user registration data to Firebase Firestore
 * @param {Object} userData - User registration data
 * @param {string} firebaseUserId - Firebase user ID
 * @returns {Promise<Object>} Save result
 */
export async function saveUserRegistrationToFirebase(userData, firebaseUserId) {
  try {
    // Prepare data to save
    const registrationData = {
      userId: firebaseUserId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      age: userData.age,
      language: userData.language,
      interestedPrograms: userData.interestedPrograms || [],
      emergencyContact: userData.emergencyContact,
      emergencyPhone: userData.emergencyPhone,
      registrationDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to registrations collection
    const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), registrationData)

    securityLog('info', 'User registration data saved to Firebase', {
      userId: firebaseUserId,
      registrationId: docRef.id,
      email: userData.email
    })

    return {
      success: true,
      registrationId: docRef.id,
      message: 'Registration data successfully saved to database'
    }
  } catch (error) {
    securityLog('error', 'Failed to save user registration data to Firebase', {
      userId: firebaseUserId,
      error: error.message,
      email: userData.email
    })

    return {
      success: false,
      message: 'Failed to save registration data: ' + error.message
    }
  }
}

/**
 * Save user basic information to Firebase Firestore
 * @param {Object} userData - User basic information
 * @param {string} firebaseUserId - Firebase user ID
 * @returns {Promise<Object>} Save result
 */
export async function saveUserProfileToFirebase(userData, firebaseUserId) {
  try {
    const userProfile = {
      id: firebaseUserId, // Use Firebase UID as the document ID
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone || '',
      age: userData.age || '',
      language: userData.language || 'English',
      role: userData.role || 'user',
      createdAt: new Date().toISOString(), // Store as ISO string for consistency
      updatedAt: new Date().toISOString(),
      lastLogin: null
    }

    // Save to users collection using Firebase UID as document ID
    const docRef = await setDoc(doc(db, USERS_COLLECTION, firebaseUserId), userProfile)

    securityLog('info', 'User basic information saved to Firebase', {
      userId: firebaseUserId,
      userDocId: firebaseUserId,
      email: userData.email
    })

    return {
      success: true,
      userDocId: firebaseUserId,
      message: 'User information successfully saved to database'
    }
  } catch (error) {
    securityLog('error', 'Failed to save user basic information to Firebase', {
      userId: firebaseUserId,
      error: error.message,
      email: userData.email
    })

    return {
      success: false,
      message: 'Failed to save user information: ' + error.message
    }
  }
}

/**
 * Get user registration data by user ID
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} User registration data
 */
export async function getUserRegistrationFromFirebase(userId) {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('id', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'User registration data not found'
      }
    }

    const doc = querySnapshot.docs[0]
    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    }
  } catch (error) {
    securityLog('error', 'Failed to get user registration data from Firebase', {
      userId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get user data: ' + error.message
    }
  }
}

/**
 * Get user basic information by user ID
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} User basic information
 */
export async function getUserProfileFromFirebase(userId) {
  try {
    // Directly get the document using the userId as document ID
    const docRef = doc(db, USERS_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        message: 'User information not found'
      }
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    }
  } catch (error) {
    securityLog('error', 'Failed to get user basic information from Firebase', {
      userId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get user information: ' + error.message
    }
  }
}

/**
 * Update user last login time
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} Update result
 */
export async function updateUserLastLogin(userId) {
  try {
    // Directly update the document using the userId as document ID
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    securityLog('info', 'User last login time updated', { userId })

    return {
      success: true,
      message: 'Login time updated'
    }
  } catch (error) {
    securityLog('error', 'Failed to update user last login time', {
      userId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to update login time: ' + error.message
    }
  }
}

/**
 * Get all user registration data (admin function)
 * @returns {Promise<Object>} All user registration data
 */
export async function getAllUserRegistrations() {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const registrations = []

    querySnapshot.forEach((doc) => {
      registrations.push({
        id: doc.id,
        ...doc.data()
      })
    })

    securityLog('info', 'Get all user registration data', {
      count: registrations.length
    })

    return {
      success: true,
      data: registrations
    }
  } catch (error) {
    securityLog('error', 'Failed to get all user registration data', {
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get user data: ' + error.message
    }
  }
}

/**
 * Find user registration data by email
 * @param {string} email - User email
 * @returns {Promise<Object>} User registration data
 */
export async function findUserRegistrationByEmail(email) {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('email', '==', email),
      orderBy('createdAt', 'desc'),
      limit(1)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Registration data for this email not found'
      }
    }

    const doc = querySnapshot.docs[0]
    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    }
  } catch (error) {
    securityLog('error', 'Failed to find user registration data by email', {
      email,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to find user data: ' + error.message
    }
  }
}
