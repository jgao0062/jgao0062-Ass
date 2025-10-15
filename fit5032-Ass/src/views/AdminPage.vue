<template>
  <div class="container py-5 admin-dashboard">
    <h2 class="mb-4">Admin Dashboard</h2>
    <p class="text-muted">Only users with role <code>admin</code> can see this page.</p>
    <div class="alert alert-info">
      <div>Signed in as: <strong>{{ session?.email }}</strong></div>
      <div>Role: <strong>{{ session?.role }}</strong></div>
    </div>

    <!-- Stats Overview -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">{{ stats.totalUsers }}</h5>
            <p class="card-text">Total Users</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">{{ stats.totalRegistrations }}</h5>
            <p class="card-text">Registrations</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">{{ stats.totalRatings }}</h5>
            <p class="card-text">Total Ratings</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">{{ stats.avgRating.toFixed(1) }}</h5>
            <p class="card-text">Avg Rating</p>
          </div>
        </div>
      </div>
    </div>

    <!-- User Management -->
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">User Accounts</h5>
            <div>
              <button class="btn btn-sm btn-success me-2" @click="showCreateAdmin = true">Create Admin</button>
              <button class="btn btn-sm btn-outline-primary" @click="exportUsers">Export</button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id">
                    <td>{{ user.firstName }} {{ user.lastName }}</td>
                    <td>{{ user.email }}</td>
                    <td><span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-primary'">{{ user.role }}</span></td>
                    <td>{{ formatDate(user.createdAt) }}</td>
                    <td>
                      <button
                        class="btn btn-sm me-1"
                        :class="user.role === 'admin' ? 'btn-outline-warning' : 'btn-outline-success'"
                        @click="toggleUserRole(user.id, user.role)"
                        :disabled="user.id === session?.userId"
                        :title="user.role === 'admin' ? 'Demote to user' : 'Promote to admin'"
                      >
                        <i :class="user.role === 'admin' ? 'fas fa-user-minus' : 'fas fa-user-plus'"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteUserHandler(user.id)"
                        :disabled="user.id === session?.userId"
                        title="Cannot delete yourself"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Registration Data</h5>
            <button class="btn btn-sm btn-outline-primary" @click="exportRegistrations">Export</button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Programs</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reg in registrations.slice(0, 5)" :key="reg.id">
                    <td>{{ reg.firstName }} {{ reg.lastName }}</td>
                    <td>{{ reg.email }}</td>
                    <td>{{ reg.interestedPrograms?.length || 0 }}</td>
                    <td>{{ formatDate(reg.registrationDate) }}</td>
                  </tr>
                </tbody>
              </table>
              <small class="text-muted">Showing latest 5 registrations</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Program Management -->
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Program Management</h5>
            <div>
              <button class="btn btn-sm btn-outline-primary me-2" @click="refreshData" :disabled="loading">
                <i class="fas fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>Refresh
              </button>
              <button class="btn btn-sm btn-success" @click="showAddProgram = true">
                <i class="fas fa-plus me-1"></i>Add Program
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Participants</th>
                    <th>Average Rating</th>
                    <th>Total Ratings</th>
                    <th>Rating Distribution</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="program in paginatedPrograms" :key="program.id">
                    <td>{{ program.id }}</td>
                    <td>{{ program.name }}</td>
                    <td>{{ program.category }}</td>
                    <td>
                      <span class="badge" :class="program.price === 'Free' ? 'bg-success' : 'bg-primary'">
                        {{ program.price }}
                      </span>
                    </td>
                    <td>{{ program.actualParticipants || 0 }}</td>
                    <td>
                      <span class="badge bg-warning">{{ getProgramRatingDisplay(program.id).average }}/5</span>
                    </td>
                    <td>{{ getProgramRatingDisplay(program.id).count }}</td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar" :style="{ width: (getProgramRatingDisplay(program.id).average / 5 * 100) + '%' }"></div>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1" @click="editProgram(program)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteProgramHandler(program.id)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Pagination Controls -->
            <div class="d-flex justify-content-between align-items-center mt-3" v-if="totalPages > 1">
              <div class="text-muted">
                Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage * itemsPerPage, sortedPrograms.length) }} of {{ sortedPrograms.length }} programs
              </div>
              <nav>
                <ul class="pagination pagination-sm mb-0 custom-pagination">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToFirstPage" :disabled="currentPage === 1">
                      <i class="fas fa-angle-double-left"></i>
                    </button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPreviousPage" :disabled="currentPage === 1">
                      <i class="fas fa-angle-left"></i>
                    </button>
                  </li>
                  
                  <!-- Page numbers -->
                  <li v-for="page in getVisiblePages()" :key="page" class="page-item" :class="{ active: page === currentPage }">
                    <button class="page-link" @click="goToPage(page)">{{ page }}</button>
                  </li>
                  
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToNextPage" :disabled="currentPage === totalPages">
                      <i class="fas fa-angle-right"></i>
                    </button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToLastPage" :disabled="currentPage === totalPages">
                      <i class="fas fa-angle-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rating Analytics -->
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Rating Analytics Summary</h5>
            <button class="btn btn-sm btn-outline-primary" @click="exportRatings">Export Ratings</button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-primary">{{ stats.totalRatings }}</h4>
                  <p class="text-muted mb-0">Total Ratings</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-success">{{ stats.avgRating.toFixed(1) }}/5</h4>
                  <p class="text-muted mb-0">Average Rating</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-info">{{ programs.length }}</h4>
                  <p class="text-muted mb-0">Total Programs</p>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h4 class="text-warning">{{ programsWithRatings }}</h4>
                  <p class="text-muted mb-0">Programs with Ratings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Admin Modal -->
    <div class="modal fade" :class="{ 'show': showCreateAdmin }" :style="{ display: showCreateAdmin ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Admin</h5>
            <button type="button" class="btn-close" @click="showCreateAdmin = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createAdmin">
              <div class="mb-3">
                <label class="form-label">First Name</label>
                <input type="text" class="form-control" v-model="newAdmin.firstName" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Last Name</label>
                <input type="text" class="form-control" v-model="newAdmin.lastName" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" v-model="newAdmin.email" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" v-model="newAdmin.password" required>
              </div>
              <div v-if="createAdminError" class="alert alert-danger">{{ createAdminError }}</div>
              <div v-if="createAdminSuccess" class="alert alert-success">{{ createAdminSuccess }}</div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateAdmin = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="createAdmin" :disabled="creatingAdmin">
              <span v-if="creatingAdmin" class="spinner-border spinner-border-sm me-2"></span>
              Create Admin
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateAdmin" class="modal-backdrop fade show"></div>

    <!-- Add/Edit Program Modal -->
    <div class="modal fade" :class="{ 'show': showAddProgram }" :style="{ display: showAddProgram ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingProgram ? 'Edit Program' : 'Add New Program' }}</h5>
            <button type="button" class="btn-close" @click="closeProgramModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveProgram">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Program Name</label>
                    <input type="text" class="form-control" v-model="programForm.name" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Category</label>
                    <select class="form-select" v-model="programForm.category" required>
                      <option value="">Select Category</option>
                      <option value="Team Sports">Team Sports</option>
                      <option value="Individual">Individual</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Wellness">Wellness</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Price</label>
                    <select class="form-select" v-model="programForm.price" required>
                      <option value="">Select Price</option>
                      <option value="Free">Free</option>
                      <option value="$10">$10</option>
                      <option value="$15">$15</option>
                      <option value="$20">$20</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Participants</label>
                    <input type="number" class="form-control" v-model="programForm.participants" min="0" required>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" v-model="programForm.description" rows="3" required></textarea>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Schedule</label>
                    <input type="text" class="form-control" v-model="programForm.schedule" placeholder="e.g., Mon, Wed, Fri 6-8 PM" required>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-control" v-model="programForm.location" placeholder="e.g., Melbourne Sports Center" required>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Difficulty</label>
                    <select class="form-select" v-model="programForm.difficulty" required>
                      <option value="">Select Difficulty</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
              <div v-if="programError" class="alert alert-danger">{{ programError }}</div>
              <div v-if="programSuccess" class="alert alert-success">{{ programSuccess }}</div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeProgramModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveProgram" :disabled="savingProgram">
              <span v-if="savingProgram" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingProgram ? 'Update Program' : 'Add Program' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAddProgram" class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { getSession, registerUser } from '../utils/auth.js'
