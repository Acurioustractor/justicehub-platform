'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ScraperHealth {
  id: number
  scraper_name: string
  data_source: string
  status: 'healthy' | 'warning' | 'error' | 'disabled'
  last_run_at: string | null
  last_success_at: string | null
  next_scheduled_run: string | null
  records_scraped: number
  error_count: number
  consecutive_failures: number
  average_runtime_seconds: number
}

interface Props {
  lastRefresh: Date
}

// Mock data for demonstration
const MOCK_SCRAPERS: ScraperHealth[] = [
  {
    id: 1,
    scraper_name: 'Parliament Hansard',
    data_source: 'parliament_hansard',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    next_scheduled_run: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    records_scraped: 156,
    error_count: 0,
    consecutive_failures: 0,
    average_runtime_seconds: 125.5
  },
  {
    id: 2,
    scraper_name: 'Parliament Committees',
    data_source: 'parliament_committees',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    next_scheduled_run: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    records_scraped: 89,
    error_count: 0,
    consecutive_failures: 0,
    average_runtime_seconds: 98.2
  },
  {
    id: 3,
    scraper_name: 'Parliament QoN',
    data_source: 'parliament_qon',
    status: 'warning',
    last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    next_scheduled_run: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    records_scraped: 0,
    error_count: 2,
    consecutive_failures: 1,
    average_runtime_seconds: 45.8
  },
  {
    id: 4,
    scraper_name: 'Treasury Budget',
    data_source: 'treasury_budget',
    status: 'error',
    last_run_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    next_scheduled_run: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    records_scraped: 0,
    error_count: 5,
    consecutive_failures: 3,
    average_runtime_seconds: 215.3
  },
  {
    id: 5,
    scraper_name: 'Budget Website',
    data_source: 'budget_website',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    next_scheduled_run: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    records_scraped: 234,
    error_count: 0,
    consecutive_failures: 0,
    average_runtime_seconds: 156.7
  },
  {
    id: 6,
    scraper_name: 'Youth Statistics',
    data_source: 'youth_statistics',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    next_scheduled_run: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    records_scraped: 45,
    error_count: 1,
    consecutive_failures: 0,
    average_runtime_seconds: 67.9
  },
  {
    id: 7,
    scraper_name: 'Court Data',
    data_source: 'court_data',
    status: 'disabled',
    last_run_at: null,
    last_success_at: null,
    next_scheduled_run: null,
    records_scraped: 0,
    error_count: 0,
    consecutive_failures: 0,
    average_runtime_seconds: 0
  },
  {
    id: 8,
    scraper_name: 'Police Data',
    data_source: 'police_data',
    status: 'disabled',
    last_run_at: null,
    last_success_at: null,
    next_scheduled_run: null,
    records_scraped: 0,
    error_count: 0,
    consecutive_failures: 0,
    average_runtime_seconds: 0
  }
]

