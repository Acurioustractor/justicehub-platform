'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

interface RateLimitConfig {
  id: number
  data_source: string
  requests_per_minute: number
  requests_per_hour: number
  requests_per_day: number
  min_delay_seconds: number
  max_delay_seconds: number
  backoff_multiplier: number
  max_retries: number
}

interface ProxyConfig {
  id: number
  proxy_url: string
  proxy_type: string
  is_active: boolean
  success_count: number
  failure_count: number
  last_used_at: string | null
  response_time_ms: number | null
}

interface SelectorAlternative {
  id: number
  scraper_name: string
  data_source: string
  field_name: string
  primary_selector: string
  alternative_selectors: string[]
  xpath_alternatives: string[]
  last_working_selector: string | null
  last_verified_at: string | null
  failure_count: number
}

interface Props {
  lastRefresh: Date
}

export function ScraperManagement({ lastRefresh }: Props) {
  const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([])
  const [proxies, setProxies] = useState<ProxyConfig[]>([])
  const [selectors, setSelectors] = useState<SelectorAlternative[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rate-limits' | 'proxies' | 'selectors'>('rate-limits')
  const supabase = createClient()

  useEffect(() => {
    fetchManagementData()
  }, [lastRefresh])

  const fetchManagementData = async () => {
    setLoading(true)
    try {
      // Fetch rate limit configs
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .from('rate_limit_configs')
        .select('*')
        .order('data_source')

      if (rateLimitError) throw rateLimitError
      setRateLimits(rateLimitData || [])

      // Fetch proxy configs
      const { data: proxyData, error: proxyError } = await supabase
        .from('proxy_configs')
        .select('*')
        .order('is_active', { ascending: false })

      if (proxyError) throw proxyError
      setProxies(proxyData || [])

      // Fetch selector alternatives
      const { data: selectorData, error: selectorError } = await supabase
        .from('selector_alternatives')
        .select('*')
        .order('failure_count', { ascending: false })
        .limit(20)

      if (selectorError) throw selectorError
      setSelectors(selectorData || [])
    } catch (error) {
      console.error('Error fetching management data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRateLimit = async (id: number, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('rate_limit_configs')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setRateLimits(prev => prev.map(config => 
        config.id === id ? { ...config, [field]: value } : config
      ))
    } catch (error) {
      console.error('Error updating rate limit:', error)
    }
  }

  const toggleProxy = async (id: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('proxy_configs')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setProxies(prev => prev.map(proxy => 
        proxy.id === id ? { ...proxy, is_active: isActive } : proxy
      ))
    } catch (error) {
      console.error('Error toggling proxy:', error)
    }
  }

  const runScraperManually = async (scraperName: string, dataSource: string) => {
    // This would trigger the scraper via API
    console.log(`Manually running ${scraperName} for ${dataSource}`)
    // Implementation would call an API endpoint to trigger the scraper
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qld-gold"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { id: 'rate-limits' as const, label: 'Rate Limiting', icon: '⏱️' },
          { id: 'proxies' as const, label: 'Proxy Management', icon: '🔀' },
          { id: 'selectors' as const, label: 'Self-Healing Selectors', icon: '🔧' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-qld-gold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{tab.icon}</span>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeManagementTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-qld-gold"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'rate-limits' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold">Rate Limit Configuration</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rateLimits.map((config) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <h4 className="font-bold mb-4">{config.data_source.replace(/_/g, ' ')}</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Requests per Minute</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={config.requests_per_minute}
                        onChange={(e) => updateRateLimit(config.id, 'requests_per_minute', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-12 text-right">{config.requests_per_minute}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Min Delay (seconds)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={config.min_delay_seconds}
                        onChange={(e) => updateRateLimit(config.id, 'min_delay_seconds', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-12 text-right">{config.min_delay_seconds}s</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Max Retries</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={config.max_retries}
                        onChange={(e) => updateRateLimit(config.id, 'max_retries', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-12 text-right">{config.max_retries}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={() => runScraperManually('', config.data_source)}
                      className="w-full px-4 py-2 bg-qld-gold text-gray-900 font-medium rounded-lg hover:bg-qld-gold/90 transition"
                    >
                      Run Scraper Manually
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'proxies' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Proxy Management</h3>
            <button className="px-4 py-2 bg-qld-gold text-gray-900 font-medium rounded-lg hover:bg-qld-gold/90 transition">
              Add New Proxy
            </button>
          </div>

          <div className="space-y-3">
            {proxies.map((proxy) => {
              const successRate = proxy.success_count + proxy.failure_count > 0
                ? (proxy.success_count / (proxy.success_count + proxy.failure_count)) * 100
                : 0

              return (
                <motion.div
                  key={proxy.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-gray-800 rounded-xl p-6 border ${
                    proxy.is_active ? 'border-green-800' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold">{proxy.proxy_url}</h4>
                        <span className="px-2 py-1 bg-gray-700 text-xs rounded">
                          {proxy.proxy_type.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Success Rate</p>
                          <p className={successRate > 90 ? 'text-green-500' : successRate > 70 ? 'text-yellow-500' : 'text-red-500'}>
                            {successRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Requests</p>
                          <p>{proxy.success_count + proxy.failure_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg Response</p>
                          <p>{proxy.response_time_ms ? `${proxy.response_time_ms}ms` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last Used</p>
                          <p>{proxy.last_used_at ? new Date(proxy.last_used_at).toLocaleTimeString() : 'Never'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => toggleProxy(proxy.id, !proxy.is_active)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          proxy.is_active
                            ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {proxy.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {activeTab === 'selectors' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold">Self-Healing Selectors</h3>
          <p className="text-gray-400">
            Alternative selectors that activate when primary selectors fail
          </p>

          <div className="space-y-3">
            {selectors.map((selector) => (
              <motion.div
                key={selector.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold">{selector.scraper_name}</h4>
                    <p className="text-sm text-gray-400">
                      {selector.data_source.replace(/_/g, ' ')} - {selector.field_name}
                    </p>
                  </div>
                  {selector.failure_count > 0 && (
                    <span className="px-3 py-1 bg-red-900/50 text-red-400 text-sm rounded-full">
                      {selector.failure_count} failures
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Primary Selector</p>
                    <code className="block p-2 bg-gray-900 rounded text-xs text-green-400">
                      {selector.primary_selector}
                    </code>
                  </div>

                  {selector.last_working_selector && selector.last_working_selector !== selector.primary_selector && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Currently Active</p>
                      <code className="block p-2 bg-gray-900 rounded text-xs text-yellow-400">
                        {selector.last_working_selector}
                      </code>
                    </div>
                  )}

                  {selector.alternative_selectors.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        Alternative Selectors ({selector.alternative_selectors.length})
                      </p>
                      <div className="space-y-1">
                        {selector.alternative_selectors.slice(0, 2).map((alt, i) => (
                          <code key={i} className="block p-2 bg-gray-900 rounded text-xs text-gray-500">
                            {alt}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {selector.last_verified_at && (
                    <p className="text-xs text-gray-500">
                      Last verified: {new Date(selector.last_verified_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}