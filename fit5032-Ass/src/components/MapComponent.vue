<template>
  <div class="map-container">
    <!-- Map Controls -->
    <div class="map-controls mb-3">
      <div class="row">
        <div class="col-md-6">
          <div class="input-group">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Search Melbourne sports facilities..."
              @keyup.enter="searchPlaces"
            >
            <button class="btn btn-primary" @click="searchPlaces">
              <i class="fas fa-search"></i> Search
            </button>
          </div>
        </div>
        <div class="col-md-6">
          <button class="btn btn-success me-2" @click="getCurrentLocation">
            <i class="fas fa-location-arrow"></i> My Location
          </button>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div id="map" class="map-view"></div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="search-results mt-3">
      <h5><i class="fas fa-search"></i> Search Results</h5>
      <div class="row">
        <div
          v-for="place in searchResults"
          :key="place.place_id"
          class="col-md-6 mb-3"
        >
          <div class="card">
            <div class="card-body">
              <h6 class="card-title">{{ place.name }}</h6>
              <p class="card-text">{{ place.formatted_address }}</p>
              <div class="btn-group" role="group">
                <button
                  class="btn btn-sm btn-primary"
                  @click="goToPlace(place)"
                >
                  <i class="fas fa-eye"></i> View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading map...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { GOOGLE_MAPS_CONFIG, MAP_DEFAULTS } from '../config/maps.js'

