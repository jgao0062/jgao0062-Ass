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
import { sendProgramJoinEmail } from './emailService.js'

// User data collection names
const USERS_COLLECTION = 'users'
const REGISTRATIONS_COLLECTION = 'registrations'
const RATINGS_COLLECTION = 'ratings'
const ACTIVITIES_COLLECTION = 'activities'
const PROGRAMS_COLLECTION = 'programs'

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
    await setDoc(doc(db, USERS_COLLECTION, firebaseUserId), userProfile)

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
 * Get all users (admin function)
 * @returns {Promise<Object>} All users data
 */
export async function getAllUsers() {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const users = []

    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      })
    })

    securityLog('info', 'Retrieved all users from Firebase', {
      count: users.length
    })

    return {
      success: true,
      data: users
    }
  } catch (error) {
    securityLog('error', 'Failed to get all users from Firebase', {
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get users: ' + error.message
    }
  }
}

/**
 * Update user role (admin function)
 * @param {string} userId - User ID
 * @param {string} newRole - New role ('user' or 'admin')
 * @returns {Promise<Object>} Operation result
 */
export async function updateUserRole(userId, newRole) {
  try {
    // Validate role
    if (!['user', 'admin'].includes(newRole)) {
      return {
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      }
    }

    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      role: newRole,
      updatedAt: new Date().toISOString()
    })

    securityLog('info', 'User role updated', {
      userId,
      newRole
    })

    return {
      success: true,
      message: `User role updated to ${newRole}`
    }
  } catch (error) {
    securityLog('error', 'Failed to update user role', {
      userId,
      newRole,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to update user role: ' + error.message
    }
  }
}

/**
 * Delete a user (admin function)
 * @param {string} userId - User ID to delete
 * @returns {Promise<Object>} Operation result
 */
