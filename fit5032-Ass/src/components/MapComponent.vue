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
          <button class="btn btn-warning me-2" @click="clearDirections">
            <i class="fas fa-times"></i> Clear Directions
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

        // Expose directions function globally after services are initialized
        // Add a longer delay to ensure all Google Maps services are ready
        setTimeout(() => {
          window.showDirections = showDirections
          console.log('Directions function exposed to global scope')
        }, 2000)

        // Add map click event
        map.value.addListener('click', (event) => {
          addMarker(event.latLng, 'Clicked Location', 'blue', {
            type: 'User Marker',
            description: 'Location clicked by user',
            address: 'Unknown Address'
          })
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
        fields: ['name', 'geometry', 'formatted_address', 'place_id', 'rating', 'price_level', 'types', 'opening_hours', 'website', 'formatted_phone_number'],
        location: MAP_DEFAULTS.center,
        radius: 50000 // 50km radius from Melbourne CBD
      }

      placesService.value.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
          searchResults.value = results

          // Add markers for search results
          results.forEach(place => {
            if (place.geometry && place.geometry.location) {
              // Get place types as readable text
              const placeTypes = place.types ? place.types.slice(0, 3).join(', ') : 'Unknown Type'

              // Get price level as text
              const priceLevel = place.price_level ?
                ['Free', '$', '$$', '$$$', '$$$$'][place.price_level] : 'Price Unknown'

              addMarker(place.geometry.location, place.name, 'red', {
                type: 'Search Result',
                address: place.formatted_address || 'Address Unknown',
                description: `Category: ${placeTypes}`,
                rating: place.rating ? `${place.rating}/5` : 'No Rating',
                phone: place.formatted_phone_number || null,
                website: place.website || null,
                price: priceLevel
              })
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

          addMarker(pos, 'My Location (GPS)', 'blue', {
            type: 'Current Location',
            description: 'Current location via GPS',
            address: 'GPS Location'
          })
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

          addMarker(pos, 'My Location (IP)', 'orange', {
            type: 'Current Location',
            description: 'Current location via IP address',
            address: `${data.city || 'Unknown City'}, ${data.country || 'Unknown Country'}`
          })
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
    const addMarker = (position, title, color, additionalInfo = {}) => {
      const marker = new google.maps.Marker({
        position: position,
        map: map.value,
        title: title,
        icon: {
          url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
        }
      })

      // Create rich content for info window
      const createInfoContent = (title, info) => {
        let content = `
          <div style="padding: 10px; min-width: 200px;">
            <h6 style="margin: 0 0 8px 0; color: #333; font-weight: bold;">${title}</h6>
        `

        if (info.address) {
          content += `<p style="margin: 4px 0; color: #666; font-size: 12px;"><i class="fas fa-map-marker-alt"></i> ${info.address}</p>`
        }

        if (info.type) {
          content += `<p style="margin: 4px 0; color: #666; font-size: 12px;"><i class="fas fa-tag"></i> ${info.type}</p>`
        }

        if (info.rating) {
          content += `<p style="margin: 4px 0; color: #666; font-size: 12px;"><i class="fas fa-star"></i> Rating: ${info.rating}</p>`
        }

        if (info.phone) {
          content += `<p style="margin: 4px 0; color: #666; font-size: 12px;"><i class="fas fa-phone"></i> ${info.phone}</p>`
        }

        if (info.website) {
          content += `<p style="margin: 4px 0; color: #666; font-size: 12px;"><i class="fas fa-globe"></i> <a href="${info.website}" target="_blank">Visit Website</a></p>`
        }

        if (info.price) {
          content += `<p style="margin: 4px 0; color: #666; font-size: 12px;"><i class="fas fa-dollar-sign"></i> Price: ${info.price}</p>`
        }

        if (info.description) {
          content += `<p style="margin: 8px 0 0 0; color: #555; font-size: 11px; line-height: 1.4;">${info.description}</p>`
        }

        // Safely get coordinates first
        let lat, lng
        if (typeof position.lat === 'function') {
          lat = position.lat().toFixed(6)
          lng = position.lng().toFixed(6)
        } else if (position.lat !== undefined) {
          lat = position.lat.toFixed(6)
          lng = position.lng.toFixed(6)
        } else {
          lat = 'Unknown'
          lng = 'Unknown'
        }

        // Add directions button with safer onclick handler
        content += `
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
            <button onclick="if(window.showDirections && typeof window.showDirections === 'function') { window.showDirections(${lat}, ${lng}, '${title.replace(/'/g, "\\'")}'); } else { alert('Directions service is not ready yet. Please wait a moment and try again.'); }"
                    style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">
              <i class="fas fa-route"></i> Get Directions from My Location
            </button>
          </div>
        `

        content += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <small style="color: #999;">Coordinates: ${lat}, ${lng}</small>
            </div>
          </div>
        `

        return content
      }

      const infoWindow = new google.maps.InfoWindow({
        content: createInfoContent(title, additionalInfo)
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

    // Check if all required Google Maps APIs are available
    const isGoogleMapsReady = () => {
      return typeof google !== 'undefined' &&
             google.maps &&
             google.maps.DirectionsService &&
             google.maps.TravelMode &&
             google.maps.TravelMode.DRIVING &&
             google.maps.DirectionsStatus &&
             google.maps.DirectionsStatus.OK
    }

    // Directions functionality with retry mechanism
    const showDirections = (destinationLat, destinationLng, destinationName) => {
      console.log('Getting directions to:', destinationName, destinationLat, destinationLng)

      try {
        // Check if Google Maps API is loaded
        if (!isGoogleMapsReady()) {
          console.warn('Google Maps API not ready, attempting to wait...')
          setTimeout(() => {
            showDirections(destinationLat, destinationLng, destinationName)
          }, 1000)
          return
        }

        if (!directionsService.value || !directionsRenderer.value) {
          console.warn('Directions service not available, attempting to reinitialize...')
          setTimeout(() => {
            showDirections(destinationLat, destinationLng, destinationName)
          }, 1000)
          return
        }

        // Clear existing directions safely
        try {
          directionsRenderer.value.setDirections({ routes: [] })
        } catch (error) {
          console.warn('Error clearing directions:', error)
        }
      } catch (error) {
        console.error('Error in showDirections:', error)
        alert('An error occurred while preparing directions. Please try again.')
        return
      }

      // Check if we have current location, if not try to get it first
      if (!currentLocation.value) {
        console.log('No current location, attempting to get location first...')

        // Try to get current location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
              currentLocation.value = pos
              console.log('Got current location for directions:', pos)
              calculateDirectionsWithRetry(pos, destinationLat, destinationLng, destinationName)
            },
            (error) => {
              console.log('Failed to get current location, using Melbourne CBD')
              calculateDirectionsWithRetry(MAP_DEFAULTS.center, destinationLat, destinationLng, destinationName)
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000
            }
          )
        } else {
          console.log('Geolocation not supported, using Melbourne CBD')
          calculateDirectionsWithRetry(MAP_DEFAULTS.center, destinationLat, destinationLng, destinationName)
        }
      } else {
        console.log('Using existing current location:', currentLocation.value)
        calculateDirectionsWithRetry(currentLocation.value, destinationLat, destinationLng, destinationName)
      }
    }

    // Helper function with retry mechanism
    const calculateDirectionsWithRetry = (origin, destinationLat, destinationLng, destinationName, retryCount = 0) => {
      const maxRetries = 3

      // Ensure Google Maps API is fully loaded
      if (!isGoogleMapsReady()) {
        if (retryCount < maxRetries) {
          console.log(`Google Maps API not ready, retrying (${retryCount + 1}/${maxRetries})...`)
          setTimeout(() => {
            calculateDirectionsWithRetry(origin, destinationLat, destinationLng, destinationName, retryCount + 1)
          }, 1000)
          return
        } else {
          console.error('Google Maps API not ready after retries')
          alert('Google Maps API is not fully loaded. Please wait a moment and try again.')
          return
        }
      }

      try {
        const request = {
          origin: origin,
          destination: { lat: destinationLat, lng: destinationLng },
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }

        console.log('Sending directions request:', request)

        directionsService.value.route(request, (result, status) => {
          try {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.value.setDirections(result)

              // Center map on the route
              const bounds = new google.maps.LatLngBounds()
              result.routes[0].overview_path.forEach(point => {
                bounds.extend(point)
              })
              map.value.fitBounds(bounds)

              console.log('Directions displayed successfully')

              // Show success message with route info
              const route = result.routes[0]
              const leg = route.legs[0]
              const distance = leg.distance.text
              const duration = leg.duration.text

              alert(`Directions to ${destinationName} displayed!\nDistance: ${distance}\nDuration: ${duration}`)
            } else {
              console.error('Directions request failed:', status)
              alert(`Failed to get directions. Status: ${status}`)
            }
          } catch (callbackError) {
            console.error('Error in directions callback:', callbackError)
            alert('An error occurred while processing directions. Please try again.')
          }
        })
      } catch (requestError) {
        console.error('Error creating directions request:', requestError)
        alert('An error occurred while creating directions request. Please try again.')
      }
    }

    // Clear directions
    const clearDirections = () => {
      if (directionsRenderer.value) {
        directionsRenderer.value.setDirections({ routes: [] })
        console.log('Directions cleared')
      }
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
        const placeTypes = place.types ? place.types.slice(0, 3).join(', ') : 'Unknown Type'
        const priceLevel = place.price_level ?
          ['Free', '$', '$$', '$$$', '$$$$'][place.price_level] : 'Price Unknown'

        addMarker(place.geometry.location, place.name, 'yellow', {
          type: 'Selected Place',
          address: place.formatted_address || 'Address Unknown',
          description: `Category: ${placeTypes}`,
          rating: place.rating ? `${place.rating}/5` : 'No Rating',
          phone: place.formatted_phone_number || null,
          website: place.website || null,
          price: priceLevel
        })

        console.log('Navigated to place:', place.name)
      }
    }

    onMounted(() => {
      console.log('MapComponent mounted, initializing map...')

      // Check location permission status
      checkLocationPermission()

      // Load Google Maps API script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=places,geometry&callback=initGoogleMaps&v=weekly`
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
      goToPlace,
      clearDirections
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