export default {
  name: 'MapComponent',
  setup() {
    const map = ref(null)
    const searchQuery = ref('')
    const searchResults = ref([])
    const isLoading = ref(true)
    const currentLocation = ref(null)
    const directionsService = ref(null)
    const directionsRenderer = ref(null)
    const placesService = ref(null)
    const geocoder = ref(null)
    const markers = ref([])

    const initMap = () => {
      try {
        isLoading.value = true
        console.log('Starting map initialization with traditional API...')

        // Initialize map
        map.value = new google.maps.Map(document.getElementById('map'), {
          center: MAP_DEFAULTS.center,
          zoom: MAP_DEFAULTS.zoom,
          mapTypeId: 'roadmap'
        })

        // Initialize services
        placesService.value = new google.maps.places.PlacesService(map.value)
        geocoder.value = new google.maps.Geocoder()
        directionsService.value = new google.maps.DirectionsService()
        directionsRenderer.value = new google.maps.DirectionsRenderer({
          draggable: true,
          map: map.value,
          suppressMarkers: false
        })

        // Add map click event
        map.value.addListener('click', (event) => {
          addMarker(event.latLng, 'Clicked Location', 'blue')
        })

        // Don't auto-load Melbourne sports places - let user search instead
        // loadMelbourneSportsPlaces()

        isLoading.value = false
        console.log('Map initialized successfully')
      } catch (error) {
        console.error('Map initialization failed:', error)
        isLoading.value = false
        alert('Failed to load Google Maps. Error: ' + error.message)
      }
    }

    // Feature 1: Search places
    const searchPlaces = () => {
      console.log('Search places clicked, query:', searchQuery.value)
      if (!searchQuery.value.trim()) {
        alert('Please enter a search term')
        return
      }

      if (!placesService.value) {
        alert('Places service not available')
        return
      }

      // Clear previous search markers
      clearSearchMarkers()

      const request = {
        query: searchQuery.value,
        fields: ['name', 'geometry', 'formatted_address', 'place_id'],
        location: MAP_DEFAULTS.center,
        radius: 50000 // 50km radius from Melbourne CBD
      }

      placesService.value.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
          searchResults.value = results

          // Add markers for search results
          results.forEach(place => {
            if (place.geometry && place.geometry.location) {
              addMarker(place.geometry.location, place.name, 'red')
            }
          })

          console.log('Search completed:', results.length, 'results found')
        } else {
          console.error('Search failed. Status:', status)
          alert('Search failed. Status: ' + status)
        }
      })
    }

    // Feature 2: Get current location (GPS first, IP fallback)
    const getCurrentLocation = () => {
      console.log('Get current location clicked')

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log('Geolocation not supported, trying IP location...')
        getLocationByIP()
        return
      }

      // Check if we're on HTTPS or localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.log('Not HTTPS/localhost, trying IP location...')
        getLocationByIP()
        return
      }

      console.log('Requesting GPS location...')

      // Try GPS first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // GPS success
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }

          currentLocation.value = pos
          map.value.setCenter(pos)
          map.value.setZoom(15)

          addMarker(pos, 'My Location (GPS)', 'blue')
          console.log('GPS location set:', pos)
          console.log('GPS accuracy:', position.coords.accuracy, 'meters')

          alert(`GPS location found! Latitude: ${pos.lat.toFixed(6)}, Longitude: ${pos.lng.toFixed(6)}\nAccuracy: ${position.coords.accuracy.toFixed(0)} meters`)
        },
        (error) => {
          console.error('GPS location access failed:', error)
          console.log('GPS failed, trying IP-based location as fallback...')

          // GPS failed, try IP as fallback
          getLocationByIP()
        },
        {
          enableHighAccuracy: true, // Try high accuracy GPS first
          timeout: 10000, // 10 seconds timeout for GPS
          maximumAge: 60000 // 1 minute cache
        }
      )
    }

    // Fallback: Get location by IP
    const getLocationByIP = async () => {
      try {
        console.log('Getting location via IP...')
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()

        if (data.latitude && data.longitude) {
          const pos = {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude)
          }

          currentLocation.value = pos
          map.value.setCenter(pos)
          map.value.setZoom(10) // Lower zoom for IP-based location

          addMarker(pos, 'My Location (IP)', 'orange')
          console.log('IP-based location set:', pos)

          alert(`Location found via IP: ${data.city || 'Unknown'}, ${data.country || 'Unknown'}`)
        } else {
          throw new Error('No location data from IP service')
        }
      } catch (error) {
        console.error('IP-based location failed:', error)
        alert('Unable to get location via GPS or IP. Please check your internet connection and try again.')
      }
    }

    // Helper function to add markers
    const addMarker = (position, title, color) => {
      const marker = new google.maps.Marker({
        position: position,
        map: map.value,
        title: title,
        icon: {
          url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
        }
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${title}</strong></div>`
      })

      marker.addListener('click', () => {
        infoWindow.open(map.value, marker)
      })

      markers.value.push(marker)
    }

    const clearSearchMarkers = () => {
      markers.value.forEach(marker => {
        marker.setMap(null)
      })
      markers.value = []
    }

    // Check location permission status
    const checkLocationPermission = () => {
      if (!navigator.geolocation) {
        return
      }

      // Check if permissions API is available
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('Location permission status:', result.state)
        }).catch(() => {
          console.log('Could not check location permission status')
        })
      }
    }

    // Go to place
    const goToPlace = (place) => {
      if (place.geometry && place.geometry.location) {
        map.value.setCenter(place.geometry.location)
        map.value.setZoom(16)

        // Add a temporary marker
        addMarker(place.geometry.location, place.name, 'yellow')

        console.log('Navigated to place:', place.name)
      }
    }

    onMounted(() => {
      console.log('MapComponent mounted, initializing map...')

      // Check location permission status
      checkLocationPermission()

      // Load Google Maps API script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=places,geometry&callback=initGoogleMaps`
      script.async = true
      script.defer = true

      // Global callback function
      window.initGoogleMaps = initMap

      // Error handling
      script.onerror = () => {
        console.error('Failed to load Google Maps API script')
        isLoading.value = false
        alert('Failed to load Google Maps API. Please check your API key.')
      }

      document.head.appendChild(script)
    })

    onUnmounted(() => {
      // Cleanup resources
      if (directionsRenderer.value) {
        directionsRenderer.value.setMap(null)
      }

      // Remove global callback
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps
      }
    })

    return {
      searchQuery,
      searchResults,
      isLoading,
      currentLocation,
      searchPlaces,
      getCurrentLocation,
      goToPlace
    }
  }
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-view {
  height: 600px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.map-controls {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.btn {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
