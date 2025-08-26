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
  import { statsData, programsData } from '../data/programs.js'
  
  export default {
    name: 'StatsSection',
    setup() {
      const stats = ref({ ...statsData })
  
      // BR (B.2): Dynamic Data - Update stats based on programs data
      const updateStats = () => {
        stats.value.totalPrograms = programsData.length
        stats.value.participants = programsData.reduce((total, program) => total + program.participants, 0)
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