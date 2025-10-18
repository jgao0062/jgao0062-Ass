<template>
  <div class="activities-page">
    <div class="container-fluid">
      <!-- Page Title -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="page-header">
            <h1 class="display-4 text-center mb-3">
              <i class="fas fa-calendar-check"></i> My Activities Calendar
            </h1>
            <p class="lead text-center text-muted">
              View all your joined activities and programs in a beautiful calendar view
            </p>
          </div>
        </div>
      </div>

      <!-- Activities Calendar Component -->
      <AppointmentBookingComponent />
    </div>
  </div>
</template>

<script>
import AppointmentBookingComponent from '../components/AppointmentBookingComponent.vue'

export default {
  name: 'ActivitiesPage',
  components: {
    AppointmentBookingComponent
  },
  setup() {
    return {}
  }
}
</script>

<style scoped>
.activities-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px 0;
}

.page-header {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.display-4 {
  color: #2c3e50;
  font-weight: 700;
}

.lead {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.fas {
  margin-right: 10px;
  color: #667eea;
}
</style>
