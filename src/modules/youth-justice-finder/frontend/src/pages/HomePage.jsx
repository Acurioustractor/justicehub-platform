import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Users, Building, ArrowRight, Phone, Heart } from 'lucide-react'
import { apiService } from '../lib/api'

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Set demo stats on error
        setStats({
          totals: { services: 603, organizations: 400 },
          regions: ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'ACT', 'NT', 'TAS'],
          categories: ['Youth Development', 'Mental Health', 'Legal Aid', 'Housing Support'],
          demo_mode: true
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find services using advanced search with location, age range, and category filters'
    },
    {
      icon: MapPin,
      title: 'Interactive Map',
      description: 'Visualize services on an interactive map with distance calculations'
    },
    {
      icon: Users,
      title: 'Youth-Focused',
      description: 'Specifically designed for young people aged 10-25 in the justice system'
    },
    {
      icon: Building,
      title: 'Comprehensive Database',
      description: 'Covering legal aid, mental health, housing, education, and crisis support'
    }
  ]

  const emergencyContacts = [
    { name: 'Emergency', number: '000', description: 'Police, Fire, Ambulance' },
    { name: 'Kids Helpline', number: '1800 55 1800', description: '24/7 counselling for young people' },
    { name: 'Lifeline', number: '13 11 14', description: '24/7 crisis support' },
    { name: 'Legal Aid QLD', number: '1300 651 188', description: 'Free legal help for young people' }
  ]

  return (
    <div className="min-h-screen">
      {/* Demo Mode Banner */}
      {stats?.demo_mode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-800 font-medium">
                Demo Mode: 603+ services ready for deployment - backend connection pending
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Find Youth Justice Services
              <span className="block text-primary-200">Across Australia</span>
            </h1>
            <p className="text-xl lg:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Connect young people with essential support services across all states and territories. 
              603+ verified services including legal aid, mental health support, housing assistance, and crisis intervention.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for services (e.g., 'youth legal aid Brisbane', 'mental health Sydney')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/search"
                className="bg-white text-primary-700 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200 flex items-center space-x-2"
              >
                <MapPin className="w-5 h-5" />
                <span>Browse All Services</span>
              </Link>
              <Link
                to="/search?categories=legal_aid"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-400 transition-colors duration-200 flex items-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Legal Aid</span>
              </Link>
              <Link
                to="/search?categories=mental_health"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-400 transition-colors duration-200 flex items-center space-x-2"
              >
                <Heart className="w-5 h-5" />
                <span>Mental Health</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-12 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Connecting Australia's Youth with Support
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats?.totals?.services || 0}
                  </div>
                  <div className="text-gray-600">Total Services</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats?.totals?.organizations || 0}
                  </div>
                  <div className="text-gray-600">Organizations</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats?.regions?.length || 0}
                  </div>
                  <div className="text-gray-600">Regions</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats?.categories?.length || 0}
                  </div>
                  <div className="text-gray-600">Service Types</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Tools for Service Discovery
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines advanced search technology with comprehensive service 
              data to help young people find the right support quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="bg-red-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Emergency & Crisis Support
            </h2>
            <p className="text-lg text-gray-600">
              If you need immediate help, these services are available 24/7
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    <a 
                      href={`tel:${contact.number}`}
                      className="text-lg font-bold text-red-600 hover:text-red-700"
                    >
                      {contact.number}
                    </a>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{contact.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find the Right Support?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start your search now and connect with services that can make a difference 
            in a young person's life.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 bg-white text-primary-700 px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary-50 transition-colors duration-200"
          >
            <Search className="w-5 h-5" />
            <span>Start Searching</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}