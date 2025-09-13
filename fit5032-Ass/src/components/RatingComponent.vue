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
    <div class="user-rating" v-if="showUserRating">
      <div class="mb-2">
        <small class="text-muted" v-if="session">Your rating:</small>
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
            'text-muted': star > userRating
          }"
          @click="setRating(star)"
          style="cursor: pointer; font-size: 1.5rem; margin-right: 5px;"
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
        <small v-else-if="session" class="text-muted">
          Click stars or buttons to rate
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
import { getSession, addRating, userHasRated, getProgramAverageRating } from '../utils/auth.js'

export default {
  name: 'RatingComponent',
  props: {
    programId: {
      type: Number,
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

    // Load current rating data
    const loadRatingData = () => {
      const ratingData = getProgramAverageRating(props.programId)
      averageRating.value = ratingData.average
      totalRatings.value = ratingData.count

      // Check if current user has rated
      if (session.value) {
        const hasRated = userHasRated(props.programId, session.value.userId)
        if (hasRated) {
          // Find the user's rating
          const ratings = JSON.parse(localStorage.getItem('program_ratings') || '{}')
          const programRatings = ratings[props.programId] || []
          const userRatingData = programRatings.find(r => r.userId === session.value.userId)
          if (userRatingData) {
            userRating.value = userRatingData.value
          }
        }
      }
    }

    onMounted(() => {
      loadRatingData()
    })

    // Set user rating function
    const setRating = (rating) => {
      // Always refresh session state
      session.value = getSession()

      if (!session.value) {
        validationError.value = 'Please login to rate programs'
        return
      }

      try {
        addRating(props.programId, session.value.userId, rating)
        userRating.value = rating
        validationError.value = ''

        // Reload rating data
        loadRatingData()

        // Emit event to parent component
        window.dispatchEvent(new CustomEvent('ratingUpdated', {
          detail: { programId: props.programId, rating }
        }))
      } catch (error) {
        validationError.value = 'Error saving rating: ' + error.message
        console.error('Error saving rating:', error)
      }
    }

    return {
      userRating,
      validationError,
      averageRating,
      totalRatings,
      session,
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
