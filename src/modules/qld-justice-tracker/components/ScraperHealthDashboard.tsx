'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

const supabase = getSupabaseClient()

interface ScraperHealth {
  id: string
  scraper_name: string
  data_source: string
  status: 'healthy' | 'warning' | 'error' | 'disabled'
  last_run_at: string
  last_success_at: string | null
  records_scraped: number
  consecutive_failures: number
  error_message: string | null
  next_scheduled_run: string | null
}

interface DataSummary {
  table_name: string
  record_count: number
  last_updated: string
  key_metrics: any
}

const SCRAPER_CONFIGS = {
  'Courts Enhanced': {
    description: 'Queensland Courts youth justice statistics',
    expectedTables: ['court_statistics', 'court_sentencing'],
    keyInsights: ['Indigenous overrepresentation', 'Bail refusal trends', 'Sentencing patterns'],
    icon: '🏛️',
    schedule: 'Weekly - Tuesday 1 PM'
  },
  'Police Enhanced': {
    description: 'Queensland Police Service crime and offender data',
    expectedTables: ['youth_crimes', 'youth_crime_patterns'],
    keyInsights: ['Regional disparities', 'Repeat offender rates', 'Crime patterns'],
    icon: '🚔',
    schedule: 'Weekly - Tuesday 2 PM'
  },
  'RTI Enhanced': {
    description: 'Right to Information disclosure logs',
    expectedTables: ['rti_requests'],
    keyInsights: ['Hidden costs', 'Transparency failures', 'Government secrecy'],
    icon: '📄',
    schedule: 'Weekly - Thursday 3 PM'
  },
  'Budget Tracker': {
    description: 'Queensland budget allocations',
    expectedTables: ['budget_allocations'],
    keyInsights: ['Spending priorities', 'Cost comparisons', 'Budget waste'],
    icon: '💰',
    schedule: 'Weekly - Monday 8 AM'
  },
  'Parliament Monitor': {
    description: 'Parliamentary debates and questions',
    expectedTables: ['parliamentary_documents'],
    keyInsights: ['Government admissions', 'Policy debates', 'Minister statements'],
    icon: '🏛️',
    schedule: 'Weekly - Monday 9 AM'
  },
  'Youth Justice Core': {
    description: 'Department of Youth Justice data',
    expectedTables: ['youth_statistics'],
    keyInsights: ['Detention rates', 'Program outcomes', 'System performance'],
    icon: '👥',
    schedule: 'Weekly - Tuesday 12 PM'
  },
  'Firecrawl Enhanced': {
    description: 'Advanced web scraping with Firecrawl',
    expectedTables: ['scraped_content'],
    keyInsights: ['Dynamic content extraction', 'Reliable data collection', 'Enhanced coverage'],
    icon: '🔥',
    schedule: 'Weekly - Various'
  },
  'AIHW Statistics': {
    description: 'AIHW Indigenous overrepresentation statistics',
    expectedTables: ['aihw_statistics'],
    keyInsights: ['20x overrepresentation', 'National comparisons', 'Trend analysis'],
    icon: '📊',
    schedule: 'Weekly - Monday 6 AM'
  },
  'Queensland Open Data': {
    description: 'Queensland Open Data Portal datasets',
    expectedTables: ['open_data_statistics'],
    keyInsights: ['Structured datasets', 'Official statistics', 'Detention trends'],
    icon: '📈',
    schedule: 'Weekly - Wednesday 10 AM'
  },
  'ABS Census': {
    description: 'ABS socio-economic risk factors',
    expectedTables: ['abs_risk_factors'],
    keyInsights: ['Risk factor mapping', 'Demographic analysis', 'Prevention insights'],
    icon: '📊',
    schedule: 'Weekly - Friday 11 AM'
  }
}

