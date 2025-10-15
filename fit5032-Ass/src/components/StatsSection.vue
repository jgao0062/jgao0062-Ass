<template>
    <section class="stats-section">
      <div class="container">
        <div class="row">
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-number">{{ stats.totalPrograms }}</div>
              <h5>Active Programs</h5>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-number">{{ stats.participants }}</div>
              <h5>Happy Participants</h5>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-number">{{ stats.locations }}</div>
              <h5>Locations</h5>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-number">{{ stats.languages }}</div>
              <h5>Languages Supported</h5>
            </div>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { getAllPrograms } from '../services/userService.js'
  
  export default {
    name: 'StatsSection',
    setup() {
      const stats = ref({
        totalPrograms: 0,
        participants: 0,
        locations: 0,
        languages: 6 // Keep this static as it's not in the programs data
      })

      // BR (B.2): Dynamic Data - Update stats based on Firebase programs data
      const updateStats = async () => {
        try {
          const result = await getAllPrograms()
          if (result.success) {
            const programs = result.data
            stats.value.totalPrograms = programs.length
            stats.value.participants = programs.reduce((total, program) => total + (program.participants || 0), 0)
            
            // Count unique locations
            const uniqueLocations = new Set(programs.map(program => program.location))
            stats.value.locations = uniqueLocations.size
          }
        } catch (error) {
          console.error('Error updating stats:', error)
        }
      }

      onMounted(() => {
        updateStats()
      })

      return {
        stats
      }
    }
  }
  </script>