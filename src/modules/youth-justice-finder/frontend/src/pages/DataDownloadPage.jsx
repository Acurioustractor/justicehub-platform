import React, { useState, useEffect } from 'react'
import { Download, FileText, Info, Calendar, ExternalLink, Database, Globe, MapPin, DollarSign } from 'lucide-react'
import { apiService } from '../lib/api'

export default function DataDownloadPage() {
  const [downloadInfo, setDownloadInfo] = useState(null)
  const [isDownloading, setIsDownloading] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get download info, but continue if it fails
        try {
          const data = await apiService.getDataDownloadInfo()
          setDownloadInfo(data)
        } catch (err) {
          console.log('Download info not available, using fallback')
        }
        
        // Get current stats from the working search endpoint
        const searchData = await apiService.workingSearch({ limit: 1 })
        
        // Get total count
        const fullData = await apiService.workingSearch({ limit: 1000 })
        setStats({
          total_services: fullData.services?.length || 603,
          last_updated: new Date().toISOString(),
          total_organizations: new Set(fullData.services?.map(s => s.organization?.name)).size || 400
        })
      } catch (err) {
        setError('Failed to load data information')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDownload = async (downloadType, filename) => {
    setIsDownloading(prev => ({ ...prev, [downloadType]: true }))
    setError(null)
    
    try {
      let url, data
      
      switch (downloadType) {
        case 'complete-services':
          // Download all services as JSON
          const allServices = await apiService.workingSearch({ limit: 1000 })
          data = JSON.stringify(allServices, null, 2)
          downloadJSON(data, 'complete-youth-services-database.json')
          break
          
        case 'services-csv':
          // Download services as CSV
          const servicesData = await apiService.workingSearch({ limit: 1000 })
          const csvData = convertServicesToCSV(servicesData.services)
          downloadCSV(csvData, 'youth-services-database.csv')
          break
          
        case 'qld-services':
          // Download Queensland services
          const qldServices = await apiService.workingSearch({ limit: 1000, regions: 'queensland' })
          const qldCSV = convertServicesToCSV(qldServices.services)
          downloadCSV(qldCSV, 'queensland-youth-services.csv')
          break
          
        case 'funding-data':
          // Download government funding data
          const fundingData = await import('../lib/spendingData.js')
          const fundingJSON = JSON.stringify(fundingData.governmentSpending, null, 2)
          downloadJSON(fundingJSON, 'qld-government-youth-justice-funding-2023-24.json')
          break
          
        case 'organizations':
          // Download organizations list
          const orgData = await apiService.workingSearch({ limit: 1000 })
          const organizations = extractOrganizations(orgData.services)
          const orgCSV = convertOrganizationsToCSV(organizations)
          downloadCSV(orgCSV, 'youth-service-organizations.csv')
          break
          
        default:
          // Fallback to original payment data
          url = `${apiService.baseURL}/data/dyjvs-payments`
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Download failed: ${response.status}`)
          const blob = await response.blob()
          downloadBlob(blob, filename)
      }
    } catch (err) {
      setError(`Download failed: ${err.message}`)
      console.error('Download error:', err)
    } finally {
      setIsDownloading(prev => ({ ...prev, [downloadType]: false }))
    }
  }

  const downloadJSON = (data, filename) => {
    const blob = new Blob([data], { type: 'application/json' })
    downloadBlob(blob, filename)
  }

  const downloadCSV = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv' })
    downloadBlob(blob, filename)
  }

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const convertServicesToCSV = (services) => {
    if (!services || services.length === 0) return 'No services available'
    
    const headers = [
      'ID', 'Name', 'Organization', 'Description', 'Categories', 'Location Address', 
      'Location City', 'Location Region', 'Phone', 'Email', 'Website', 'Age Range Min', 
      'Age Range Max', 'Youth Specific', 'Indigenous Specific', 'Status', 'Data Source'
    ]
    
    const csvData = services.map(service => [
      service.id || '',
      service.name || '',
      service.organization?.name || '',
      (service.description || '').replace(/"/g, '""'),
      (service.categories || []).join('; '),
      service.location?.address || '',
      service.location?.city || '',
      service.location?.region || '',
      extractPhoneNumber(service.contact?.phone) || '',
      extractEmailAddress(service.contact?.email || service.email) || '',
      service.url || '',
      service.age_range?.minimum || '',
      service.age_range?.maximum || '',
      service.youth_specific ? 'Yes' : 'No',
      service.indigenous_specific ? 'Yes' : 'No',
      service.status || 'active',
      service.data_source || 'merged'
    ])
    
    return [headers, ...csvData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  const extractOrganizations = (services) => {
    const orgMap = new Map()
    
    services?.forEach(service => {
      const org = service.organization
      if (org?.name) {
        if (!orgMap.has(org.name)) {
          orgMap.set(org.name, {
            name: org.name,
            type: org.type || '',
            services_count: 0,
            locations: new Set(),
            contact_info: {
              phone: extractPhoneNumber(service.contact?.phone),
              email: extractEmailAddress(service.contact?.email || service.email)
            }
          })
        }
        const orgData = orgMap.get(org.name)
        orgData.services_count++
        if (service.location?.city) {
          orgData.locations.add(service.location.city)
        }
      }
    })
    
    return Array.from(orgMap.values()).map(org => ({
      ...org,
      locations: Array.from(org.locations).join('; ')
    }))
  }

  const convertOrganizationsToCSV = (organizations) => {
    const headers = ['Name', 'Type', 'Services Count', 'Locations', 'Phone', 'Email']
    
    const csvData = organizations.map(org => [
      org.name,
      org.type,
      org.services_count,
      org.locations,
      org.contact_info.phone || '',
      org.contact_info.email || ''
    ])
    
    return [headers, ...csvData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  const extractPhoneNumber = (phone) => {
    if (!phone) return null
    if (typeof phone === 'string') return phone
    if (typeof phone === 'object') {
      return phone.primary || phone.mobile || phone.toll_free || phone.crisis_line || null
    }
    return null
  }

  const extractEmailAddress = (email) => {
    if (!email) return null
    if (typeof email === 'string') {
      try {
        const emailObj = JSON.parse(email)
        return emailObj.primary || emailObj.intake || emailObj.admin || null
      } catch {
        return email
      }
    }
    if (typeof email === 'object') {
      return email.primary || email.intake || email.admin || null
    }
    return null
  }

  const downloadOptions = [
    {
      id: 'complete-services',
      title: 'Complete Services Database',
      description: 'All youth justice and support services across Australia',
      format: 'JSON',
      icon: Database,
      color: 'blue',
      size: stats ? `${stats.total_services} services` : '603 services',
      filename: 'complete-youth-services-database.json'
    },
    {
      id: 'services-csv',
      title: 'Services Database (CSV)',
      description: 'All services in spreadsheet format for analysis',
      format: 'CSV',
      icon: FileText,
      color: 'green',
      size: stats ? `${stats.total_services} services` : '603 services',
      filename: 'youth-services-database.csv'
    },
    {
      id: 'qld-services',
      title: 'Queensland Services',
      description: 'Queensland-specific youth justice and support services',
      format: 'CSV',
      icon: MapPin,
      color: 'purple',
      size: '275+ QLD services',
      filename: 'queensland-youth-services.csv'
    },
    {
      id: 'funding-data',
      title: 'Government Funding Data',
      description: 'Queensland Department of Youth Justice expenditure 2023-24',
      format: 'JSON',
      icon: DollarSign,
      color: 'yellow',
      size: '43 funded organizations, $50M+',
      filename: 'qld-government-youth-justice-funding-2023-24.json'
    },
    {
      id: 'organizations',
      title: 'Service Organizations',
      description: 'Directory of all organizations providing youth services',
      format: 'CSV',
      icon: Globe,
      color: 'indigo',
      size: stats ? `${stats.total_organizations} organizations` : '400+ organizations',
      filename: 'youth-service-organizations.csv'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Downloads
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Access comprehensive datasets for youth justice and support services across Australia, 
            including Queensland government funding data and organizational directories.
          </p>
          {stats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.total_services}</div>
                <div className="text-sm text-gray-600">Total Services</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.total_organizations}</div>
                <div className="text-sm text-gray-600">Organizations</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">$50M+</div>
                <div className="text-sm text-gray-600">QLD Funding</div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-56"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Download Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {downloadOptions.map((option) => (
                <div key={option.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[option.color]}`}>
                          <option.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {option.title}
                          </h3>
                          <p className="text-sm text-gray-500">{option.format} Format</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {option.size}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm">
                      {option.description}
                    </p>

                    <button
                      onClick={() => handleDownload(option.id, option.filename)}
                      disabled={isDownloading[option.id]}
                      className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 w-full"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloading[option.id] ? 'Downloading...' : `Download ${option.format}`}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Data Sources & Attribution */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Data Sources & Attribution
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>
                  <strong>Queensland Government:</strong> Department of Youth Justice expenditure data (2023-24), 
                  service listings, and funding information under Queensland Government Open Data License.
                </p>
                <p>
                  <strong>National Sources:</strong> Headspace, Legal Aid, PCYC, Aboriginal & Torres Strait Islander 
                  services, and community organizations across all Australian states and territories.
                </p>
                <p>
                  <strong>Attribution Required:</strong> Please cite "Youth Justice Service Finder" and relevant 
                  government departments when using this data in research or publications.
                </p>
                <p>
                  <strong>License:</strong> Open data provided under respective government open data licenses. 
                  Commercial use permitted with proper attribution.
                </p>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-gray-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Technical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Formats:</span>
                  <p className="text-gray-600">JSON, CSV (UTF-8)</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Update Frequency:</span>
                  <p className="text-gray-600">Weekly (services), Quarterly (funding)</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Coverage:</span>
                  <p className="text-gray-600">Australia-wide, QLD focus</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">API Access:</span>
                  <p className="text-gray-600">Available via REST endpoints</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}