<template>
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="card program-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h5 class="card-title">{{ program.name }}</h5>
            <span
              class="badge"
              :class="program.price === 'Free' ? 'bg-success' : 'bg-primary'"
            >
              {{ program.price }}
            </span>
          </div>
          <p class="card-text">{{ program.description }}</p>

          <!-- BR (C.3): Rating - Display rating component -->
          <div class="mb-3">
            <RatingComponent
              :program-id="program.id"
              :show-user-rating="true"
              :show-summary="false"
            />
          </div>

          <div class="mb-3">
            <small class="text-muted">
              <i class="fas fa-tag"></i> {{ program.category }}<br>
              <i class="fas fa-clock"></i> {{ program.schedule }}<br>
              <i class="fas fa-map-marker-alt"></i> {{ program.location }}<br>
              <i class="fas fa-users"></i> {{ program.participants }} participants
            </small>
          </div>
          <button
            class="btn"
            :class="getButtonClass()"
            @click="handleButtonClick"
            :disabled="isAdmin && buttonText === 'Join Program'"
          >
            {{ getButtonText() }}
          </button>
        </div>
      </div>
    </div>
  </template>

  <script>
  import { inject, computed } from 'vue'
  import RatingComponent from './RatingComponent.vue'
  import { getSession } from '../utils/auth.js'

  export default {
    name: 'ProgramCard',
    components: {
      RatingComponent
    },
    props: {
      program: {
        type: Object,
        required: true
      },
      buttonText: {
        type: String,
        default: 'Learn More'
      }
    },
    emits: ['learn-more', 'join-program'],
    setup(props, { emit }) {
      const selectProgram = inject('selectProgram')
      const session = getSession()

      // Check if current user is admin
      const isAdmin = computed(() => {
        return session && session.role === 'admin'
      })

      const getButtonText = () => {
        if (props.buttonText === 'Join Program' && isAdmin.value) {
          return 'Admin Only'
        }
        return props.buttonText
      }

      const getButtonClass = () => {
        if (props.buttonText === 'Join Program' && isAdmin.value) {
          return 'btn-secondary'
        }
        return 'btn-primary'
      }

      const handleButtonClick = () => {
        if (props.buttonText === 'Learn More') {
          emit('learn-more', props.program)
        } else if (props.buttonText === 'Join Program' && !isAdmin.value) {
          emit('join-program', props.program)
        } else {
          // Fallback to old behavior
          if (selectProgram) {
            selectProgram(props.program)
          }
        }
      }

      return {
        selectProgram,
        handleButtonClick,
        isAdmin,
        getButtonText,
        getButtonClass
      }
    }
  }
  </script>
