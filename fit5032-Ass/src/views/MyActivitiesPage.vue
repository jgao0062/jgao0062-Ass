<template>
  <div class="container py-5">
    <div class="row">
      <div class="col-md-8">
        <h2 class="mb-4">My Activities</h2>

        <!-- Login Required -->
        <div v-if="!session" class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Please <router-link to="/login" class="text-decoration-none">login</router-link> to view your activities.
        </div>

        <!-- Activities List -->
        <div v-else-if="userActivities.length > 0">
          <div class="card mb-3" v-for="activity in userActivities" :key="activity.programId">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-8">
                  <h5 class="card-title mb-2">{{ activity.programName }}</h5>
                  <div class="activity-info">
                    <small class="text-muted">
                      <i class="fas fa-calendar-plus me-1"></i>
                      Joined: {{ formatDate(activity.joinedDate) }}
                    </small>
                    <br>
                    <small class="text-muted">
                      <i class="fas fa-clock me-1"></i>
                      Status:
                      <span class="badge bg-success">{{ activity.status }}</span>
                    </small>
                  </div>
                </div>
                <div class="col-md-4 text-end">
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="leaveProgram(activity.programId, activity.programName)"
                  >
                    <i class="fas fa-times me-1"></i>
                    Leave Program
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Activities -->
        <div v-else class="text-center py-5">
          <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
          <h5>No Activities Yet</h5>
          <p class="text-muted">You haven't joined any programs yet.</p>
          <router-link to="/programs" class="btn btn-primary">
            <i class="fas fa-search me-2"></i>
            Browse Programs
          </router-link>
        </div>

        <!-- Leave Message -->
        <div v-if="leaveMessage" class="alert" :class="`alert-${leaveMessageType}`" role="alert">
          <i class="fas fa-info-circle me-2"></i>
          {{ leaveMessage }}
        </div>
      </div>

      <!-- Sidebar -->
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Activity Summary</h5>
          </div>
          <div class="card-body">
            <div class="stats-item mb-3">
              <div class="d-flex justify-content-between">
                <span>Total Programs:</span>
                <strong>{{ userActivities.length }}</strong>
              </div>
            </div>
            <div class="stats-item mb-3">
              <div class="d-flex justify-content-between">
                <span>Upcoming:</span>
                <strong>{{ upcomingCount }}</strong>
              </div>
            </div>
            <div class="stats-item">
              <div class="d-flex justify-content-between">
                <span>Completed:</span>
                <strong>{{ completedCount }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card mt-3">
          <div class="card-header">
            <h5 class="mb-0">Quick Actions</h5>
          </div>
          <div class="card-body">
            <router-link to="/programs" class="btn btn-primary w-100 mb-2">
              <i class="fas fa-plus me-2"></i>
              Join New Program
            </router-link>
            <router-link to="/" class="btn btn-outline-primary w-100">
              <i class="fas fa-home me-2"></i>
              Back to Home
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getSession } from '../utils/auth.js'
import { getUserActivities, removeUserActivity } from '../services/userService.js'

export default {
  name: 'MyActivitiesPage',
  setup() {
    const session = ref(getSession())
    const userActivities = ref([])
    const leaveMessage = ref('')
    const leaveMessageType = ref('')

    // Load user activities
    const loadActivities = async () => {
      if (session.value) {
        try {
          console.log('Loading activities for user:', session.value.userId)
          const result = await getUserActivities(session.value.userId)
          console.log('Activities result:', result)
          if (result.success) {
            userActivities.value = result.data
            console.log('Activities loaded:', userActivities.value)
          } else {
            console.error('Failed to load activities:', result.message)
            userActivities.value = []
          }
        } catch (error) {
          console.error('Error loading activities:', error)
          userActivities.value = []
        }
      } else {
        console.log('No session found, cannot load activities')
      }
    }

    // Format date
    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // Leave program
    const leaveProgram = async (programId, programName) => {
      if (confirm(`Are you sure you want to leave ${programName}?`)) {
        try {
          const result = await removeUserActivity(session.value.userId, programId)

          if (result.success) {
            leaveMessage.value = result.message
            leaveMessageType.value = 'success'
            await loadActivities() // Refresh activities
          } else {
            leaveMessage.value = result.message
            leaveMessageType.value = 'danger'
          }
        } catch (error) {
          leaveMessage.value = 'Error leaving program: ' + error.message
          leaveMessageType.value = 'danger'
        }

        // Clear message after 3 seconds
        setTimeout(() => {
          leaveMessage.value = ''
          leaveMessageType.value = ''
        }, 3000)
      }
    }

    // Computed properties
    const upcomingCount = computed(() => {
      return userActivities.value.filter(activity => activity.status === 'upcoming').length
    })

    const completedCount = computed(() => {
      return userActivities.value.filter(activity => activity.status === 'completed').length
    })

    onMounted(() => {
      loadActivities()
    })

    // Add a method to refresh activities (can be called from other components)
    const refreshActivities = () => {
      loadActivities()
    }

    // Expose refresh method globally for other components to use
    window.refreshMyActivities = refreshActivities

    return {
      session,
      userActivities,
      leaveMessage,
      leaveMessageType,
      formatDate,
      leaveProgram,
      upcomingCount,
      completedCount
    }
  }
}
</script>

<style scoped>
.activity-info {
  margin-top: 0.5rem;
}

.stats-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.stats-item:last-child {
  border-bottom: none;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
}

.card-header {
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.card-body {
  color: var(--text-primary);
}

.btn-outline-danger {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.btn-outline-danger:hover {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
}
</style>