export async function deleteUser(userId) {
  try {
    // Delete user profile from users collection
    await deleteDoc(doc(db, USERS_COLLECTION, userId))

    // Delete user registration data
    const registrationQuery = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('userId', '==', userId)
    )
    const registrationSnapshot = await getDocs(registrationQuery)
    const deleteRegistrationPromises = registrationSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deleteRegistrationPromises)

    // Delete user activities
    const activitiesQuery = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userId)
    )
    const activitiesSnapshot = await getDocs(activitiesQuery)
    const deleteActivitiesPromises = activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deleteActivitiesPromises)

    // Delete user ratings
    const ratingsQuery = query(
      collection(db, RATINGS_COLLECTION),
      where('userId', '==', userId)
    )
    const ratingsSnapshot = await getDocs(ratingsQuery)
    const deleteRatingsPromises = ratingsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deleteRatingsPromises)

    securityLog('info', 'User deleted from Firebase', {
      userId
    })

    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error) {
    securityLog('error', 'Failed to delete user from Firebase', {
      userId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to delete user: ' + error.message
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

// ==================== RATINGS FUNCTIONS ====================

/**
 * Get all ratings for a specific program
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Ratings data
 */
export async function getProgramRatings(programId) {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('programId', '==', programId)
    )

    const querySnapshot = await getDocs(q)
    const ratings = []

    querySnapshot.forEach((doc) => {
      ratings.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return {
      success: true,
      data: ratings
    }
  } catch (error) {
    securityLog('error', 'Failed to get program ratings from Firebase', {
      programId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get ratings: ' + error.message
    }
  }
}

/**
 * Get average rating for a program
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Average rating data
 */
export async function getProgramAverageRating(programId) {
  try {
    const ratingsResult = await getProgramRatings(programId)

    if (!ratingsResult.success) {
      return { average: 0, count: 0 }
    }

    const ratings = ratingsResult.data
    if (ratings.length === 0) {
      return { average: 0, count: 0 }
    }

    const sum = ratings.reduce((total, rating) => total + rating.value, 0)
    const average = Math.round((sum / ratings.length) * 10) / 10

    return {
      average,
      count: ratings.length
    }
  } catch (error) {
    securityLog('error', 'Failed to calculate average rating', {
      programId,
      error: error.message
    })

    return { average: 0, count: 0 }
  }
}

/**
 * Check if user has already rated a program
 * @param {string} programId - Program ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user has rated
 */
export async function userHasRated(programId, userId) {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('programId', '==', programId),
      where('userId', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    securityLog('error', 'Failed to check if user has rated', {
      programId,
      userId,
      error: error.message
    })
    return false
  }
}

/**
 * Check if user has joined a program
 * @param {string} userId - User ID
 * @param {string} programId - Program ID
 * @returns {Promise<boolean>} True if user has joined the program
 */
export async function userHasJoinedProgram(userId, programId) {
  try {
    const userIdStr = String(userId)
    const programIdStr = String(programId)
    
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userIdStr),
      where('programId', '==', programIdStr)
    )

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    securityLog('error', 'Failed to check if user joined program', {
      userId,
      programId,
      error: error.message
    })
    return false
  }
}

/**
 * Add or update a rating for a program
 * @param {string} programId - Program ID
 * @param {string} userId - User ID
 * @param {number} value - Rating value (1-5)
 * @returns {Promise<Object>} Operation result
 */
export async function addRating(programId, userId, value) {
  try {
    // Debug logging
    console.log('addRating called with:', { programId, userId, value })
    
    // Validate rating value
    const ratingValue = Math.max(1, Math.min(5, Number(value)))
    
    // Ensure programId is string for Firebase consistency
    const programIdStr = String(programId)
    const userIdStr = String(userId)

    // Check if user has joined the program
    const hasJoined = await userHasJoinedProgram(userIdStr, programIdStr)
    if (!hasJoined) {
      return {
        success: false,
        message: 'You must join this program before you can rate it'
      }
    }

    // Check if user has already rated this program
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('programId', '==', programIdStr),
      where('userId', '==', userIdStr)
    )

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Update existing rating
      const existingRating = querySnapshot.docs[0]
      await updateDoc(doc(db, RATINGS_COLLECTION, existingRating.id), {
        value: ratingValue,
        updatedAt: new Date().toISOString()
      })

      securityLog('info', 'Rating updated in Firebase', {
        programId,
        userId,
        value: ratingValue
      })

      return {
        success: true,
        message: 'Rating updated successfully',
        isUpdate: true
      }
    } else {
      // Add new rating
      const ratingData = {
        programId: programIdStr,
        userId: userIdStr,
        value: ratingValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, RATINGS_COLLECTION), ratingData)

      securityLog('info', 'New rating added to Firebase', {
        programId,
        userId,
        value: ratingValue
      })

      return {
        success: true,
        message: 'Rating added successfully',
        isUpdate: false
      }
    }
  } catch (error) {
    securityLog('error', 'Failed to add/update rating in Firebase', {
      programId,
      userId,
      value,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to save rating: ' + error.message
    }
  }
}

// ==================== ACTIVITIES FUNCTIONS ====================

/**
 * Get user activities
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User activities
 */
export async function getUserActivities(userId) {
  try {
    // Ensure userId is string for Firebase consistency
    const userIdStr = String(userId)
    
    // Simple query without orderBy to avoid index issues
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userIdStr)
    )

    const querySnapshot = await getDocs(q)
    const activities = []

    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Sort manually by joinedDate (newest first)
    activities.sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate))

    console.log('getUserActivities result:', { userId: userIdStr, activitiesCount: activities.length, activities })

    return {
      success: true,
      data: activities
    }
  } catch (error) {
    securityLog('error', 'Failed to get user activities from Firebase', {
      userId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get activities: ' + error.message
    }
  }
}

/**
 * Add user activity (join program)
 * @param {string} userId - User ID
 * @param {string} programId - Program ID
 * @param {string} programName - Program name
 * @returns {Promise<Object>} Operation result
 */
