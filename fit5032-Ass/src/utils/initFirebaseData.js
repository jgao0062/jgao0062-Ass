// Initialize Firebase with existing data
// This script migrates local data to Firebase

import { programsData } from '../data/programs.js'
import { addProgram } from '../services/userService.js'

/**
 * Initialize programs data in Firebase
 * This should be run once to migrate existing data
 */
export async function initializeProgramsData() {
  console.log('Starting Firebase data initialization...')
  
  try {
    // Check if programs already exist in Firebase
    const { getAllPrograms } = await import('../services/userService.js')
    const existingPrograms = await getAllPrograms()
    
    if (existingPrograms.success && existingPrograms.data.length > 0) {
      console.log('Programs already exist in Firebase, skipping initialization')
      return {
        success: true,
        message: 'Programs already initialized',
        count: existingPrograms.data.length
      }
    }

    // Add all programs from local data
    let successCount = 0
    let errorCount = 0

    for (const program of programsData) {
      try {
        const result = await addProgram(program)
        if (result.success) {
          successCount++
          console.log(`Added program: ${program.name}`)
        } else {
          errorCount++
          console.error(`Failed to add program ${program.name}:`, result.message)
        }
      } catch (error) {
        errorCount++
        console.error(`Error adding program ${program.name}:`, error.message)
      }
    }

    console.log(`Firebase initialization completed: ${successCount} successful, ${errorCount} errors`)
    
    return {
      success: true,
      message: `Initialized ${successCount} programs`,
      successCount,
      errorCount
    }
  } catch (error) {
    console.error('Error during Firebase initialization:', error)
    return {
      success: false,
      message: 'Initialization failed: ' + error.message
    }
  }
}

/**
 * Run initialization (for manual execution)
 */
export async function runInitialization() {
  const result = await initializeProgramsData()
  console.log('Initialization result:', result)
  return result
}

// Make it available globally for console execution
if (typeof window !== 'undefined') {
  window.initializeFirebaseData = runInitialization
}
