<template>
    <div>
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg-8">
              <h1 class="display-4 fw-bold mb-4">Get Healthy Through Community Sports</h1>
              <p class="lead mb-4">
                Join Melbourne's most inclusive sports community. Free and affordable programs for everyone,
                regardless of background or fitness level.
              </p>
              <router-link to="/programs" class="btn btn-success btn-lg me-3">
                <i class="fas fa-search"></i> Explore Programs
              </router-link>
              <router-link to="/register" class="btn btn-outline-light btn-lg">
                <i class="fas fa-user-plus"></i> Join Now
              </router-link>
            </div>
            <div class="col-lg-4 text-center">
              <i class="fas fa-users fa-10x text-white opacity-75"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <StatsSection />

      <!-- Featured Programs -->
      <section class="py-5">
        <div class="container">
          <h2 class="text-center mb-5">Featured Programs</h2>
          
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="loading-spinner"></div>
            <p class="mt-3">Loading programs...</p>
          </div>
          
          <!-- Programs Grid -->
          <div v-else class="row">
            <ProgramCard
              v-for="program in featuredPrograms"
              :key="program.id"
              :program="program"
              button-text="Learn More"
              @learn-more="showProgramDetail"
            />
          </div>
        </div>
      </section>

      <!-- Program Detail Modal -->
      <ProgramDetailModal
        :show="showModal"
        :program="selectedProgram"
        @close="closeModal"
      />
    </div>
  </template>

  <script>
  import { computed, ref, onMounted } from 'vue'
  import StatsSection from '../components/StatsSection.vue'
  import ProgramCard from '../components/ProgramCardComponent.vue'
  import ProgramDetailModal from '../components/ProgramDetailModal.vue'
  import { getAllPrograms } from '../services/userService.js'

  export default {
    name: 'HomePage',
    components: {
      StatsSection,
      ProgramCard,
      ProgramDetailModal
    },
    setup() {
      const showModal = ref(false)
      const selectedProgram = ref(null)
      const programs = ref([])
      const isLoading = ref(true)

      // Load programs from Firebase
      const loadPrograms = async () => {
        try {
          isLoading.value = true
          const result = await getAllPrograms()
          if (result.success) {
            programs.value = result.data
          }
        } catch (error) {
          console.error('Error loading programs from Firebase:', error)
        } finally {
          isLoading.value = false
        }
      }

      // BR (B.2): Dynamic Data - Featured programs from Firebase
      const featuredPrograms = computed(() => {
        return [...programs.value]
          .sort((a, b) => (b.participants || 0) - (a.participants || 0))
          .slice(0, 3)
      })

      const showProgramDetail = (program) => {
        selectedProgram.value = program
        showModal.value = true
      }

      const closeModal = () => {
        showModal.value = false
        selectedProgram.value = null
      }

      onMounted(() => {
        loadPrograms()
      })

      return {
        featuredPrograms,
        showModal,
        selectedProgram,
        showProgramDetail,
        closeModal,
        isLoading
      }
    }
  }
  </script>