export async function addUserActivity(userId, programId, programName) {
  try {
    
    // Ensure IDs are strings for Firebase consistency
    const userIdStr = String(userId)
    const programIdStr = String(programId)
    
    // Check if user already joined this program
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userIdStr),
      where('programId', '==', programIdStr)
    )

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return {
        success: false,
        message: 'You have already joined this program'
      }
    }

    // Add new activity
    const activityData = {
      userId: userIdStr,
      programId: programIdStr,
      programName,
      joinedDate: new Date().toISOString(),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData)

    securityLog('info', 'User joined program in Firebase', {
      userId,
      programId,
      programName,
      activityId: docRef.id
    })

    // Send confirmation email
    try {
      // Get user profile data for email
      const userProfileResult = await getUserProfileFromFirebase(userIdStr)
      
      if (userProfileResult.success) {
        const userData = userProfileResult.data
        
        // Get program details for email
        const programDocRef = doc(db, PROGRAMS_COLLECTION, programIdStr)
        const programDoc = await getDoc(programDocRef)
        
        // Create program data (use provided programName if document doesn't exist)
        const programData = {
          id: programIdStr,
          name: programDoc.exists() ? (programDoc.data().name || programName) : programName,
          description: programDoc.exists() ? (programDoc.data().description || '') : '',
          schedule: programDoc.exists() ? (programDoc.data().schedule || '') : '',
          location: programDoc.exists() ? (programDoc.data().location || '') : ''
        }
        
        // Send email (don't wait for it to complete)
        sendProgramJoinEmail(userData, programData).then(emailResult => {
          if (emailResult.success) {
            securityLog('info', 'Program join confirmation email sent', {
              userId,
              programId,
              userEmail: userData.email
            })
          } else {
            securityLog('warning', 'Failed to send program join confirmation email', {
              userId,
              programId,
              userEmail: userData.email,
              error: emailResult.message
            })
          }
        }).catch(emailError => {
          securityLog('error', 'Email sending error', {
            userId,
            programId,
            userEmail: userData.email,
            error: emailError.message
          })
        })
      }
    } catch (emailError) {
      // Don't fail the join operation if email fails
      securityLog('warning', 'Failed to send confirmation email', {
        userId,
        programId,
        error: emailError.message
      })
    }

    return {
      success: true,
      message: `Successfully joined ${programName}!`,
      activityId: docRef.id
    }
  } catch (error) {
    securityLog('error', 'Failed to add user activity in Firebase', {
      userId,
      programId,
      programName,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to join program: ' + error.message
    }
  }
}

/**
 * Remove user activity (leave program)
 * @param {string} userId - User ID
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Operation result
 */
export async function removeUserActivity(userId, programId) {
  try {
    // Ensure IDs are strings for Firebase consistency
    const userIdStr = String(userId)
    const programIdStr = String(programId)
    
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userIdStr),
      where('programId', '==', programIdStr)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Activity not found'
      }
    }

    const activityDoc = querySnapshot.docs[0]
    const activityData = activityDoc.data()

    await deleteDoc(doc(db, ACTIVITIES_COLLECTION, activityDoc.id))

    securityLog('info', 'User left program in Firebase', {
      userId,
      programId,
      programName: activityData.programName
    })

    return {
      success: true,
      message: `Left ${activityData.programName}`
    }
  } catch (error) {
    securityLog('error', 'Failed to remove user activity in Firebase', {
      userId,
      programId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to leave program: ' + error.message
    }
  }
}

/**
 * Check if user has joined a program
 * @param {string} userId - User ID
 * @param {string} programId - Program ID
 * @returns {Promise<boolean>} Whether user has joined
 */
export async function hasUserJoinedProgram(userId, programId) {
  try {
    // Ensure IDs are strings for Firebase consistency
    const userIdStr = String(userId)
    const programIdStr = String(programId)
    
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('userId', '==', userIdStr),
      where('programId', '==', programIdStr)
    )

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    securityLog('error', 'Failed to check if user joined program', {
      userId,
      programId,
      error: error.message
    })
    return false
  }
}

/**
 * Get all activities for admin view
 * @returns {Promise<Object>} All activities
 */
export async function getAllActivities() {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      orderBy('joinedDate', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const activities = []

    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data()
      })
    })

    securityLog('info', 'Retrieved all activities from Firebase', {
      count: activities.length
    })

    return {
      success: true,
      data: activities
    }
  } catch (error) {
    securityLog('error', 'Failed to get all activities from Firebase', {
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get activities: ' + error.message
    }
  }
}

