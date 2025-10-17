// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyAAVZzym1GsyW7AkXt2mlS-h6Or-xzcoxY',
  libraries: ['places', 'geometry'],
  version: 'weekly'
}

// Default map settings
export const MAP_DEFAULTS = {
  center: { lat: -37.8136, lng: 144.9631 }, // Melbourne CBD
  zoom: 12,
  mapTypeId: 'roadmap'
}

// Melbourne sports places for auto-loading
export const MELBOURNE_SPORTS_PLACES = [
  'Melbourne Sports and Aquatic Centre',
  'Albert Park Lake',
  'Royal Botanic Gardens Melbourne',
  'Fitzroy Gardens',
  'Carlton Gardens',
  'Princes Park',
  'Yarra Park',
  'Flagstaff Gardens',
  'Queen Victoria Gardens',
  'Kings Domain'
]
