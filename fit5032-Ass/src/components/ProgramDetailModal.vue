<template>
  <div class="modal fade" :class="{ 'show': show }" :style="{ display: show ? 'block' : 'none' }" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ program?.name }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body" v-if="program">
          <div class="row">
            <div class="col-md-6">
              <h6 class="text-primary mb-3">Program Details</h6>
              <p class="mb-3">{{ program.description }}</p>

              <div class="program-info mb-4">
                <div class="info-item mb-2">
                  <i class="fas fa-tag text-primary me-2"></i>
                  <strong>Category:</strong> {{ program.category }}
                </div>
                <div class="info-item mb-2">
                  <i class="fas fa-clock text-primary me-2"></i>
                  <strong>Schedule:</strong> {{ program.schedule }}
                </div>
                <div class="info-item mb-2">
                  <i class="fas fa-map-marker-alt text-primary me-2"></i>
                  <strong>Location:</strong> {{ program.location }}
                </div>
                <div class="info-item mb-2">
                  <i class="fas fa-users text-primary me-2"></i>
                  <strong>Participants:</strong> {{ program.participants }}
                </div>
                <div class="info-item mb-2">
                  <i class="fas fa-dollar-sign text-primary me-2"></i>
                  <strong>Price:</strong>
                  <span class="badge" :class="program.price === 'Free' ? 'bg-success' : 'bg-primary'">
                    {{ program.price }}
                  </span>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <h6 class="text-primary mb-3">Program Rating</h6>
              <RatingComponent
                :program-id="program.id"
                :show-user-rating="true"
                :show-summary="false"
              />

              <div class="mt-4">
                <h6 class="text-primary mb-3">What You'll Learn</h6>
                <ul class="list-unstyled">
                  <li v-for="benefit in programBenefits" :key="benefit" class="mb-2">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    {{ benefit }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
          <router-link to="/programs" class="btn btn-primary" @click="closeModal">
            View All Programs
          </router-link>
        </div>
      </div>
    </div>
  </div>
  <div v-if="show" class="modal-backdrop fade show"></div>
</template>

<script>
import { computed } from 'vue'
import RatingComponent from './RatingComponent.vue'

export default {
  name: 'ProgramDetailModal',
  components: {
    RatingComponent
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    program: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closeModal = () => {
      emit('close')
    }

    // Generate program benefits based on category
    const programBenefits = computed(() => {
      if (!props.program) return []

      const benefits = {
        'Team Sports': [
          'Improve teamwork and communication skills',
          'Build lasting friendships',
          'Enhance physical fitness',
          'Learn strategic thinking'
        ],
        'Individual': [
          'Focus on personal improvement',
          'Build self-discipline',
          'Improve concentration',
          'Set and achieve personal goals'
        ],
        'Fitness': [
          'Build strength and endurance',
          'Improve cardiovascular health',
          'Learn proper exercise techniques',
          'Develop healthy habits'
        ],
        'Wellness': [
          'Reduce stress and anxiety',
          'Improve mental health',
          'Learn relaxation techniques',
          'Enhance overall well-being'
        ]
      }

      return benefits[props.program.category] || [
        'Improve physical fitness',
        'Meet new people',
        'Learn new skills',
        'Have fun and stay active'
      ]
    })

    return {
      closeModal,
      programBenefits
    }
  }
}
</script>

<style scoped>
.program-info .info-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.program-info .info-item:last-child {
  border-bottom: none;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.modal-header {
  border-bottom: 1px solid var(--border-color);
}

.modal-footer {
  border-top: 1px solid var(--border-color);
}

.btn-close {
  filter: invert(1);
}
</style>