// ==================== PROGRAMS MANAGEMENT FUNCTIONS ====================

/**
 * Get all programs
 * @returns {Promise<Object>} All programs
 */
export async function getAllPrograms() {
  try {
    const q = query(
      collection(db, PROGRAMS_COLLECTION),
      orderBy('id', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    const programs = []
    
    querySnapshot.forEach((doc) => {
      programs.push({
        id: doc.id,
        ...doc.data()
      })
    })

    securityLog('info', 'Retrieved all programs from Firebase', {
      count: programs.length
    })

    return {
      success: true,
      data: programs
    }
  } catch (error) {
    securityLog('error', 'Failed to get all programs from Firebase', {
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get programs: ' + error.message
    }
  }
}

/**
 * Add a new program (admin only)
 * @param {Object} programData - Program data
 * @returns {Promise<Object>} Operation result
 */
export async function addProgram(programData) {
  try {
    // Validate required fields
    if (!programData.name || !programData.description || !programData.location) {
      return {
        success: false,
        message: 'Missing required fields: name, description, location'
      }
    }

    // Generate new ID
    const programsResult = await getAllPrograms()
    const existingPrograms = programsResult.success ? programsResult.data : []
    const maxId = existingPrograms.length > 0 ? Math.max(...existingPrograms.map(p => parseInt(p.id))) : 0
    const newId = (maxId + 1).toString()

    const program = {
      id: newId,
      name: programData.name,
      description: programData.description,
      location: programData.location,
      schedule: programData.schedule || '',
      maxParticipants: programData.maxParticipants || 20,
      participants: 0,
      price: programData.price || 0,
      category: programData.category || 'General',
      difficulty: programData.difficulty || 'Beginner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await addDoc(collection(db, PROGRAMS_COLLECTION), program)

    securityLog('info', 'New program added to Firebase', {
      programId: newId,
      programName: program.name,
      docId: docRef.id
    })

    return {
      success: true,
      message: 'Program added successfully',
      programId: newId,
      docId: docRef.id
    }
  } catch (error) {
    securityLog('error', 'Failed to add program to Firebase', {
      programData,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to add program: ' + error.message
    }
  }
}

/**
 * Update an existing program (admin only)
 * @param {string} programId - Program ID
 * @param {Object} programData - Updated program data
 * @returns {Promise<Object>} Operation result
 */
export async function updateProgram(programId, programData) {
  try {
    // Find the program document
    const q = query(
      collection(db, PROGRAMS_COLLECTION),
      where('id', '==', programId)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Program not found'
      }
    }

    const programDoc = querySnapshot.docs[0]
    const currentData = programDoc.data()

    // Update only provided fields
    const updatedData = {
      ...currentData,
      ...programData,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(doc(db, PROGRAMS_COLLECTION, programDoc.id), updatedData)

    securityLog('info', 'Program updated in Firebase', {
      programId,
      programName: updatedData.name,
      docId: programDoc.id
    })

    return {
      success: true,
      message: 'Program updated successfully'
    }
  } catch (error) {
    securityLog('error', 'Failed to update program in Firebase', {
      programId,
      programData,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to update program: ' + error.message
    }
  }
}

/**
 * Delete a program (admin only)
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Operation result
 */
export async function deleteProgram(programId) {
  try {
    // Find the program document
    const q = query(
      collection(db, PROGRAMS_COLLECTION),
      where('id', '==', programId)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Program not found'
      }
    }

    const programDoc = querySnapshot.docs[0]
    const programData = programDoc.data()

    // Delete the program
    await deleteDoc(doc(db, PROGRAMS_COLLECTION, programDoc.id))

    // Also delete related ratings and activities
    try {
      // Delete related ratings
      const ratingsQuery = query(
        collection(db, RATINGS_COLLECTION),
        where('programId', '==', programId)
      )
      const ratingsSnapshot = await getDocs(ratingsQuery)
      const deleteRatingPromises = ratingsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteRatingPromises)

      // Delete related activities
      const activitiesQuery = query(
        collection(db, ACTIVITIES_COLLECTION),
        where('programId', '==', programId)
      )
      const activitiesSnapshot = await getDocs(activitiesQuery)
      const deleteActivityPromises = activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteActivityPromises)
    } catch (cleanupError) {
      securityLog('warning', 'Error cleaning up related data', {
        programId,
        error: cleanupError.message
      })
    }

    // Reorder remaining programs to maintain consecutive IDs
    await reorderProgramIds()

    securityLog('info', 'Program deleted from Firebase', {
      programId,
      programName: programData.name,
      docId: programDoc.id
    })

    return {
      success: true,
      message: 'Program deleted successfully'
    }
  } catch (error) {
    securityLog('error', 'Failed to delete program from Firebase', {
      programId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to delete program: ' + error.message
    }
  }
}

/**
 * Reorder program IDs to maintain consecutive sequence
 * @returns {Promise<Object>} Operation result
 */
export async function reorderProgramIds() {
  try {
    // Get all programs sorted by current ID
    const q = query(
      collection(db, PROGRAMS_COLLECTION),
      orderBy('id', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    const programs = []
    
    querySnapshot.forEach((doc) => {
      programs.push({
        docId: doc.id,
        ...doc.data()
      })
    })

    // If no programs or already consecutive, no need to reorder
    if (programs.length === 0) {
      return { success: true, message: 'No programs to reorder' }
    }

    // Check if IDs are already consecutive starting from 1
    let needsReorder = false
    for (let i = 0; i < programs.length; i++) {
      if (parseInt(programs[i].id) !== i + 1) {
        needsReorder = true
        break
      }
    }

    if (!needsReorder) {
      return { success: true, message: 'Program IDs are already consecutive' }
    }

    // Reorder IDs to be consecutive starting from 1
    const updatePromises = []
    for (let i = 0; i < programs.length; i++) {
      const newId = (i + 1).toString()
      if (programs[i].id !== newId) {
        // Update program document with new ID
        const updatePromise = updateDoc(doc(db, PROGRAMS_COLLECTION, programs[i].docId), {
          id: newId
        })
        updatePromises.push(updatePromise)

        // Update related ratings and activities with new programId
        const oldProgramId = programs[i].id
        
        // Update ratings
        const ratingsQuery = query(
          collection(db, RATINGS_COLLECTION),
          where('programId', '==', oldProgramId)
        )
        const ratingsSnapshot = await getDocs(ratingsQuery)
        const ratingUpdatePromises = ratingsSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { programId: newId })
        )
        updatePromises.push(...ratingUpdatePromises)

        // Update activities
        const activitiesQuery = query(
          collection(db, ACTIVITIES_COLLECTION),
          where('programId', '==', oldProgramId)
        )
        const activitiesSnapshot = await getDocs(activitiesQuery)
        const activityUpdatePromises = activitiesSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { programId: newId })
        )
        updatePromises.push(...activityUpdatePromises)
      }
    }

    // Execute all updates
    await Promise.all(updatePromises)

    securityLog('info', 'Program IDs reordered successfully', {
      totalPrograms: programs.length,
      updatesPerformed: updatePromises.length
    })

    return {
      success: true,
      message: `Program IDs reordered successfully. ${programs.length} programs now have consecutive IDs.`
    }
  } catch (error) {
    securityLog('error', 'Failed to reorder program IDs', {
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to reorder program IDs: ' + error.message
    }
  }
}

/**
 * Get a single program by ID
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Program data
 */
export async function getProgramById(programId) {
  try {
    const q = query(
      collection(db, PROGRAMS_COLLECTION),
      where('id', '==', programId)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Program not found'
      }
    }

    const programDoc = querySnapshot.docs[0]
    return {
      success: true,
      data: {
        id: programDoc.id,
        ...programDoc.data()
      }
    }
  } catch (error) {
    securityLog('error', 'Failed to get program by ID from Firebase', {
      programId,
      error: error.message
    })

    return {
      success: false,
      message: 'Failed to get program: ' + error.message
    }
  }
}
