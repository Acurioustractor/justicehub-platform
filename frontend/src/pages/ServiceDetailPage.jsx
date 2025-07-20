import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Mail, ExternalLink, Clock, Users, Target, Building, Loader, AlertCircle } from 'lucide-react'
import { apiService } from '../lib/api'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchService = async () => {
      try {
        console.log('Fetching service with ID:', id)
        const data = await apiService.getService(id)
        console.log('Service data received:', data)
        setService(data)
      } catch (err) {
        console.error('Failed to fetch service:', err)
        setError(`Failed to load service details: ${err.message}. Please try again.`)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchService()
    }
  }, [id])

  const formatPhoneNumber = (phone) => {
    if (!phone) return null
    if (Array.isArray(phone) && phone.length > 0) {
      return phone[0].number || phone[0]
    }
    return phone
  }

  const getCategoryBadgeColor = (category) => {
    const colors = {
      legal_aid: 'bg-red-100 text-red-800',
      mental_health: 'bg-green-100 text-green-800',
      housing: 'bg-purple-100 text-purple-800',
      crisis_support: 'bg-orange-100 text-orange-800',
      education_training: 'bg-blue-100 text-blue-800',
      substance_abuse: 'bg-pink-100 text-pink-800',
      family_support: 'bg-cyan-100 text-cyan-800',
      cultural_support: 'bg-yellow-100 text-yellow-800',
      advocacy: 'bg-indigo-100 text-indigo-800',
      court_support: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getAgeRangeText = (ageRange) => {
    if (!ageRange) return null
    const { minimum, maximum } = ageRange
    if (minimum && maximum) {
      return `Ages ${minimum}-${maximum}`
    } else if (minimum) {
      return `Ages ${minimum}+`
    } else if (maximum) {
      return `Up to age ${maximum}`
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/search" className="btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-6">The service you're looking for doesn't exist or has been removed.</p>
          <Link to="/search" className="btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/search"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {service.name}
              </h1>
              
              {service.organization?.name && (
                <p className="text-lg text-gray-600 flex items-center mb-4">
                  <Building className="w-5 h-5 mr-2" />
                  {service.organization.name}
                  {service.organization.type && (
                    <span className="ml-3 text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {formatCategory(service.organization.type)}
                    </span>
                  )}
                </p>
              )}

              {/* Categories */}
              {service.categories && service.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.categories.map((category, index) => (
                    <span
                      key={index}
                      className={`badge ${getCategoryBadgeColor(category)}`}
                    >
                      {formatCategory(category)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {service.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Service</h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {service.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Target Demographics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Who This Service Is For</h2>
              <div className="space-y-3">
                {getAgeRangeText(service.age_range) && (
                  <div className="flex items-center text-gray-700">
                    <Target className="w-5 h-5 mr-3 text-primary-600" />
                    <span>{getAgeRangeText(service.age_range)}</span>
                  </div>
                )}
                
                {service.youth_specific && (
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-primary-600" />
                    <span>Specifically designed for young people</span>
                  </div>
                )}

                {service.indigenous_specific && (
                  <div className="flex items-center text-orange-700">
                    <Users className="w-5 h-5 mr-3 text-orange-600" />
                    <span>Culturally appropriate for Aboriginal and Torres Strait Islander people</span>
                  </div>
                )}

                {!getAgeRangeText(service.age_range) && !service.youth_specific && !service.indigenous_specific && (
                  <p className="text-gray-600">
                    This service is available to anyone who needs support.
                  </p>
                )}
              </div>
            </div>

            {/* Keywords */}
            {service.keywords && service.keywords.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {service.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                {formatPhoneNumber(service.contact?.phone) && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <a
                        href={`tel:${formatPhoneNumber(service.contact.phone)}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {formatPhoneNumber(service.contact.phone)}
                      </a>
                    </div>
                  </div>
                )}

                {service.contact?.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <a
                        href={`mailto:${service.contact.email}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {service.contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {service.url && (
                  <div className="flex items-start">
                    <ExternalLink className="w-5 h-5 mr-3 mt-0.5 text-primary-600" />
                    <div>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}

                {!formatPhoneNumber(service.contact?.phone) && !service.contact?.email && !service.url && (
                  <p className="text-gray-600 text-sm">
                    Contact information not available. Please search online or contact the organization directly.
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {service.location && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-3">
                  {service.location.address && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                      <div>
                        <div className="text-gray-900">{service.location.address}</div>
                        {service.location.city && (
                          <div className="text-sm text-gray-600">
                            {service.location.city}
                            {service.location.region && `, ${formatCategory(service.location.region)}`}
                          </div>
                        )}
                        {service.location.postcode && (
                          <div className="text-sm text-gray-600">{service.location.postcode}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {service.location.coordinates && (
                    <div className="mt-4">
                      <a
                        href={`https://www.google.com/maps?q=${service.location.coordinates.lat},${service.location.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    service.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="capitalize text-gray-700">{service.status || 'Unknown'}</span>
                </div>

                {service.updated_at && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Last updated: {new Date(service.updated_at).toLocaleDateString()}</span>
                  </div>
                )}

                {service.data_source && (
                  <div className="text-xs text-gray-500">
                    Data source: {formatCategory(service.data_source)}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Emergency?</h4>
              <p className="text-sm text-red-700 mb-3">
                If you need immediate help, call emergency services.
              </p>
              <div className="space-y-1 text-sm">
                <div><strong>Emergency:</strong> <a href="tel:000" className="text-red-700 underline">000</a></div>
                <div><strong>Kids Helpline:</strong> <a href="tel:1800551800" className="text-red-700 underline">1800 55 1800</a></div>
                <div><strong>Lifeline:</strong> <a href="tel:131114" className="text-red-700 underline">13 11 14</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}