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
                    <td>{{ formatDate(user.id) }}</td>
                    <td>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteUser(user.id)"
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
            <button class="btn btn-sm btn-success" @click="showAddProgram = true">
              <i class="fas fa-plus me-1"></i>Add Program
            </button>
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
                  <tr v-for="program in programs" :key="program.id">
                    <td>{{ program.id }}</td>
                    <td>{{ program.name }}</td>
                    <td>{{ program.category }}</td>
                    <td>
                      <span class="badge" :class="program.price === 'Free' ? 'bg-success' : 'bg-primary'">
                        {{ program.price }}
                      </span>
                    </td>
                    <td>{{ program.participants }}</td>
                    <td>
                      <span class="badge bg-warning">{{ getProgramRating(program.id).average }}/5</span>
                    </td>
                    <td>{{ getProgramRating(program.id).count }}</td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar" :style="{ width: (getProgramRating(program.id).average / 5 * 100) + '%' }"></div>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1" @click="editProgram(program)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteProgram(program.id)">
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
import { ref, computed, onMounted } from 'vue'
import { getSession, getAllUsers, getRatings, registerUser, deleteUser as deleteUserAuth, getProgramAverageRating } from '../utils/auth.js'
import { programsData } from '../data/programs.js'

export default {
  name: 'AdminPage',
  setup() {
    const session = getSession()
    const users = ref([])
    const registrations = ref([])
    const ratings = ref({})
    const programs = ref([])
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
      location: ''
    })

    const loadData = () => {
      users.value = getAllUsers()
      registrations.value = JSON.parse(localStorage.getItem('registrations') || '[]')
      ratings.value = getRatings()
      programs.value = [...programsData]
    }

    const stats = computed(() => {
      const totalUsers = users.value.length
      const totalRegistrations = registrations.value.length
      const allRatings = Object.values(ratings.value).flat()
      const totalRatings = allRatings.length
      const avgRating = totalRatings > 0 ? allRatings.reduce((sum, r) => sum + r.value, 0) / totalRatings : 0
      return { totalUsers, totalRegistrations, totalRatings, avgRating }
    })

    const programRatings = computed(() => {
      return Object.entries(ratings.value).map(([programId, ratingList]) => {
        const average = ratingList.length > 0 ? ratingList.reduce((sum, r) => sum + r.value, 0) / ratingList.length : 0
        return { programId, average: Math.round(average * 10) / 10, count: ratingList.length }
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
        ...users.value.map(u => [u.firstName + ' ' + u.lastName, u.email, u.role, formatDate(u.id)])
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

    const deleteUser = (userId) => {
      if (confirm('Are you sure you want to delete this user?')) {
        const result = deleteUserAuth(userId)
        if (result.ok) {
          loadData() // Refresh user list
        }
      }
    }

    // Program management methods
    const editProgram = (program) => {
      editingProgram.value = program
      programForm.value = { ...program }
      showAddProgram.value = true
    }

    const deleteProgram = (programId) => {
      if (confirm('Are you sure you want to delete this program?')) {
        const index = programs.value.findIndex(p => p.id === programId)
        if (index !== -1) {
          programs.value.splice(index, 1)
          // In a real app, you would save to backend here
          programSuccess.value = 'Program deleted successfully'
          setTimeout(() => {
            programSuccess.value = ''
          }, 3000)
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
          const index = programs.value.findIndex(p => p.id === editingProgram.value.id)
          if (index !== -1) {
            programs.value[index] = { ...programForm.value, id: editingProgram.value.id }
          }
          programSuccess.value = 'Program updated successfully!'
        } else {
          // Add new program
          const newProgram = {
            ...programForm.value,
            id: Math.max(...programs.value.map(p => p.id)) + 1
          }
          programs.value.push(newProgram)
          programSuccess.value = 'Program added successfully!'
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
        location: ''
      }
      programError.value = ''
      programSuccess.value = ''
    }

    // Get program rating data
    const getProgramRating = (programId) => {
      return getProgramAverageRating(programId)
    }

    onMounted(() => {
      loadData()
    })

    return {
      session,
      users,
      registrations,
      programs,
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
      deleteUser,
      // Program management
      showAddProgram,
      editingProgram,
      savingProgram,
      programError,
      programSuccess,
      programForm,
      editProgram,
      deleteProgram,
      saveProgram,
      closeProgramModal,
      getProgramRating
    }
  }
}
</script>


