import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  // Use current domain for unified deployment, fallback to Railway
  window.location.origin.includes('vercel.app') || window.location.origin.includes('localhost') || window.location.origin.includes('railway.app')
    ? window.location.origin
    : 'https://youth-justice-service-finder-production-v2.up.railway.app'
)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    
    // For demo mode, return mock data instead of failing
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.log('API not available, using demo mode')
      return Promise.resolve({
        data: {
          error: 'API_UNAVAILABLE',
          demo_mode: true
        }
      })
    }
    
    return Promise.reject(error)
  }
)

export const apiService = {
  baseURL: API_BASE_URL,
  // Health check
  async healthCheck() {
    const response = await api.get('/health')
    return response.data
  },

  // Search services
  async searchServices(params = {}) {
    try {
      // Use diagnostic-search which works reliably
      const response = await api.get('/diagnostic-search', { params })
      return response.data.result
    } catch (error) {
      // Return demo search results if API unavailable
      console.log('Using demo search data')
      return {
        services: [
          {
            id: 'demo-1',
            name: 'Brisbane Youth Legal Service',
            description: 'Free legal advice and representation for young people aged 10-17 in Brisbane.',
            organization: { name: 'Youth Advocacy Centre' },
            location: { city: 'Brisbane', state: 'QLD', suburb: 'South Brisbane' },
            contact: { phone: { primary: '07 3356 1002' }, website: 'https://yac.net.au' },
            categories: ['legal_aid', 'youth_development'],
            youth_specific: true
          },
          {
            id: 'demo-2', 
            name: 'Headspace Sydney',
            description: 'Mental health support for young people aged 12-25 in Sydney CBD.',
            organization: { name: 'Headspace' },
            location: { city: 'Sydney', state: 'NSW', suburb: 'Sydney CBD' },
            contact: { phone: { primary: '02 9114 4100' }, website: 'https://headspace.org.au' },
            categories: ['mental_health', 'counselling'],
            youth_specific: true
          }
        ],
        total: 2,
        demo_mode: true,
        message: 'Demo results - 603+ services available when backend is deployed'
      }
    }
  },

  // Enhanced Elasticsearch search (fallback to simple search)
  async searchServicesES(params = {}) {
    try {
      // Try Elasticsearch first
      const response = await api.get('/search/es/enhanced', { params })
      return response.data
    } catch (error) {
      // Fallback to simple search for free hosting
      console.log('Falling back to simple search')
      const response = await api.get('/search/simple', { params })
      return response.data
    }
  },

  // Fuzzy search
  async fuzzySearch(query, options = {}) {
    const response = await api.get('/search/es/fuzzy', { 
      params: { q: query, ...options } 
    })
    return response.data
  },

  // Geographic search
  async nearbyServices(lat, lng, radius = '10km', limit = 20) {
    try {
      // Try Elasticsearch geo search first
      const response = await api.get('/search/es/geo', {
        params: { lat, lng, radius, limit }
      })
      return response.data
    } catch (error) {
      // Fallback to simple geo search for free hosting
      console.log('Falling back to simple geo search')
      const response = await api.get('/search/geo', {
        params: { lat, lng, radius, limit }
      })
      return response.data
    }
  },

  // Autocomplete suggestions
  async getAutocomplete(query, type = 'services') {
    try {
      // Try Elasticsearch autocomplete first
      const response = await api.get('/search/es/autocomplete/enhanced', {
        params: { q: query, type, limit: 10 }
      })
      return response.data
    } catch (error) {
      // Fallback to simple autocomplete for free hosting
      console.log('Falling back to simple autocomplete')
      const response = await api.get('/search/autocomplete', {
        params: { q: query, limit: 10 }
      })
      return response.data
    }
  },

  // Get all services
  async getServices(params = {}) {
    const response = await api.get('/services', { params })
    return response.data
  },

  // Get service by ID
  async getService(id) {
    try {
      const response = await api.get(`/services/${id}`)
      return response.data
    } catch (error) {
      // If the individual service endpoint fails, try to find it via the services list
      console.log('Individual service endpoint failed, falling back to services list search')
      
      try {
        // Use diagnostic-search endpoint which works
        const limit = 100 // Get services in chunks of 100
        let offset = 0
        let totalServices = 987 // We know we have 987 services
        
        while (offset < totalServices) {
          const pageResponse = await api.get('/diagnostic-search', {
            params: { limit, offset }
          })
          
          const foundService = pageResponse.data.result.services.find(s => s.id === id)
          if (foundService) {
            console.log(`Service found via working-search fallback at offset ${offset}`)
            return foundService
          }
          
          // Update total from response
          totalServices = pageResponse.data.total
          offset += limit
        }
        
        // If still not found, throw a more helpful error
        throw new Error(`Service with ID ${id} not found in ${totalServices} services`)
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError)
        throw new Error(`Service with ID ${id} not found`)
      }
    }
  },

  // Get organizations
  async getOrganizations(params = {}) {
    const response = await api.get('/organizations', { params })
    return response.data
  },

  // Get organization by ID
  async getOrganization(id) {
    const response = await api.get(`/organizations/${id}`)
    return response.data
  },

  // Get statistics
  async getStats() {
    try {
      const response = await api.get('/stats')
      if (response.data && typeof response.data === 'object') {
        return response.data
      }
      throw new Error('Invalid response format')
    } catch (error) {
      // Return demo stats if API unavailable
      console.log('Using demo stats data:', error.message)
      return {
        totals: {
          services: 603,
          organizations: 400
        },
        regions: ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'ACT', 'NT', 'TAS'],
        categories: [
          'Youth Development',
          'Mental Health', 
          'Legal Aid',
          'Housing Support',
          'Family Services',
          'Education Support',
          'Health Services',
          'Crisis Support'
        ],
        demo_mode: true,
        status: 'Demo data - database import pending. Search will show demo results until 603 services are imported.'
      }
    }
  },

  // Get demographic stats
  async getDemographicStats() {
    const response = await api.get('/stats/demographics')
    return response.data
  },

  // Get geographic stats
  async getGeographicStats() {
    const response = await api.get('/stats/geographic')
    return response.data
  },

  // Search suggestions
  async getSearchSuggestions(context = '') {
    const response = await api.get('/search/es/suggestions', {
      params: { context }
    })
    return response.data
  },

  // Search analytics
  async getSearchAnalytics(period = 'week') {
    const response = await api.get('/search/es/analytics', {
      params: { period }
    })
    return response.data
  },

  // Working search endpoint that actually works
  async workingSearch(params = {}) {
    try {
      // Use diagnostic-search which is proven to work
      const response = await api.get('/diagnostic-search', { params })
      return response.data.result
    } catch (error) {
      // Return demo search results if API unavailable
      console.log('Using demo search data')
      return {
        services: [
          {
            id: 'demo-1',
            name: 'Brisbane Youth Legal Service',
            description: 'Free legal advice and representation for young people aged 10-17 in Brisbane.',
            organization: { name: 'Youth Advocacy Centre' },
            location: { city: 'Brisbane', state: 'QLD', suburb: 'South Brisbane' },
            contact: { phone: { primary: '07 3356 1002' }, website: 'https://yac.net.au' },
            categories: ['legal_aid', 'youth_development'],
            youth_specific: true
          },
          {
            id: 'demo-2', 
            name: 'Headspace Sydney',
            description: 'Mental health support for young people aged 12-25 in Sydney CBD.',
            organization: { name: 'Headspace' },
            location: { city: 'Sydney', state: 'NSW', suburb: 'Sydney CBD' },
            contact: { phone: { primary: '02 9114 4100' }, website: 'https://headspace.org.au' },
            categories: ['mental_health', 'counselling'],
            youth_specific: true
          }
        ],
        pagination: {
          limit: 20,
          offset: 0,
          total: 2,
          pages: 1,
          current_page: 1,
          has_next: false,
          has_prev: false
        },
        total: 2,
        demo_mode: true,
        message: 'Demo results - 603+ services available when backend database is populated'
      }
    }
  },

  // Data download functionality
  async getDataDownloadInfo() {
    try {
      const response = await api.get('/data/dyjvs-payments/info')
      return response.data
    } catch (error) {
      console.log('Data download info not available, using demo data')
      const today = new Date().toISOString().split('T')[0]
      return {
        source_url: 'https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-ontimepayments-2024-25.csv',
        description: 'Department of Youth Justice, Victoria and Sport - On-time payments data for 2024-25',
        last_checked: new Date().toISOString(),
        filename_format: `dyjvs_ontimepayments_${today}.csv`,
        demo_mode: true
      }
    }
  },

  // Analysis functionality
  async getAnalysisData() {
    try {
      const response = await api.get('/analysis/analyze')
      return response.data
    } catch (error) {
      console.log('Analysis data not available, using demo data')
      return {
        summary: {
          totalRecords: 2847,
          totalAmount: 45623891.50,
          avgAmount: 16021.45,
          dateRange: '2024-25 Financial Year',
          uniqueSuppliers: 324
        },
        categories: {
          'Detention Services': { count: 1200, total: 18500000, avg: 15416.67 },
          'Community Services': { count: 850, total: 12800000, avg: 15058.82 },
          'Support Services': { count: 420, total: 6900000, avg: 16428.57 },
          'Legal Services': { count: 180, total: 3200000, avg: 17777.78 },
          'Education Services': { count: 120, total: 2400000, avg: 20000.00 },
          'Health Services': { count: 77, total: 1723891.50, avg: 22387.55 }
        },
        suppliers: [
          { name: 'Youth Justice Centre Brisbane', count: 45, total: 2840000, avg: 63111.11 },
          { name: 'Community Corrections QLD', count: 78, total: 2100000, avg: 26923.08 },
          { name: 'Mental Health Support Services', count: 32, total: 1850000, avg: 57812.50 }
        ],
        demo_mode: true
      }
    }
  },

  async getCategoryAnalysis() {
    try {
      const response = await api.get('/analysis/categories')
      return response.data
    } catch (error) {
      console.log('Category analysis not available')
      return { categories: {}, totalAmount: 0 }
    }
  },

  async getSupplierAnalysis() {
    try {
      const response = await api.get('/analysis/suppliers')
      return response.data
    } catch (error) {
      console.log('Supplier analysis not available')
      return { suppliers: [], totalSuppliers: 0 }
    }
  },

  // Budget Intelligence API Methods
  async getBudgetDashboard() {
    try {
      const response = await api.get('/budget-intelligence/dashboard')
      return response.data
    } catch (error) {
      console.log('Budget dashboard not available, using demo data')
      throw error // Let the component handle the error and show demo data
    }
  },

  async getBudgetReport() {
    try {
      const response = await api.get('/budget-intelligence/report')
      return response.data
    } catch (error) {
      console.log('Budget report not available')
      throw error
    }
  },

  async getBudgetContracts(params = {}) {
    try {
      const response = await api.get('/budget-intelligence/contracts', { params })
      return response.data
    } catch (error) {
      console.log('Budget contracts not available')
      throw error
    }
  },

  async getBudgetAllocations(year = null) {
    try {
      const params = year ? { year } : {}
      const response = await api.get('/budget-intelligence/allocations', { params })
      return response.data
    } catch (error) {
      console.log('Budget allocations not available')
      throw error
    }
  },

  async getBudgetTrends(params = {}) {
    try {
      const response = await api.get('/budget-intelligence/trends', { params })
      return response.data
    } catch (error) {
      console.log('Budget trends not available')
      throw error
    }
  },

  async getFundingOpportunities(params = {}) {
    try {
      const response = await api.get('/budget-intelligence/opportunities', { params })
      return response.data
    } catch (error) {
      console.log('Funding opportunities not available')
      throw error
    }
  },

  async getBudgetAlerts(params = {}) {
    try {
      const response = await api.get('/budget-intelligence/alerts', { params })
      return response.data
    } catch (error) {
      console.log('Budget alerts not available')
      throw error
    }
  }
}

// Export both named and default exports
export { API_BASE_URL }
export default api