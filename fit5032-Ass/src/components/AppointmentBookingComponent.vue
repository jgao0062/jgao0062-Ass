<template>
  <div class="activities-calendar">
    <div class="container-fluid">
      <div class="row">
        <!-- Calendar Area -->
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">
                <i class="fas fa-calendar-alt"></i> My Activities Calendar
              </h4>
            </div>
            <div class="card-body">
              <!-- Login Required -->
              <div v-if="!session" class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Please <router-link to="/login" class="text-decoration-none">login</router-link> to view your activities calendar.
              </div>

              <!-- Calendar -->
              <div v-else>
                <FullCalendar
                  ref="calendar"
                  :options="calendarOptions"
                  @eventClick="handleEventClick"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Activities Summary -->
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-chart-pie"></i> Activities Summary
              </h5>
            </div>
            <div class="card-body">
              <div v-if="!session" class="text-center py-3">
                <p class="text-muted">Please login to view your activities</p>
              </div>
              <div v-else-if="userActivities.length === 0" class="text-center py-3">
                <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                <p class="text-muted">No activities yet</p>
                <router-link to="/programs" class="btn btn-primary btn-sm">
                  <i class="fas fa-plus me-1"></i> Join Programs
                </router-link>
              </div>
              <div v-else>
                <div class="stats-item mb-3">
                  <div class="d-flex justify-content-between">
                    <span>Total Activities:</span>
                    <strong>{{ userActivities.length }}</strong>
                  </div>
                </div>
                <div class="stats-item mb-3">
                  <div class="d-flex justify-content-between">
                    <span>Upcoming:</span>
                    <strong class="text-success">{{ upcomingCount }}</strong>
                  </div>
                </div>
                <div class="stats-item mb-3">
                  <div class="d-flex justify-content-between">
                    <span>Completed:</span>
                    <strong class="text-info">{{ completedCount }}</strong>
                  </div>
                </div>
                <div class="stats-item">
                  <div class="d-flex justify-content-between">
                    <span>This Month:</span>
                    <strong class="text-primary">{{ thisMonthCount }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activities -->
          <div class="card mt-3" v-if="session && userActivities.length > 0">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fas fa-history"></i> Recent Activities
              </h6>
            </div>
            <div class="card-body">
              <div v-for="activity in recentActivities" :key="activity.id" class="activity-item mb-2">
                <div class="d-flex align-items-center">
                  <div class="flex-grow-1">
                    <div class="activity-name">{{ activity.programName }}</div>
                    <small class="text-muted">{{ formatDate(activity.joinedDate) }}</small>
                  </div>
                  <div class="activity-status">
                    <span class="badge" :class="getStatusClass(activity.status)">
                      {{ activity.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Details Modal -->
    <div class="modal fade" id="activityModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Activity Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedActivity">
            <div class="row">
              <div class="col-sm-3"><strong>Program:</strong></div>
              <div class="col-sm-9">{{ selectedActivity.programName }}</div>
            </div>
            <div class="row">
              <div class="col-sm-3"><strong>Status:</strong></div>
              <div class="col-sm-9">
                <span class="badge" :class="getStatusClass(selectedActivity.status)">
                  {{ selectedActivity.status }}
                </span>
              </div>
            </div>
            <div class="row">
              <div class="col-sm-3"><strong>Joined:</strong></div>
              <div class="col-sm-9">{{ formatDate(selectedActivity.joinedDate) }}</div>
            </div>
            <div class="row" v-if="selectedActivity.programDetails">
              <div class="col-sm-3"><strong>Location:</strong></div>
              <div class="col-sm-9">{{ selectedActivity.programDetails.location }}</div>
            </div>
            <div class="row" v-if="selectedActivity.programDetails && selectedActivity.programDetails.schedule">
              <div class="col-sm-3"><strong>Schedule:</strong></div>
              <div class="col-sm-9">{{ selectedActivity.programDetails.schedule }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-danger" @click="leaveActivity">
              <i class="fas fa-times"></i> Leave Activity
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getSession } from '../utils/auth.js'
import { getUserActivities, removeUserActivity, getProgramById } from '../services/userService.js'

export default {
  name: 'ActivitiesCalendarComponent',
  components: {
    FullCalendar
  },
  setup() {
    const calendar = ref(null)
    const session = ref(getSession())
    const userActivities = ref([])
    const selectedActivity = ref(null)
    const isLoading = ref(false)

    // Load user activities
    const loadActivities = async () => {
      if (!session.value) return

      isLoading.value = true
      try {
        console.log('Loading activities for user:', session.value.userId)
        const result = await getUserActivities(session.value.userId)
        console.log('Activities result:', result)

        if (result.success) {
          userActivities.value = result.data
          console.log('Activities loaded:', userActivities.value)

          // Load program details for each activity
          await loadProgramDetails()
        } else {
          console.error('Failed to load activities:', result.message)
          userActivities.value = []
        }
      } catch (error) {
        console.error('Error loading activities:', error)
        userActivities.value = []
      } finally {
        isLoading.value = false
      }
    }

    // Load program details for activities
    const loadProgramDetails = async () => {
      for (let activity of userActivities.value) {
        try {
          const programResult = await getProgramById(activity.programId)
          if (programResult.success) {
            activity.programDetails = programResult.data
          }
        } catch (error) {
          console.error('Error loading program details:', error)
        }
      }
    }

    // Calendar configuration
    const calendarOptions = computed(() => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      locale: 'en',
      events: calendarEvents.value,
      height: 'auto',
      eventClick: handleEventClick,
      eventDisplay: 'block',
      dayMaxEvents: 3,
      moreLinkClick: 'popover',
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      nowIndicator: true,
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }
    }))

    // Convert activities to calendar events
    const calendarEvents = computed(() => {
      const events = []

      userActivities.value.forEach(activity => {
        // If we have program details with schedule, try to parse it
        if (activity.programDetails && activity.programDetails.schedule) {
          const scheduleEvents = parseScheduleToEvents(activity)
          events.push(...scheduleEvents)
        } else {
          // Fallback: show as joined date event
          const joinedDate = new Date(activity.joinedDate)
          events.push({
            id: activity.id,
            title: activity.programName,
            start: joinedDate.toISOString().split('T')[0],
            allDay: true,
            backgroundColor: getActivityColor(activity.status),
            borderColor: getActivityColor(activity.status),
            textColor: '#ffffff',
            extendedProps: {
              activity: activity
            }
          })
        }
      })

      return events
    })

    // Parse schedule text to calendar events
    const parseScheduleToEvents = (activity) => {
      const events = []
      const schedule = activity.programDetails.schedule

      // Try to parse different schedule formats
      // Format examples: "Mon, Wed, Fri 6-8 PM", "Every Monday 7-9 PM", "Daily 9-10 AM"

      // Extract time information
      const timeMatch = schedule.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i)
      if (!timeMatch) {
        // If no time found, create a weekly recurring event
        return createWeeklyEvents(activity, '09:00', '10:00')
      }

      const startHour = parseInt(timeMatch[1])
      const startMin = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const startPeriod = timeMatch[3] || 'AM'
      const endHour = parseInt(timeMatch[4])
      const endMin = timeMatch[5] ? parseInt(timeMatch[5]) : 0
      const endPeriod = timeMatch[6] || startPeriod

      // Convert to 24-hour format
      const startTime24 = convertTo24Hour(startHour, startPeriod)
      const endTime24 = convertTo24Hour(endHour, endPeriod)

      const startTimeStr = `${startTime24.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
      const endTimeStr = `${endTime24.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

      // Check for specific days
      if (schedule.toLowerCase().includes('daily') || schedule.toLowerCase().includes('every day')) {
        return createDailyEvents(activity, startTimeStr, endTimeStr)
      } else if (schedule.toLowerCase().includes('weekend')) {
        return createWeekendEvents(activity, startTimeStr, endTimeStr)
      } else {
        return createWeeklyEvents(activity, startTimeStr, endTimeStr)
      }
    }

    // Convert 12-hour to 24-hour format
    const convertTo24Hour = (hour, period) => {
      if (period.toUpperCase() === 'AM') {
        return hour === 12 ? 0 : hour
      } else { // PM
        return hour === 12 ? 12 : hour + 12
      }
    }

    // Create daily recurring events
    const createDailyEvents = (activity, startTime, endTime) => {
      const events = []
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7) // Start from a week ago

      for (let i = 0; i < 30; i++) { // Create events for next 30 days
        const eventDate = new Date(startDate)
        eventDate.setDate(startDate.getDate() + i)

        events.push({
          id: `${activity.id}-${i}`,
          title: activity.programName,
          start: `${eventDate.toISOString().split('T')[0]}T${startTime}`,
          end: `${eventDate.toISOString().split('T')[0]}T${endTime}`,
          backgroundColor: getActivityColor(activity.status),
          borderColor: getActivityColor(activity.status),
          textColor: '#ffffff',
          extendedProps: {
            activity: activity
          }
        })
      }

      return events
    }

    // Create weekend events (Saturday and Sunday)
    const createWeekendEvents = (activity, startTime, endTime) => {
      const events = []
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      for (let i = 0; i < 30; i++) {
        const eventDate = new Date(startDate)
        eventDate.setDate(startDate.getDate() + i)
        const dayOfWeek = eventDate.getDay()

        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          events.push({
            id: `${activity.id}-weekend-${i}`,
            title: activity.programName,
            start: `${eventDate.toISOString().split('T')[0]}T${startTime}`,
            end: `${eventDate.toISOString().split('T')[0]}T${endTime}`,
            backgroundColor: getActivityColor(activity.status),
            borderColor: getActivityColor(activity.status),
            textColor: '#ffffff',
            extendedProps: {
              activity: activity
            }
          })
        }
      }

      return events
    }

    // Create weekly events (Monday, Wednesday, Friday)
    const createWeeklyEvents = (activity, startTime, endTime) => {
      const events = []
      const schedule = activity.programDetails.schedule.toLowerCase()

      // Determine which days of the week
      const days = []
      if (schedule.includes('mon') || schedule.includes('monday')) days.push(1)
      if (schedule.includes('tue') || schedule.includes('tuesday')) days.push(2)
      if (schedule.includes('wed') || schedule.includes('wednesday')) days.push(3)
      if (schedule.includes('thu') || schedule.includes('thursday')) days.push(4)
      if (schedule.includes('fri') || schedule.includes('friday')) days.push(5)
      if (schedule.includes('sat') || schedule.includes('saturday')) days.push(6)
      if (schedule.includes('sun') || schedule.includes('sunday')) days.push(0)

      // If no specific days found, default to weekdays
      if (days.length === 0) {
        days.push(1, 2, 3, 4, 5) // Monday to Friday
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      for (let i = 0; i < 30; i++) {
        const eventDate = new Date(startDate)
        eventDate.setDate(startDate.getDate() + i)
        const dayOfWeek = eventDate.getDay()

        if (days.includes(dayOfWeek)) {
          events.push({
            id: `${activity.id}-weekly-${i}`,
            title: activity.programName,
            start: `${eventDate.toISOString().split('T')[0]}T${startTime}`,
            end: `${eventDate.toISOString().split('T')[0]}T${endTime}`,
            backgroundColor: getActivityColor(activity.status),
            borderColor: getActivityColor(activity.status),
            textColor: '#ffffff',
            extendedProps: {
              activity: activity
            }
          })
        }
      }

      return events
    }

    // Get activity color based on status
    const getActivityColor = (status) => {
      const colors = {
        'upcoming': '#28a745',
        'completed': '#17a2b8',
        'cancelled': '#dc3545',
        'in-progress': '#ffc107'
      }
      return colors[status] || '#6c757d'
    }

    // Get status badge class
    const getStatusClass = (status) => {
      const classes = {
        'upcoming': 'bg-success',
        'completed': 'bg-info',
        'cancelled': 'bg-danger',
        'in-progress': 'bg-warning'
      }
      return classes[status] || 'bg-secondary'
    }

    // Handle event click
    const handleEventClick = (clickInfo) => {
      selectedActivity.value = clickInfo.event.extendedProps.activity
      // Use Bootstrap modal if available, otherwise use native modal
      const modalElement = document.getElementById('activityModal')
      if (modalElement && window.bootstrap) {
        const modal = new window.bootstrap.Modal(modalElement)
        modal.show()
      } else if (modalElement) {
        modalElement.style.display = 'block'
        modalElement.classList.add('show')
      }
    }

    // Leave activity
    const leaveActivity = async () => {
      if (!selectedActivity.value) return

      if (confirm(`Are you sure you want to leave ${selectedActivity.value.programName}?`)) {
        try {
          const result = await removeUserActivity(session.value.userId, selectedActivity.value.programId)

          if (result.success) {
            // Remove from local array
            const index = userActivities.value.findIndex(a => a.id === selectedActivity.value.id)
            if (index > -1) {
              userActivities.value.splice(index, 1)
            }

            // Close modal
            const modalElement = document.getElementById('activityModal')
            if (modalElement && window.bootstrap) {
              const modal = window.bootstrap.Modal.getInstance(modalElement)
              if (modal) modal.hide()
            } else if (modalElement) {
              modalElement.style.display = 'none'
              modalElement.classList.remove('show')
            }

            alert('Successfully left the activity!')
          } else {
            alert('Failed to leave activity: ' + result.message)
          }
        } catch (error) {
          console.error('Error leaving activity:', error)
          alert('Error leaving activity: ' + error.message)
        }
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

    // Computed properties
    const upcomingCount = computed(() => {
      return userActivities.value.filter(activity => activity.status === 'upcoming').length
    })

    const completedCount = computed(() => {
      return userActivities.value.filter(activity => activity.status === 'completed').length
    })

    const thisMonthCount = computed(() => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      return userActivities.value.filter(activity => {
        const activityDate = new Date(activity.joinedDate)
        return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear
      }).length
    })

    const recentActivities = computed(() => {
      return [...userActivities.value]
        .sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate))
        .slice(0, 5)
    })

    // Watch for session changes
    const updateSession = () => {
      const newSession = getSession()
      session.value = newSession
      if (newSession) {
        loadActivities()
      } else {
        userActivities.value = []
      }
    }

    onMounted(() => {
      if (session.value) {
        loadActivities()
      }

      // Listen for login/logout events
      window.addEventListener('userLoggedIn', updateSession)
      window.addEventListener('userLoggedOut', updateSession)
    })

    onUnmounted(() => {
      window.removeEventListener('userLoggedIn', updateSession)
      window.removeEventListener('userLoggedOut', updateSession)
    })

    return {
      calendar,
      session,
      userActivities,
      selectedActivity,
      isLoading,
      calendarOptions,
      upcomingCount,
      completedCount,
      thisMonthCount,
      recentActivities,
      handleEventClick,
      leaveActivity,
      formatDate,
      getStatusClass
    }
  }
}
</script>

<style scoped>
.activities-calendar {
  padding: 20px 0;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: none;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.card-header h4,
.card-header h5,
.card-header h6 {
  margin: 0;
}

.stats-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.stats-item:last-child {
  border-bottom: none;
}

.activity-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 20px;
  text-align: center;
}

.activity-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-close {
  filter: invert(1);
}

.fc-event {
  cursor: pointer;
}

.fc-event:hover {
  opacity: 0.8;
}

.badge {
  font-size: 0.75rem;
}
</style>
