<template>
  <div id="app">
    <Navigation />
    <router-view />
    <ProgramModal 
      v-if="selectedProgram"
      :program="selectedProgram"
      @close="closeModal"
      @join="joinProgram"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import Navigation from './components/Navigation.vue'

export default {
  name: 'App',
  components: {
    Navigation
  },
  setup() {
    // Reactive state
    const currentPage = ref('home')
    const showMobileMenu = ref(false)
    const isLoading = ref(false)
    const isSubmitting = ref(false)
    const showSuccessMessage = ref(false)
    const showModal = ref(false)
    const selectedProgram = ref(null)
    
    // Search and filter states
    const searchQuery = ref('')
    const selectedCategory = ref('')
    const selectedPrice = ref('')

    // Stats data (BR B.2 - Dynamic data)
    const stats = reactive({
      totalPrograms: 8,
      participants: 175,
      locations: 8,
      languages: 6
    })

    // Registration form data (BR B.2 - Dynamic data structure)
    const registration = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: '',
      language: 'English',
      interestedPrograms: [],
      emergencyContact: '',
      emergencyPhone: '',
      agreeTerms: false
    })

    // Form validation errors
    const errors = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: '',
      emergencyContact: '',
      emergencyPhone: '',
      agreeTerms: ''
    })

    // Programs data (BR B.2 - Dynamic data from JavaScript structures)
    const allPrograms = ref([
      {
        id: 1,
        name: 'Community Basketball',
        category: 'Team Sports',
        price: 'Free',
        description: 'Join our weekly basketball sessions for all skill levels. Build teamwork skills while staying fit.',
        detailedDescription: 'Our community basketball program runs every Saturday morning at the local community center. We provide all equipment and have experienced coaches to help players of all levels improve their game. The program focuses on teamwork, fitness, and fun in a supportive environment.',
        schedule: 'Saturdays 9:00 AM - 11:00 AM',
        location: 'Melbourne Community Center',
        participants: 24
      },
      {
        id: 2,
        name: 'Family Soccer',
        category: 'Team Sports',
        price: '$10',
        description: 'Friendly soccer matches perfect for families. Kids and parents play together in a supportive environment.',
        detailedDescription: 'Family Soccer brings parents and children together on the field for fun, non-competitive matches. This program emphasizes participation over competition and helps build family bonds while promoting physical activity.',
        schedule: 'Sundays 2:00 PM - 4:00 PM',
        location: 'Richmond Park',
        participants: 32
      },
      {
        id: 3,
        name: 'Morning Yoga',
        category: 'Wellness',
        price: '$15',
        description: 'Start your day with gentle yoga suitable for all ages and fitness levels.',
        detailedDescription: 'Our morning yoga sessions focus on gentle movements, breathing exercises, and mindfulness. Perfect for beginners and experienced practitioners alike. All mats and props are provided.',
        schedule: 'Mon, Wed, Fri 7:00 AM - 8:00 AM',
        location: 'Southbank Wellness Center',
        participants: 18
      },
      {
        id: 4,
        name: 'Swimming Lessons',
        category: 'Individual',
        price: '$20',
        description: 'Learn to swim or improve your technique with certified instructors.',
        detailedDescription: 'Professional swimming instruction for all levels, from complete beginners to stroke improvement. Small class sizes ensure personalized attention and rapid progress.',
        schedule: 'Tuesdays & Thursdays 6:00 PM - 7:00 PM',
        location: 'Melbourne Aquatic Centre',
        participants: 15
      },
      {
        id: 5,
        name: 'Walking Group',
        category: 'Fitness',
        price: 'Free',
        description: 'Social walking group exploring Melbourne\'s beautiful parks and neighborhoods.',
        detailedDescription: 'Join our friendly walking group as we explore different parts of Melbourne. Each week features a new route, and we welcome walkers of all paces. Great for meeting new people and discovering the city.',
        schedule: 'Wednesdays 10:00 AM - 12:00 PM',
        location: 'Various locations',
        participants: 28
      },
      {
        id: 6,
        name: 'Tennis Clinic',
        category: 'Individual',
        price: '$15',
        description: 'Improve your tennis skills with group lessons led by qualified coaches.',
        detailedDescription: 'Our tennis clinic offers group lessons focusing on technique, strategy, and match play. Suitable for beginners through intermediate players. Racquets available for loan.',
        schedule: 'Saturdays 3:00 PM - 4:30 PM',
        location: 'Albert Park Tennis Courts',
        participants: 20
      },
      {
        id: 7,
        name: 'Tai Chi in the Park',
        category: 'Wellness',
        price: 'Free',
        description: 'Gentle movement practice perfect for seniors and stress relief.',
        detailedDescription: 'Practice the ancient art of Tai Chi in the peaceful setting of our local park. This low-impact exercise improves balance, flexibility, and mental wellbeing. No experience necessary.',
        schedule: 'Thursdays 8:00 AM - 9:00 AM',
        location: 'Carlton Gardens',
        participants: 16
      },
      {
        id: 8,
        name: 'Cycling Club',
        category: 'Fitness',
        price: '$10',
        description: 'Group cycling rides along Melbourne\'s bike paths and trails.',
        detailedDescription: 'Explore Melbourne by bike with our cycling club. Routes vary from leisurely rides along the Yarra to more challenging trail rides. All fitness levels welcome, and bike maintenance tips included.',
        schedule: 'Sundays 8:00 AM - 10:30 AM',
        location: 'Various bike paths',
        participants: 22
      }
    ])

    // Computed properties
    const featuredPrograms = computed(() => {
      return allPrograms.value.slice(0, 3)
    })

    const filteredPrograms = computed(() => {
      let filtered = allPrograms.value

      // Search filter (BR B.2 - Dynamic filtering)
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

    // LocalStorage
    const saveToLocalStorage = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        console.log(`Saved ${key} to localStorage:`, data)
        return true
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error)
        return false
      }
    }

    const loadFromLocalStorage = (key, defaultValue = null) => {
      try {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : defaultValue
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error)
        return defaultValue
      }
    }

    // Methods
    const setActivePage = (page) => {
      currentPage.value = page
      showMobileMenu.value = false
      
      // Save the current page to localStorage
      saveToLocalStorage('currentPage', page)
      
      // Simulate loading for programs page
      if (page === 'programs') {
        isLoading.value = true
        setTimeout(() => {
          isLoading.value = false
        }, 800)
      }
    }

    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }

    const selectProgram = (program) => {
      selectedProgram.value = program
      showModal.value = true
      document.body.style.overflow = 'hidden'
      
      // Save user view history
      const viewHistory = loadFromLocalStorage('programViewHistory', [])
      const newView = {
        programId: program.id,
        programName: program.name,
        viewedAt: new Date().toISOString()
      }
      viewHistory.unshift(newView)
      // Only keep the last 10 records
      if (viewHistory.length > 10) {
        viewHistory.splice(10)
      }
      saveToLocalStorage('programViewHistory', viewHistory)
    }

    const closeModal = () => {
      showModal.value = false
      selectedProgram.value = null
      document.body.style.overflow = 'auto'
    }

    const joinProgram = () => {
      closeModal()
      setActivePage('register')
    }

    // BR (B.1): Two different types of validation
    const validateField = (fieldName) => {
      switch (fieldName) {
        case 'firstName':
        case 'lastName':
        case 'emergencyContact':
          if (!registration[fieldName].trim()) {
            errors[fieldName] = 'This field is required'
          } else if (registration[fieldName].trim().length < 2) {
            errors[fieldName] = 'Must be at least 2 characters long'
          } else {
            errors[fieldName] = ''
          }
          break

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!registration.email.trim()) {
            errors.email = 'Email is required'
          } else if (!emailRegex.test(registration.email)) {
            errors.email = 'Please enter a valid email address'
          } else {
            errors.email = ''
          }
          break

        case 'phone':
        case 'emergencyPhone':
          // Australian mobile number validation
          const phoneRegex = /^04\d{8}$/
          const cleanPhone = registration[fieldName].replace(/\s/g, '')
          if (!registration[fieldName].trim()) {
            errors[fieldName] = 'Phone number is required'
          } else if (!phoneRegex.test(cleanPhone)) {
            errors[fieldName] = 'Please enter a valid Australian mobile number (04XX XXX XXX)'
          } else {
            errors[fieldName] = ''
          }
          break

        case 'age':
          const age = parseInt(registration.age)
          if (!registration.age) {
            errors.age = 'Age is required'
          } else if (age < 16 || age > 99) {
            errors.age = 'Age must be between 16 and 99'
          } else {
            errors.age = ''
          }
          break

        case 'agreeTerms':
          if (!registration.agreeTerms) {
            errors.agreeTerms = 'You must agree to the terms and conditions'
          } else {
            errors.agreeTerms = ''
          }
          break
      }
    }

    const validateForm = () => {
      const fieldsToValidate = [
        'firstName', 'lastName', 'email', 'phone', 'age',
        'emergencyContact', 'emergencyPhone', 'agreeTerms'
      ]

      fieldsToValidate.forEach(field => validateField(field))
      return fieldsToValidate.every(field => !errors[field])
    }

    // Original submitRegistration method - saves multiple data to localStorage
    const submitRegistration = () => {
      if (!validateForm()) {
        return
      }

      isSubmitting.value = true

      // Simulate API call
      setTimeout(() => {
        // BR (B.2): Update dynamic data after registration
        const registrationData = {
          ...registration,
          registrationDate: new Date().toISOString(),
          id: Date.now()
        }

        // Save to localStorage (BR B.2 requirement)
        const existingRegistrations = loadFromLocalStorage('registrations', [])
        existingRegistrations.push(registrationData)
        
        // Save registration data
        saveToLocalStorage('registrations', existingRegistrations)
        saveToLocalStorage('latestRegistration', registrationData)

        // Update participant counts for selected programs
        registration.interestedPrograms.forEach(programName => {
          const program = allPrograms.value.find(p => p.name === programName)
          if (program) {
            program.participants += 1
          }
        })

        // Update stats data and save
        stats.participants += 1
        saveToLocalStorage('statsData', {
          ...stats,
          lastUpdated: new Date().toISOString()
        })

        // Reset form
        Object.keys(registration).forEach(key => {
          if (Array.isArray(registration[key])) {
            registration[key] = []
          } else if (typeof registration[key] === 'boolean') {
            registration[key] = false
          } else {
            registration[key] = ''
          }
        })
        registration.language = 'English'

        // Clear errors
        Object.keys(errors).forEach(key => {
          errors[key] = ''
        })

        isSubmitting.value = false
        showSuccessMessage.value = true

        console.log('Registration completed and saved to localStorage!')
        console.log('Check localStorage in DevTools under Application > Storage > Local Storage')

        // Hide success message after 5 seconds
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 5000)
      }, 2000)
    }

    // Dynamic stats update (BR B.2 - Dynamic data from JavaScript structures)
    const updateStats = () => {
      stats.totalPrograms = allPrograms.value.length
      stats.participants = allPrograms.value.reduce((total, program) => total + program.participants, 0)
      stats.locations = 8
      stats.languages = 6
      
      // Save updated stats data
      saveToLocalStorage('statsData', {
        ...stats,
        lastUpdated: new Date().toISOString()
      })
    }

    // Load data from localStorage
    const loadUserData = () => {
      // Load saved page state
      const savedPage = loadFromLocalStorage('currentPage', 'home')
      if (savedPage) {
        currentPage.value = savedPage
      }

      // Load stats data
      const savedStats = loadFromLocalStorage('statsData')
      if (savedStats) {
        Object.assign(stats, savedStats)
        console.log('Loaded stats from localStorage:', savedStats)
      }

      // Load search history
      const searchHistory = loadFromLocalStorage('searchHistory')
      if (searchHistory) {
        searchQuery.value = searchHistory.lastSearchQuery || ''
        selectedCategory.value = searchHistory.lastSelectedCategory || ''
        selectedPrice.value = searchHistory.lastSelectedPrice || ''
        console.log('Loaded search history from localStorage:', searchHistory)
      }

      // Load registration data
      const registrations = loadFromLocalStorage('registrations', [])
      if (registrations.length > 0) {
        console.log('Found saved registrations in localStorage:', registrations)
      }

      // Load user preferences
      const preferences = loadFromLocalStorage('userPreferences')
      if (preferences) {
        console.log('Loaded user preferences from localStorage:', preferences)
      }

      // Load view history
      const viewHistory = loadFromLocalStorage('programViewHistory', [])
      if (viewHistory.length > 0) {
        console.log('Program view history loaded from localStorage:', viewHistory)
      }
    }

    // Lifecycle
    onMounted(() => {
      updateStats()
      loadUserData()
    })

    return {
      // State
      currentPage,
      showMobileMenu,
      isLoading,
      isSubmitting,
      showSuccessMessage,
      showModal,
      selectedProgram,
      searchQuery,
      selectedCategory,
      selectedPrice,
      stats,
      registration,
      errors,
      allPrograms,
      
      // Computed
      featuredPrograms,
      filteredPrograms,
      
      // Methods
      setActivePage,
      toggleMobileMenu,
      selectProgram,
      closeModal,
      joinProgram,
      validateField,
      submitRegistration
    }
  }
}
</script>