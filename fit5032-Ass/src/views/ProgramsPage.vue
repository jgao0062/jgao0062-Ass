<template>
    <div class="container py-5">
      <h2 class="text-center mb-5">All Sports Programs</h2>

      <!-- Filter Section -->
      <div class="program-filter">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Search Programs</label>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Search by name or type..."
            >
          </div>
          <div class="col-md-4">
            <label class="form-label">Filter by Type</label>
            <select class="form-select" v-model="selectedCategory">
              <option value="">All Categories</option>
              <option value="Team Sports">Team Sports</option>
              <option value="Individual">Individual</option>
              <option value="Fitness">Fitness</option>
              <option value="Wellness">Wellness</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Filter by Price</label>
            <select class="form-select" v-model="selectedPrice">
              <option value="">All Prices</option>
              <option value="Free">Free</option>
              <option value="$10">$10</option>
              <option value="$15">$15</option>
              <option value="$20">$20</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Programs Grid -->
      <div class="row" v-if="!isLoading">
        <ProgramCard
          v-for="program in filteredPrograms"
          :key="program.id"
          :program="program"
          button-text="Join Program"
        />
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="loading-spinner"></div>
        <p class="mt-3">Loading programs...</p>
      </div>

      <!-- No Results -->
      <div v-if="!isLoading && filteredPrograms.length === 0" class="text-center py-5">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <h5>No programs found</h5>
        <p class="text-muted">Try adjusting your search criteria.</p>
      </div>
    </div>
  </template>

  <script>
  import { ref, computed, onMounted } from 'vue'
  import ProgramCard from '../components/ProgramCard.vue'
  import { programsData } from '../data/programs.js'

  export default {
    name: 'ProgramsPage',
    components: {
      ProgramCard
    },
    setup() {
      const isLoading = ref(false)
      const searchQuery = ref('')
      const selectedCategory = ref('')
      const selectedPrice = ref('')

      // BR (B.2): Dynamic Data - Filterable programs from data structure
      const filteredPrograms = computed(() => {
        let filtered = [...programsData]

        // Search filter
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          filtered = filtered.filter(program =>
            program.name.toLowerCase().includes(query) ||
            program.category.toLowerCase().includes(query) ||
            program.description.toLowerCase().includes(query)
          )
        }

        // Category filter
        if (selectedCategory.value) {
          filtered = filtered.filter(program =>
            program.category === selectedCategory.value
          )
        }

        // Price filter
        if (selectedPrice.value) {
          filtered = filtered.filter(program =>
            program.price === selectedPrice.value
          )
        }

        return filtered
      })

      // Simulate loading when entering the page
      onMounted(() => {
        isLoading.value = true
        setTimeout(() => {
          isLoading.value = false
        }, 800)
      })

      return {
        isLoading,
        searchQuery,
        selectedCategory,
        selectedPrice,
        filteredPrograms
      }
    }
  }
  </script>