export default function ScraperHealthDashboard() {
  const [healthData, setHealthData] = useState<ScraperHealth[]>([])
  const [dataSummaries, setDataSummaries] = useState<DataSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchHealthData()
    fetchDataSummaries()
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchHealthData()
        fetchDataSummaries()
        setLastRefresh(new Date())
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchHealthData = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_health')
        .select('*')
        .order('last_run_at', { ascending: false })

      if (!error && data) {
        setHealthData(data)
      }
    } catch (error) {
      console.error('Error fetching health data:', error)
    }
  }

  const fetchDataSummaries = async () => {
    try {
      const tables = ['court_statistics', 'court_sentencing', 'youth_crimes', 'youth_crime_patterns', 'rti_requests', 'budget_allocations', 'parliamentary_documents', 'youth_statistics']
      const summaries: DataSummary[] = []

      for (const table of tables) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)

          summaries.push({
            table_name: table,
            record_count: count || 0,
            last_updated: sample?.[0]?.created_at || sample?.[0]?.scraped_date || 'Never',
            key_metrics: sample?.[0] || {}
          })
        } catch (error) {
          summaries.push({
            table_name: table,
            record_count: 0,
            last_updated: 'Error',
            key_metrics: {}
          })
        }
      }

      setDataSummaries(summaries)
    } catch (error) {
      console.error('Error fetching data summaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'disabled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'disabled': return '⏸️'
      default: return '❓'
    }
  }

  const calculateHealthScore = () => {
    if (healthData.length === 0) return 0
    const healthyCount = healthData.filter(h => h.status === 'healthy').length
    return Math.round((healthyCount / healthData.length) * 100)
  }

  const getTotalRecords = () => {
    return dataSummaries.reduce((total, summary) => total + summary.record_count, 0)
  }

  const getScraperConfig = (scraperName: string) => {
    const configKey = Object.keys(SCRAPER_CONFIGS).find(key => 
      scraperName.includes(key) || key.includes(scraperName.replace(' Scraper', ''))
    )
    return configKey ? SCRAPER_CONFIGS[configKey as keyof typeof SCRAPER_CONFIGS] : null
  }

  const getRecentFailures = () => {
    return healthData.filter(h => h.consecutive_failures > 0).length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const healthScore = calculateHealthScore()
  const totalRecords = getTotalRecords()
  const recentFailures = getRecentFailures()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔧 Scraper Health Dashboard</h2>
            <p className="text-gray-600">Real-time monitoring of data collection systems</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{healthScore}%</div>
            <div className="text-sm text-blue-800">System Health</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{healthData.length}</div>
            <div className="text-sm text-green-800">Active Scrapers</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{totalRecords.toLocaleString()}</div>
            <div className="text-sm text-purple-800">Total Records</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{recentFailures}</div>
            <div className="text-sm text-red-800">Recent Failures</div>
          </div>
        </div>
      </div>

      {/* Individual Scraper Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {healthData.map((scraper, index) => {
          const config = getScraperConfig(scraper.scraper_name)
          const relatedTables = dataSummaries.filter(ds => 
            config?.expectedTables.includes(ds.table_name)
          )
          const totalRecordsForScraper = relatedTables.reduce((sum, table) => sum + table.record_count, 0)

          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{config?.icon || '🔧'}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{scraper.scraper_name}</h3>
                    <p className="text-sm text-gray-600">{config?.description || 'Data collection system'}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(scraper.status)}`}>
                  {getStatusIcon(scraper.status)} {scraper.status}
                </div>
              </div>

              {/* Status Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Last Run:</span>
                    <div className="font-medium">
                      {scraper.last_run_at ? new Date(scraper.last_run_at).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Records Scraped:</span>
                    <div className="font-medium">{totalRecordsForScraper.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Success:</span>
                    <div className="font-medium">
                      {scraper.last_success_at ? new Date(scraper.last_success_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Failures:</span>
                    <div className={`font-medium ${scraper.consecutive_failures > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {scraper.consecutive_failures}
                    </div>
                  </div>
                </div>

                {/* Schedule Info */}
                {config?.schedule && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">📅 Schedule:</span>
                      <span className="font-medium text-blue-600">{config.schedule}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {scraper.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-sm text-red-800">
                      <strong>Error:</strong> {scraper.error_message}
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {config?.keyInsights && (
                  <div>
                    <span className="text-gray-600 text-sm">Key Insights:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {config.keyInsights.map((insight, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {insight}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Tables */}
                {relatedTables.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm">Data Tables:</span>
                    <div className="mt-1 space-y-1">
                      {relatedTables.map((table, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <span className="font-medium">{table.table_name}</span>
                          <span className="text-gray-600">{table.record_count} records</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* System Insights */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">💡 System Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2">Data Collection Active</h4>
            <p className="text-green-700 text-sm">
              {healthData.filter(h => h.status === 'healthy').length} scrapers successfully collecting youth justice data
            </p>
          </div>
          
          {totalRecords > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">Evidence Base Growing</h4>
              <p className="text-blue-700 text-sm">
                {totalRecords.toLocaleString()} data points exposing youth justice failures
              </p>
            </div>
          )}
          
          {recentFailures === 0 ? (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-800 mb-2">System Stable</h4>
              <p className="text-purple-700 text-sm">
                All scrapers running without recent failures
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-2">Needs Attention</h4>
              <p className="text-yellow-700 text-sm">
                {recentFailures} scrapers need maintenance to ensure full data coverage
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}