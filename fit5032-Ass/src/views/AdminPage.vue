<template>
  <div class="container py-5">
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

    <!-- Rating Analytics -->
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Program Ratings</h5>
            <button class="btn btn-sm btn-outline-primary" @click="exportRatings">Export</button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Program ID</th>
                    <th>Average Rating</th>
                    <th>Total Ratings</th>
                    <th>Rating Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rating in programRatings" :key="rating.programId">
                    <td>Program {{ rating.programId }}</td>
                    <td>
                      <span class="badge bg-warning">{{ rating.average }}/5</span>
                    </td>
                    <td>{{ rating.count }}</td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar" :style="{ width: (rating.average / 5 * 100) + '%' }"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getSession, getAllUsers, getRatings, registerUser, deleteUser as deleteUserAuth } from '../utils/auth.js'

export default {
  name: 'AdminPage',
  setup() {
    const session = getSession()
    const users = ref([])
    const registrations = ref([])
    const ratings = ref({})
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

    const loadData = () => {
      users.value = getAllUsers()
      registrations.value = JSON.parse(localStorage.getItem('registrations') || '[]')
      ratings.value = getRatings()
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

    onMounted(() => {
      loadData()
    })

    return {
      session,
      users,
      registrations,
      stats,
      programRatings,
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
      deleteUser
    }
  }
}
</script>


