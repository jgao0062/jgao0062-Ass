<template>
  <div class="rating-component">
    <!-- Display Average Rating -->
    <div class="average-rating mb-3">
      <div class="d-flex align-items-center">
        <div class="stars-display me-2">
          <i
            v-for="star in 5"
            :key="star"
            class="fas fa-star"
            :class="star <= Math.floor(averageRating) ? 'text-warning' : 'text-muted'"
          ></i>
        </div>
        <span class="rating-text">
          <strong>{{ averageRating.toFixed(1) }}</strong>
          <small class="text-muted">({{ totalRatings }} ratings)</small>
        </span>
      </div>
    </div>

    <!-- User Rating Input -->
    <div class="user-rating" v-if="showUserRating && !isAdmin">
      <div class="mb-2">
        <small class="text-muted" v-if="session && hasJoinedProgram">Your rating:</small>
        <small class="text-muted" v-else-if="session && !hasJoinedProgram">Join program to rate:</small>
        <small class="text-muted" v-else>Please login to rate</small>
        <small class="text-info" v-if="session">(Logged in as: {{ session.firstName || session.email }})</small>
      </div>

      <!-- Star display -->
      <div class="rating-stars mb-2">
        <i
          v-for="star in 5"
          :key="star"
          class="fas fa-star rating-star"
          :class="{
            'text-warning': star <= userRating,
            'text-muted': star > userRating,
            'rating-disabled': !hasJoinedProgram
          }"
          @click="hasJoinedProgram ? setRating(star) : null"
          :style="{
            cursor: hasJoinedProgram ? 'pointer' : 'not-allowed',
            fontSize: '1.5rem',
            marginRight: '5px',
            opacity: hasJoinedProgram ? 1 : 0.5
          }"
        ></i>
      </div>

      <div class="rating-feedback">
        <small v-if="validationError" class="text-danger">
          <i class="fas fa-exclamation-triangle me-1"></i>
          {{ validationError }}
        </small>
        <small v-else-if="userRating > 0" class="text-success">
          <i class="fas fa-check-circle me-1"></i>
          Rating saved: {{ userRating }} stars
        </small>
        <small v-else-if="session && hasJoinedProgram && !isAdmin" class="text-muted">
          Click stars to rate this program
        </small>
        <small v-else-if="session && !hasJoinedProgram && !isAdmin" class="text-warning">
          <i class="fas fa-info-circle me-1"></i>
          You must join this program before you can rate it
        </small>
        <small v-else-if="isAdmin" class="text-info">
          <i class="fas fa-info-circle me-1"></i>
          Admins cannot rate programs
        </small>
        <small v-else class="text-muted">
          <router-link to="/login" class="text-decoration-none">Login</router-link> to rate programs
        </small>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getSession } from '../utils/auth.js'
import { 
  addRating, 
  userHasRated, 
  getProgramAverageRating,
  userHasJoinedProgram
} from '../services/userService.js'
import { securityLog, sanitizeNumber } from '../utils/security.js'

export default {
  name: 'RatingComponent',
  props: {
    programId: {
      type: [String, Number],
      required: true
    },
    showUserRating: {
      type: Boolean,
      default: true
    },
    showSummary: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const userRating = ref(0)
    const validationError = ref('')
    const session = ref(getSession())
    const averageRating = ref(0)
    const totalRatings = ref(0)
    const hasJoinedProgram = ref(false)

    // Check if current user is admin
    const isAdmin = computed(() => {
      return session.value && session.value.role === 'admin'
    })

    // Load current rating data
    const loadRatingData = async () => {
      try {
        // Get average rating from Firebase
        const ratingData = await getProgramAverageRating(props.programId)
        averageRating.value = ratingData.average
        totalRatings.value = ratingData.count

        // Check if current user has joined the program
        if (session.value) {
          hasJoinedProgram.value = await userHasJoinedProgram(session.value.userId, props.programId)
          
          // Check if current user has rated
          const hasRated = await userHasRated(props.programId, session.value.userId)
          if (hasRated) {
            // Get user's rating from Firebase
            const { getProgramRatings } = await import('../services/userService.js')
            const ratingsResult = await getProgramRatings(props.programId)
            if (ratingsResult.success) {
              const userRatingData = ratingsResult.data.find(r => r.userId === session.value.userId)
              if (userRatingData) {
                userRating.value = userRatingData.value
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading rating data:', error)
        securityLog('error', 'Failed to load rating data', {
          programId: props.programId,
          error: error.message
        })
      }
    }

    onMounted(() => {
      loadRatingData()
    })

    // Set user rating function
    const setRating = async (rating) => {
      // Validate and sanitize rating input
      const sanitizedRating = sanitizeNumber(rating, 1, 5)
      if (sanitizedRating === null) {
        validationError.value = 'Invalid rating value'
        securityLog('warning', 'Invalid rating input', { rating, programId: props.programId })
        return
      }

      // Always refresh session state
      session.value = getSession()

      if (!session.value) {
        validationError.value = 'Please login to rate programs'
        return
      }

      // Check if user has joined the program
      if (!hasJoinedProgram.value) {
        validationError.value = 'You must join this program before you can rate it'
        return
      }

      try {
        const result = await addRating(props.programId, session.value.userId, sanitizedRating)
        
        if (result.success) {
          userRating.value = sanitizedRating
          validationError.value = ''

          // Reload rating data
          await loadRatingData()

          // Emit event to parent component
          window.dispatchEvent(new CustomEvent('ratingUpdated', {
            detail: { programId: props.programId, rating: sanitizedRating }
          }))

          securityLog('info', 'Rating submitted successfully', {
            programId: props.programId,
            userId: session.value.userId,
            rating: sanitizedRating
          })
        } else {
          validationError.value = result.message
        }
      } catch (error) {
        validationError.value = 'Error saving rating: ' + error.message
        securityLog('error', 'Rating submission failed', {
          programId: props.programId,
          userId: session.value.userId,
          error: error.message
        })
        console.error('Error saving rating:', error)
      }
    }

    return {
      userRating,
      validationError,
      averageRating,
      totalRatings,
      session,
      isAdmin,
      hasJoinedProgram,
      setRating
    }
  }
}
</script>

<style scoped>
.rating-component {
  font-size: 0.9rem;
}

.stars-display {
  font-size: 1.1rem;
}

.rating-star {
  cursor: pointer;
  transition: color 0.2s ease;
}

.rating-star:hover {
  color: #ffc107 !important;
}

.rating-disabled {
  pointer-events: none;
}

.rating-disabled:hover {
  color: inherit !important;
}

.average-rating {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
}

.user-rating {
  padding: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}
</style>