export function ScraperHealthDashboard({ lastRefresh }: Props) {
  const [scrapers, setScrapers] = useState<ScraperHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [useMockData, setUseMockData] = useState(false)

  useEffect(() => {
    fetchScraperHealth()
  }, [lastRefresh])

  const fetchScraperHealth = async () => {
    setLoading(true)
    try {
      // Try to fetch from Supabase first
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('scraper_health')
        .select('*')
        .order('data_source')

      if (error) {
        console.error('Error fetching scraper health:', error)
        setUseMockData(false)
        setScrapers([])
        // Only use mock data if explicitly requested
        if (process.env.NODE_ENV === 'development' && window.location.search.includes('mock=true')) {
          console.log('Using mock data (add ?mock=true to URL)')
          setUseMockData(true)
          setScrapers(MOCK_SCRAPERS)
        }
      } else {
        setScrapers(data || [])
        setUseMockData(false)
      }
    } catch (error) {
      console.error('Database connection error:', error)
      setUseMockData(false)
      setScrapers([])
      // Only use mock data if explicitly requested
      if (process.env.NODE_ENV === 'development' && window.location.search.includes('mock=true')) {
        console.log('Using mock data (add ?mock=true to URL)')
        setUseMockData(true)
        setScrapers(MOCK_SCRAPERS)
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      case 'disabled':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'disabled':
        return '⏸️'
      default:
        return '❓'
    }
  }

  const formatTimeAgo = (date: string | null) => {
    if (!date) return 'Never'
    
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds && seconds !== 0) return '0s'
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const calculateHealthScore = (scraper: ScraperHealth) => {
    let score = 100
    
    // Deduct for consecutive failures
    score -= scraper.consecutive_failures * 10
    
    // Deduct for error rate
    if (scraper.error_count > 0) {
      score -= Math.min(30, scraper.error_count * 5)
    }
    
    // Deduct for stale data
    if (scraper.last_success_at) {
      const hoursSinceSuccess = (new Date().getTime() - new Date(scraper.last_success_at).getTime()) / (1000 * 60 * 60)
      if (hoursSinceSuccess > 48) score -= 30
      else if (hoursSinceSuccess > 24) score -= 15
    }
    
    return Math.max(0, Math.min(100, score))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qld-gold"></div>
      </div>
    )
  }

  const healthyScraper = scrapers.filter(s => s.status === 'healthy').length
  const warningScraper = scrapers.filter(s => s.status === 'warning').length
  const errorScraper = scrapers.filter(s => s.status === 'error').length

  return (
    <div className="space-y-6">
      {/* Mock Data Notice */}
      {useMockData && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 border border-blue-800 rounded-lg p-4"
        >
          <p className="text-blue-400 text-sm">
            ℹ️ Showing demo data. To see real scraper data, run the migration in Supabase SQL Editor:
            <code className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded">
              /supabase/migrations/002_scraper_monitoring.sql
            </code>
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!useMockData && scrapers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center"
        >
          <p className="text-gray-400 mb-4">No scraper data available yet.</p>
          <p className="text-sm text-gray-500">
            To populate scraper health data:
          </p>
          <ol className="text-sm text-gray-500 mt-2 text-left max-w-md mx-auto">
            <li>1. Run the RLS fix script in Supabase</li>
            <li>2. Execute: <code className="bg-gray-900 px-2 py-1 rounded">node scripts/run-all-scrapers-after-fix.mjs</code></li>
            <li>3. Refresh this page</li>
          </ol>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Scrapers</p>
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-3xl font-bold">{scrapers.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-green-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Healthy</p>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-500">{healthyScraper}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-yellow-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Warnings</p>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{warningScraper}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-red-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Errors</p>
            <span className="text-2xl">❌</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{errorScraper}</p>
        </motion.div>
      </div>

      {/* Scraper Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {scrapers.map((scraper, index) => {
          const healthScore = calculateHealthScore(scraper)
          const isStale = scraper.last_success_at && 
            (new Date().getTime() - new Date(scraper.last_success_at).getTime()) > 24 * 60 * 60 * 1000

          return (
            <motion.div
              key={scraper.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gray-800 rounded-xl p-6 border ${
                scraper.status === 'error' ? 'border-red-900' :
                scraper.status === 'warning' ? 'border-yellow-900' :
                scraper.status === 'healthy' ? 'border-green-900' :
                'border-gray-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{scraper.scraper_name}</h3>
                  <p className="text-sm text-gray-400">{scraper.data_source.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(scraper.status)} animate-pulse`} />
                  <span className="text-2xl">{getStatusIcon(scraper.status)}</span>
                </div>
              </div>

              {/* Health Score Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Health Score</span>
                  <span className={healthScore < 50 ? 'text-red-500' : healthScore < 80 ? 'text-yellow-500' : 'text-green-500'}>
                    {healthScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      healthScore < 50 ? 'bg-red-500' : 
                      healthScore < 80 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Run</span>
                  <span className={isStale ? 'text-red-400' : ''}>
                    {formatTimeAgo(scraper.last_run_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Success</span>
                  <span className={isStale ? 'text-red-400' : ''}>
                    {formatTimeAgo(scraper.last_success_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Records Scraped</span>
                  <span>{scraper.records_scraped.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Runtime</span>
                  <span>{formatDuration(scraper.average_runtime_seconds)}</span>
                </div>
                {scraper.consecutive_failures > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Consecutive Failures</span>
                    <span className="font-bold">{scraper.consecutive_failures}</span>
                  </div>
                )}
              </div>

              {/* Next Run */}
              {scraper.next_scheduled_run && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Next Run</span>
                    <span className="text-qld-gold">
                      {new Date(scraper.next_scheduled_run).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Data Freshness Warning */}
              {isStale && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-800"
                >
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <span>⚠️</span>
                    Data is over 24 hours old
                  </p>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}