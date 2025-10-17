<template>
  <div class="map-page">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="page-header mb-4">
            <h1 class="display-5 fw-bold">
              Melbourne Sports Facilities Map
            </h1>
            <p class="lead">
              Explore Melbourne's sports facilities, and get directions.
            </p>
            <div class="feature-badges">
              <span class="badge bg-primary me-2">Place Search</span>
              <span class="badge bg-success me-2">Current Location</span>
              <span class="badge bg-info me-2">Route Navigation</span>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <MapComponent />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MapComponent from '../components/MapComponent.vue'

export default {
  name: 'MapPage',
  components: {
    MapComponent
  }
}
</script>

<style scoped>
.map-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.page-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.page-header h1 {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.page-header .lead {
  color: rgba(255,255,255,0.9);
  font-size: 1.2rem;
}

.feature-badges {
  margin-top: 20px;
}

.badge {
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: 20px;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }

  .page-header .lead {
    font-size: 1rem;
  }

  .feature-badges .badge {
    font-size: 0.8rem;
    padding: 6px 10px;
    margin-bottom: 5px;
  }
}
</style>
