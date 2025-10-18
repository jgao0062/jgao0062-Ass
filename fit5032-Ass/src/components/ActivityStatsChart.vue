<template>
  <div class="activity-stats-chart">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Program Popularity Statistics</h5>
        <div>
          <button class="btn btn-sm btn-outline-primary me-2" @click="refreshData" :disabled="loading">
            <i class="fas fa-sync-alt me-1" :class="{ 'fa-spin': loading }"></i>Refresh
          </button>
          <button class="btn btn-sm btn-outline-success" @click="exportChart">
            <i class="fas fa-download me-1"></i>Export
          </button>
        </div>
      </div>
      <div class="card-body">
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading statistics...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
        </div>

        <!-- Chart container -->
        <div v-else-if="chartData" class="chart-container">
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="text-center">
                <h4 class="text-primary">{{ stats.totalActivities }}</h4>
                <p class="text-muted mb-0">Total Activities</p>
              </div>
            </div>
            <div class="col-md-6">
              <div class="text-center">
                <h4 class="text-success">{{ stats.programStats.length }}</h4>
                <p class="text-muted mb-0">Participating Programs</p>
              </div>
            </div>
          </div>

          <!-- Chart canvas -->
          <div class="chart-wrapper">
            <canvas ref="chartCanvas" width="400" height="400"></canvas>
            <!-- Debug info -->
            <div v-if="chartData" class="mt-2 text-center text-muted small">
              Debug: Chart data loaded with {{ chartData.labels?.length || 0 }} labels
            </div>
          </div>

          <!-- Stats table -->
          <div class="mt-4">
            <h6>Detailed Statistics</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Program Name</th>
                    <th>Participation Count</th>
                    <th>Percentage</th>
                    <th>Progress Bar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stat, index) in stats.programStats" :key="stat.programId">
                    <td>
                      <span class="badge" :class="getRankBadgeClass(index)">
                        {{ index + 1 }}
                      </span>
                    </td>
                    <td>{{ stat.programName }}</td>
                    <td>{{ stat.count }}</td>
                    <td>{{ getPercentage(stat.count) }}%</td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div
                          class="progress-bar"
                          :style="{
                            width: getPercentage(stat.count) + '%',
                            backgroundColor: chartColors[index % chartColors.length]
                          }"
                        ></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No data state -->
        <div v-else class="text-center py-4">
          <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
          <p class="text-muted">No activity data available</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'ActivityStatsChart',
  setup() {
    const chartCanvas = ref(null)
    const chartInstance = ref(null)
    const loading = ref(false)
    const error = ref('')
    const chartData = ref(null)
    const stats = ref({
      totalActivities: 0,
      programStats: []
    })

    const chartColors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#FF6384',
      '#C9CBCF',
      '#4BC0C0',
      '#FF6384'
    ]

    // Fetch data from cloud function
    const fetchActivityStats = async () => {
      loading.value = true
      error.value = ''

      try {
        // Get the cloud function URL
        const functionUrl = 'https://us-central1-fit5032-ass-39937.cloudfunctions.net/getActivityStats'

        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          console.log('Chart data received:', result.data.chartData)
          chartData.value = result.data.chartData
          stats.value = {
            totalActivities: result.data.totalActivities,
            programStats: result.data.programStats
          }

          // Create chart after data is loaded
          await nextTick()
          console.log('Creating chart with canvas:', chartCanvas.value)
          // Add a small delay to ensure DOM is fully updated
          setTimeout(() => {
            createChart()
          }, 100)
        } else {
          throw new Error(result.error || 'Failed to fetch activity stats')
        }
      } catch (err) {
        console.error('Error fetching activity stats:', err)
        error.value = err.message || 'Failed to fetch statistics'
      } finally {
        loading.value = false
      }
    }

    // Create Chart.js chart
    const createChart = () => {
      console.log('createChart called with:', { canvas: chartCanvas.value, data: chartData.value })

      if (!chartCanvas.value) {
        console.log('Canvas not ready, retrying in 200ms...')
        setTimeout(() => {
          createChart()
        }, 200)
        return
      }

      if (!chartData.value) {
        console.log('Chart data not ready')
        return
      }

      // Destroy existing chart
      if (chartInstance.value) {
        chartInstance.value.destroy()
      }

      const ctx = chartCanvas.value.getContext('2d')
      console.log('Canvas context:', ctx)

      try {
        chartInstance.value = new Chart(ctx, {
          type: 'doughnut',
          data: chartData.value,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || ''
                    const value = context.parsed
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const percentage = ((value / total) * 100).toFixed(1)
                    return `${label}: ${value} times (${percentage}%)`
                  }
                }
              }
            },
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 1000
            }
          }
        })
        console.log('Chart created successfully:', chartInstance.value)
      } catch (error) {
        console.error('Error creating chart:', error)
      }
    }

    // Refresh data
    const refreshData = () => {
      fetchActivityStats()
    }

    // Export chart as image
    const exportChart = () => {
      if (chartInstance.value) {
        const url = chartInstance.value.toBase64Image()
        const link = document.createElement('a')
        link.download = 'activity-stats-chart.png'
        link.href = url
        link.click()
      }
    }

    // Get percentage
    const getPercentage = (count) => {
      if (stats.value.totalActivities === 0) return 0
      return ((count / stats.value.totalActivities) * 100).toFixed(1)
    }

    // Get rank badge class
    const getRankBadgeClass = (index) => {
      if (index === 0) return 'bg-warning' // Gold
      if (index === 1) return 'bg-secondary' // Silver
      if (index === 2) return 'bg-danger' // Bronze
      return 'bg-primary'
    }

    // Watch for chartData changes and create chart when ready
    watch(chartData, (newData) => {
      if (newData && chartCanvas.value) {
        console.log('Chart data changed, creating chart...')
        setTimeout(() => {
          createChart()
        }, 100)
      }
    })

    // Load data on mount
    onMounted(() => {
      fetchActivityStats()
    })

    // Cleanup on unmount
    onUnmounted(() => {
      if (chartInstance.value) {
        chartInstance.value.destroy()
      }
    })

    return {
      chartCanvas,
      loading,
      error,
      chartData,
      stats,
      chartColors,
      fetchActivityStats,
      refreshData,
      exportChart,
      getPercentage,
      getRankBadgeClass
    }
  }
}
</script>

<style scoped>
.chart-container {
  min-height: 400px;
}

.chart-wrapper {
  position: relative;
  height: 400px;
  margin: 20px 0;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 20px;
}

.chart-wrapper canvas {
  max-width: 100%;
  max-height: 100%;
}

.table-responsive {
  max-height: 300px;
  overflow-y: auto;
}

.progress {
  background-color: #e9ecef;
}

.progress-bar {
  transition: width 0.6s ease;
}

.badge {
  font-size: 0.75em;
}

/* Dark theme adjustments */
.table {
  color: #e2e8f0;
}

.table th {
  border-color: #4a5568;
  background-color: #2d3748;
}

.table td {
  border-color: #4a5568;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(255, 255, 255, 0.05);
}

.text-muted {
  color: #a0aec0 !important;
}
</style>
