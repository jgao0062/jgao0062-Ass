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
            <button class="btn btn-sm btn-outline-primary" @click="exportUsers">Export</button>
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id">
                    <td>{{ user.firstName }} {{ user.lastName }}</td>
                    <td>{{ user.email }}</td>
                    <td><span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-primary'">{{ user.role }}</span></td>
                    <td>{{ formatDate(user.id) }}</td>
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getSession, getAllUsers, getRatings } from '../utils/auth.js'

export default {
  name: 'AdminPage',
  setup() {
    const session = getSession()
    const users = ref([])
    const registrations = ref([])
    const ratings = ref({})

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
      exportRatings
    }
  }
}
</script>


