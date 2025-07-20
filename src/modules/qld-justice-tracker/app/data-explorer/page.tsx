'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Download, Filter, Search, ChevronDown } from 'lucide-react'

const supabase = getSupabaseClient()

interface DataTab {
  id: string
  name: string
  table: string
  icon: string
  description: string
  fields: string[]
  filters?: {
    field: string
    label: string
    type: 'text' | 'select' | 'date'
    options?: string[]
  }[]
}

const DATA_TABS: DataTab[] = [
  {
    id: 'budget',
    name: 'Budget Allocations',
    table: 'budget_allocations',
    icon: '💰',
    description: 'Youth justice budget data showing detention vs community spending',
    fields: ['fiscal_year', 'department', 'program', 'category', 'amount', 'description'],
    filters: [
      { field: 'fiscal_year', label: 'Fiscal Year', type: 'select', options: ['2025-26', '2024-25', '2023-24'] },
      { field: 'category', label: 'Category', type: 'select', options: ['detention', 'community'] }
    ]
  },
  {
    id: 'youth-stats',
    name: 'Youth Statistics',
    table: 'youth_statistics',
    icon: '📊',
    description: 'Detention facility statistics including Indigenous overrepresentation',
    fields: ['date', 'facility_name', 'total_youth', 'indigenous_youth', 'indigenous_percentage', 'average_stay_days'],
    filters: [
      { field: 'facility_name', label: 'Facility', type: 'text' },
      { field: 'date', label: 'Date', type: 'date' }
    ]
  },
  {
    id: 'parliament',
    name: 'Parliamentary Documents',
    table: 'parliamentary_documents',
    icon: '🏛️',
    description: 'Parliamentary questions, Hansard records, and committee reports',
    fields: ['document_type', 'title', 'date', 'author', 'mentions_youth_justice', 'mentions_indigenous'],
    filters: [
      { field: 'document_type', label: 'Type', type: 'select', options: ['hansard', 'committee_report', 'question_on_notice'] },
      { field: 'mentions_youth_justice', label: 'Youth Justice', type: 'select', options: ['true', 'false'] }
    ]
  },
  {
    id: 'costs',
    name: 'Budget Analysis',
    table: 'budget_allocations',
    icon: '💸',
    description: 'Budget allocations showing detention vs community program spending',
    fields: ['fiscal_year', 'program', 'category', 'amount', 'description'],
    filters: [
      { field: 'fiscal_year', label: 'Fiscal Year', type: 'select', options: ['2025-26', '2024-25', '2023-24'] },
      { field: 'category', label: 'Category', type: 'select', options: ['detention', 'community'] }
    ]
  },
  {
    id: 'monitoring',
    name: 'Scraper Health',
    table: 'scraper_health',
    icon: '🤖',
    description: 'Monitor the health and performance of data collection scrapers',
    fields: ['scraper_name', 'status', 'last_run_at', 'records_scraped', 'error_count', 'consecutive_failures'],
    filters: [
      { field: 'status', label: 'Status', type: 'select', options: ['healthy', 'warning', 'error', 'disabled'] }
    ]
  }
]

export default function DataExplorerPage() {
  const [activeTab, setActiveTab] = useState('budget')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const activeTabData = DATA_TABS.find(tab => tab.id === activeTab)!

  useEffect(() => {
    fetchData()
  }, [activeTab, page, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from(activeTabData.table)
        .select('*', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1)
      
      // Use appropriate ordering column based on table
      if (activeTabData.table === 'court_statistics') {
        query = query.order('report_period', { ascending: false })
      } else if (activeTabData.table === 'youth_statistics') {
        query = query.order('date', { ascending: false })
      } else if (activeTabData.table === 'budget_allocations') {
        query = query.order('fiscal_year', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value) {
          if (field.includes('date')) {
            query = query.gte(field, value)
          } else if (field === 'mentions_youth_justice' || field === 'mentions_indigenous') {
            query = query.eq(field, value === 'true')
          } else {
            query = query.eq(field, value)
          }
        }
      })

      // Apply search
      if (searchTerm && activeTabData.fields.some(f => f.includes('title') || f.includes('description'))) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data: results, error, count } = await query

      if (error) {
        console.error('Error fetching data:', error)
        setData([])
      } else {
        setData(results || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Query error:', error)
      setData([])
    }
    setLoading(false)
  }

  const downloadData = async (format: 'csv' | 'json') => {
    try {
      const { data: allData, error } = await supabase
        .from(activeTabData.table)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeTabData.id}-data-${new Date().toISOString().split('T')[0]}.json`
        a.click()
      } else {
        // Convert to CSV
        if (!allData || allData.length === 0) return
        
        const headers = Object.keys(allData[0])
        const csv = [
          headers.join(','),
          ...allData.map(row => 
            headers.map(header => {
              const value = row[header]
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value
            }).join(',')
          )
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeTabData.id}-data-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const formatValue = (value: any, field: string) => {
    if (value === null || value === undefined) return '-'
    
    if (field.includes('amount') || field.includes('cost')) {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0
      }).format(value)
    }
    
    if (field.includes('percentage') || field === 'cost_ratio') {
      return `${Number(value).toFixed(1)}${field.includes('percentage') ? '%' : 'x'}`
    }
    
    if (field.includes('date') || field.includes('_at')) {
      return new Date(value).toLocaleDateString('en-AU')
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗'
    }
    
    return value
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Explorer
          </h1>
          <p className="text-lg text-gray-600">
            Explore all collected youth justice data with filtering and export capabilities
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto">
              {DATA_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPage(1)
                    setFilters({})
                    setSearchTerm('')
                  }}
                  className={`${
                    activeTab === tab.id
                      ? 'border-qld-maroon text-qld-maroon bg-red-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transform transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Download Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => downloadData('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => downloadData('json')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && activeTabData.filters && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeTabData.filters.map((filter) => (
                <div key={filter.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={filters[filter.field] || ''}
                      onChange={(e) => setFilters({ ...filters, [filter.field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
                    >
                      <option value="">All</option>
                      {filter.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : filter.type === 'date' ? (
                    <input
                      type="date"
                      value={filters[filter.field] || ''}
                      onChange={(e) => setFilters({ ...filters, [filter.field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
                    />
                  ) : (
                    <input
                      type="text"
                      value={filters[filter.field] || ''}
                      onChange={(e) => setFilters({ ...filters, [filter.field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
                    />
                  )}
                </div>
              ))}
              <div className="lg:col-span-4">
                <button
                  onClick={() => { setPage(1); fetchData(); }}
                  className="px-4 py-2 bg-qld-maroon hover:bg-qld-maroon/90 text-white rounded-lg transition"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => { setFilters({}); setPage(1); }}
                  className="ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTabData.icon} {activeTabData.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activeTabData.description}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {totalCount} total records
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qld-maroon mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">No data found</p>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or run the scrapers to collect data
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTabData.fields.map(field => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {field.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, i) => (
                      <tr key={row.id || i} className="hover:bg-gray-50">
                        {activeTabData.fields.map(field => (
                          <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatValue(row[field], field)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}