import { 
  getAllUsers,
  getAllUserRegistrations, 
  getAllPrograms, 
  addProgram, 
  updateProgram, 
  deleteProgram,
  getAllActivities,
  getProgramAverageRating,
  deleteUser,
  updateUserRole
} from '../services/userService.js'
import { programsData } from '../data/programs.js'

export default {
  name: 'AdminPage',
  setup() {
    const session = getSession()
    
    // Check if user is admin
    if (!session || session.role !== 'admin') {
      // Redirect to home page if not admin
      window.location.href = '/'
      return
    }
    const users = ref([])
    const registrations = ref([])
    const ratings = ref({})
    const programs = ref([])
    const loading = ref(false)
    const showCreateAdmin = ref(false)
    const creatingAdmin = ref(false)
    const createAdminError = ref('')
    const createAdminSuccess = ref('')
    const newAdmin = ref({
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    })

    // Program management states
    const showAddProgram = ref(false)
    const editingProgram = ref(null)
    const savingProgram = ref(false)
    const programError = ref('')
    const programSuccess = ref('')
    const programForm = ref({
      name: '',
      category: '',
      price: '',
      participants: 0,
      description: '',
      schedule: '',
      location: '',
      difficulty: ''
    })

    // Pagination states
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const totalPages = ref(1)

    // Computed properties for sorting and pagination
    const sortedPrograms = computed(() => {
      return [...programs.value].sort((a, b) => {
        // Sort by ID in ascending order
        return parseInt(a.id) - parseInt(b.id)
      })
    })

    const paginatedPrograms = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage.value
      const endIndex = startIndex + itemsPerPage.value
      return sortedPrograms.value.slice(startIndex, endIndex)
    })

    // Update total pages when programs change
    watch(sortedPrograms, (newPrograms) => {
      totalPages.value = Math.ceil(newPrograms.length / itemsPerPage.value)
      // Reset to first page if current page is out of range
      if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = 1
      }
    }, { immediate: true })

    const loadData = async () => {
      loading.value = true
      try {
        console.log('Loading admin data...')
        
        // Load users from Firebase
        const usersResult = await getAllUsers()
        if (usersResult.success) {
          users.value = usersResult.data
          console.log('Users loaded:', users.value.length)
        }

        // Load registrations from Firebase
        const registrationsResult = await getAllUserRegistrations()
        if (registrationsResult.success) {
          registrations.value = registrationsResult.data
          console.log('Registrations loaded:', registrations.value.length)
        }

        // Load programs from Firebase
        const programsResult = await getAllPrograms()
        if (programsResult.success) {
          programs.value = programsResult.data
          console.log('Programs loaded:', programs.value.length)
        } else {
          // Fallback to local data if Firebase fails
          programs.value = [...programsData]
          console.log('Using fallback programs data:', programs.value.length)
        }

        // Load activities for stats and participant counts
        const activitiesResult = await getAllActivities()
        if (activitiesResult.success) {
          console.log('Activities loaded:', activitiesResult.data.length)
          // Calculate actual participant counts for each program
          const participantCounts = {}
          activitiesResult.data.forEach(activity => {
            const programId = activity.programId
            if (!participantCounts[programId]) {
              participantCounts[programId] = 0
            }
            participantCounts[programId]++
          })
          
          // Update programs with actual participant counts
          programs.value = programs.value.map(program => ({
            ...program,
            actualParticipants: participantCounts[program.id] || 0
          }))
          
          console.log('Participant counts calculated:', participantCounts)
        }

        // Load ratings data
        await loadRatingsData()
        
      } catch (error) {
        console.error('Error loading admin data:', error)
        // Fallback to local data
        programs.value = [...programsData]
        users.value = []
        registrations.value = []
        ratings.value = {}
      } finally {
        loading.value = false
      }
    }

    // Refresh data function
    const refreshData = async () => {
      await loadData()
    }

    // Load ratings data for all programs
    const loadRatingsData = async () => {
      try {
        console.log('Loading ratings data...')
        const programRatings = {}
        
        // Load ratings for each program
        for (const program of programs.value) {
          const ratingResult = await getProgramAverageRating(program.id)
          if (ratingResult) {
            programRatings[program.id] = {
              average: ratingResult.average || 0,
              count: ratingResult.count || 0
            }
          } else {
            programRatings[program.id] = {
              average: 0,
              count: 0
            }
          }
        }
        
        ratings.value = programRatings
        console.log('Ratings data loaded:', programRatings)
      } catch (error) {
        console.error('Error loading ratings data:', error)
        ratings.value = {}
      }
    }

    const stats = computed(() => {
      const totalUsers = users.value.length
      const totalRegistrations = registrations.value.length
      
      // Calculate total ratings and average from the new ratings structure
      let totalRatings = 0
      let totalRatingValue = 0
      
      Object.values(ratings.value).forEach(rating => {
        totalRatings += rating.count || 0
        totalRatingValue += (rating.average || 0) * (rating.count || 0)
      })
      
      const avgRating = totalRatings > 0 ? totalRatingValue / totalRatings : 0
      
      return { totalUsers, totalRegistrations, totalRatings, avgRating }
    })

    const programRatings = computed(() => {
      return Object.entries(ratings.value).map(([programId, ratingData]) => {
        return { 
          programId, 
          average: Math.round((ratingData.average || 0) * 10) / 10, 
          count: ratingData.count || 0 
        }
      })
    })

    const programsWithRatings = computed(() => {
      return Object.keys(ratings.value).length
    })

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A'
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    }

    const exportUsers = () => {
      const csv = [
        ['Name', 'Email', 'Role', 'Joined Date'],
        ...users.value.map(u => [u.firstName + ' ' + u.lastName, u.email, u.role, formatDate(u.createdAt)])
      ].map(row => row.join(',')).join('\n')
      downloadCSV(csv, 'users.csv')
    }

    const exportRegistrations = () => {
      const csv = [
        ['Name', 'Email', 'Phone', 'Age', 'Programs', 'Registration Date'],
        ...registrations.value.map(r => [
          r.firstName + ' ' + r.lastName,
          r.email,
          r.phone,
          r.age,
          r.interestedPrograms?.join(';') || '',
          formatDate(r.registrationDate)
        ])
      ].map(row => row.join(',')).join('\n')
      downloadCSV(csv, 'registrations.csv')
    }

    const exportRatings = () => {
      const csv = [
        ['Program ID', 'User ID', 'Rating', 'Date'],
        ...Object.entries(ratings.value).flatMap(([programId, ratingList]) =>
          ratingList.map(r => [programId, r.userId, r.value, formatDate(r.ts || Date.now())])
        )
      ].map(row => row.join(',')).join('\n')
      downloadCSV(csv, 'ratings.csv')
    }

    const downloadCSV = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    }

    const createAdmin = async () => {
      createAdminError.value = ''
      createAdminSuccess.value = ''
      creatingAdmin.value = true

      try {
        const result = await registerUser({
          firstName: newAdmin.value.firstName,
          lastName: newAdmin.value.lastName,
          email: newAdmin.value.email,
          password: newAdmin.value.password,
          role: 'admin'
        })

        if (result.ok) {
          createAdminSuccess.value = 'Admin created successfully!'
          loadData() // Refresh user list
          // Reset form
          newAdmin.value = { firstName: '', lastName: '', email: '', password: '' }
          setTimeout(() => {
            showCreateAdmin.value = false
            createAdminSuccess.value = ''
          }, 2000)
        } else {
          createAdminError.value = result.message || 'Failed to create admin'
        }
      } catch {
        createAdminError.value = 'An error occurred while creating admin'
      }

      creatingAdmin.value = false
    }

    const deleteUserHandler = async (userId) => {
      if (confirm('Are you sure you want to delete this user? This will permanently remove all user data including registrations, activities, and ratings.')) {
        try {
          const result = await deleteUser(userId)
          if (result.success) {
            // Remove from local array
            const index = users.value.findIndex(u => u.id === userId)
            if (index !== -1) {
              users.value.splice(index, 1)
            }
            alert('User deleted successfully!')
            loadData() // Refresh user list
          } else {
            alert('Error deleting user: ' + result.message)
          }
        } catch (error) {
          alert('Error deleting user: ' + error.message)
        }
      }
    }

    const toggleUserRole = async (userId, currentRole) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      const action = newRole === 'admin' ? 'promote to admin' : 'demote to user'
      
      if (confirm(`Are you sure you want to ${action} this user?`)) {
        try {
          const result = await updateUserRole(userId, newRole)
          if (result.success) {
            // Update local array
            const user = users.value.find(u => u.id === userId)
            if (user) {
              user.role = newRole
            }
            alert(`User ${action} successfully!`)
          } else {
            alert('Error updating user role: ' + result.message)
          }
        } catch (error) {
          alert('Error updating user role: ' + error.message)
        }
      }
    }

    // Program management methods
    const editProgram = (program) => {
      editingProgram.value = program
      programForm.value = { ...program }
      showAddProgram.value = true
    }

    const deleteProgramHandler = async (programId) => {
      if (confirm('Are you sure you want to delete this program? This will also delete all related ratings and activities.')) {
        try {
          const result = await deleteProgram(programId)
          if (result.success) {
            // Remove from local array
            const index = programs.value.findIndex(p => p.id === programId)
            if (index !== -1) {
              programs.value.splice(index, 1)
            }
            programSuccess.value = result.message
            setTimeout(() => {
              programSuccess.value = ''
            }, 3000)
          } else {
            programError.value = result.message
            setTimeout(() => {
              programError.value = ''
            }, 5000)
          }
        } catch (error) {
          programError.value = 'Error deleting program: ' + error.message
          setTimeout(() => {
            programError.value = ''
          }, 5000)
        }
      }
    }

    const saveProgram = async () => {
      programError.value = ''
      programSuccess.value = ''
      savingProgram.value = true

      try {
        if (editingProgram.value) {
          // Update existing program
          const result = await updateProgram(editingProgram.value.id, programForm.value)
          if (result.success) {
            // Update local array
            const index = programs.value.findIndex(p => p.id === editingProgram.value.id)
            if (index !== -1) {
              programs.value[index] = { ...programForm.value, id: editingProgram.value.id }
            }
            programSuccess.value = result.message
          } else {
            programError.value = result.message
          }
        } else {
          // Add new program
          const result = await addProgram(programForm.value)
          if (result.success) {
            // Add to local array
            const newProgram = {
              ...programForm.value,
              id: result.programId
            }
            programs.value.push(newProgram)
            programSuccess.value = result.message
          } else {
            programError.value = result.message
          }
        }

        // Reset form
        resetProgramForm()

        setTimeout(() => {
          showAddProgram.value = false
          programSuccess.value = ''
        }, 2000)
      } catch (error) {
        programError.value = 'Error saving program: ' + error.message
      }

      savingProgram.value = false
    }

    const closeProgramModal = () => {
      showAddProgram.value = false
      editingProgram.value = null
      resetProgramForm()
    }

    const resetProgramForm = () => {
      programForm.value = {
        name: '',
        category: '',
        price: '',
        participants: 0,
        description: '',
        schedule: '',
        location: '',
        difficulty: ''
      }
      programError.value = ''
      programSuccess.value = ''
    }

    // Get program rating data (synchronous version for template)
    const getProgramRatingDisplay = (programId) => {
      const rating = ratings.value[programId]
      if (rating) {
        return {
          average: rating.average || 0,
          count: rating.count || 0
        }
      }
      return { average: 0, count: 0 }
    }

    // Get program rating data (async version for loading)
    const getProgramRating = (programId) => {
      return getProgramAverageRating(programId)
    }

    // Pagination functions
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }

    const goToFirstPage = () => goToPage(1)
    const goToLastPage = () => goToPage(totalPages.value)
    const goToPreviousPage = () => goToPage(currentPage.value - 1)
    const goToNextPage = () => goToPage(currentPage.value + 1)

    // Get visible page numbers for pagination
    const getVisiblePages = () => {
      const pages = []
      const maxVisible = 5 // Show maximum 5 page numbers
      
      if (totalPages.value <= maxVisible) {
        // Show all pages if total pages is less than max visible
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        // Show pages around current page
        let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages.value, start + maxVisible - 1)
        
        // Adjust start if we're near the end
        if (end - start + 1 < maxVisible) {
          start = Math.max(1, end - maxVisible + 1)
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
      }
      
      return pages
    }

    onMounted(() => {
      loadData()
    })

    return {
      session,
      users,
      registrations,
      programs,
      loading,
      stats,
      programRatings,
      programsWithRatings,
      formatDate,
      exportUsers,
      exportRegistrations,
      exportRatings,
      showCreateAdmin,
      newAdmin,
      creatingAdmin,
      createAdminError,
      createAdminSuccess,
      createAdmin,
      deleteUserHandler,
      toggleUserRole,
      // Program management
      showAddProgram,
      editingProgram,
      savingProgram,
      programError,
      programSuccess,
      programForm,
      editProgram,
      deleteProgramHandler,
      saveProgram,
      closeProgramModal,
      getProgramRating,
      getProgramRatingDisplay,
      refreshData,
      // Pagination
      currentPage,
      itemsPerPage,
      totalPages,
      sortedPrograms,
      paginatedPrograms,
      goToPage,
      goToFirstPage,
      goToLastPage,
      goToPreviousPage,
      goToNextPage,
      getVisiblePages
    }
  }
}
</script>

<style scoped>
/* Custom pagination styles to match dark theme */
.custom-pagination .page-link {
  background-color: #2d3748;
  border: 1px solid #4a5568;
  color: #e2e8f0;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
}

.custom-pagination .page-link:hover {
  background-color: #4a5568;
  border-color: #718096;
  color: #ffffff;
}

.custom-pagination .page-item.active .page-link {
  background-color: #3182ce;
  border-color: #3182ce;
  color: #ffffff;
}

.custom-pagination .page-item.disabled .page-link {
  background-color: #1a202c;
  border-color: #2d3748;
  color: #718096;
  cursor: not-allowed;
}

.custom-pagination .page-item.disabled .page-link:hover {
  background-color: #1a202c;
  border-color: #2d3748;
  color: #718096;
}

/* Pagination container styling */
.custom-pagination {
  background-color: #2d3748;
  border-radius: 0.5rem;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-pagination .page-item:not(:last-child) {
  margin-right: 0.25rem;
}

/* Info text styling */
.text-muted {
  color: #a0aec0 !important;
  font-size: 0.875rem;
}
</style>


