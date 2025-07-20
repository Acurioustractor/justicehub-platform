'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

interface Alert {
  id: number
  scraper_name: string
  data_source: string
  alert_type: 'failure' | 'data_quality' | 'performance' | 'anomaly' | 'missing_data'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  details: any
  is_resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  alert_sent: boolean
  alert_sent_at: string | null
  created_at: string
}

interface Props {
  lastRefresh: Date
}

export function AlertsPanel({ lastRefresh }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAlerts()
  }, [lastRefresh, filter])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('scraper_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter === 'unresolved') {
        query = query.eq('is_resolved', false)
      } else if (filter === 'critical') {
        query = query.in('severity', ['critical', 'high'])
      }

      const { data, error } = await query

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: number) => {
    try {
      const { error } = await supabase
        .from('scraper_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin' // In production, this would be the actual user
        })
        .eq('id', alertId)

      if (error) throw error

      // Update local state
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId
          ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
          : alert
      ))
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-gray-900'
      case 'low':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'failure':
        return '❌'
      case 'data_quality':
        return '📊'
      case 'performance':
        return '⚡'
      case 'anomaly':
        return '🔍'
      case 'missing_data':
        return '❓'
      default:
        return '⚠️'
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qld-gold"></div>
      </div>
    )
  }

  // Calculate statistics
  const unresolvedCount = alerts.filter(a => !a.is_resolved).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length
  const alertsByType = alerts.reduce((acc, alert) => {
    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Total Alerts</p>
            <span className="text-2xl">🚨</span>
          </div>
          <p className="text-3xl font-bold">{alerts.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-yellow-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Unresolved</p>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{unresolvedCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-red-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Critical</p>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Alert Types</p>
            <span className="text-2xl">📋</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(alertsByType).map(([type, count]) => (
              <span key={type} className="text-xs bg-gray-700 px-2 py-1 rounded">
                {type}: {count}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {[
          { id: 'all' as const, label: 'All Alerts' },
          { id: 'unresolved' as const, label: 'Unresolved' },
          { id: 'critical' as const, label: 'Critical & High' }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === option.id
                ? 'bg-qld-gold text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gray-800 rounded-xl p-6 border ${
                alert.is_resolved ? 'border-gray-700 opacity-60' : 
                alert.severity === 'critical' ? 'border-red-800' :
                alert.severity === 'high' ? 'border-orange-800' :
                'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Alert Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{getAlertTypeIcon(alert.alert_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold">{alert.scraper_name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(alert.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {alert.data_source.replace(/_/g, ' ')} - {alert.alert_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Alert Message */}
                  <p className="text-white mb-3">{alert.message}</p>

                  {/* Alert Details */}
                  {alert.details && Object.keys(alert.details).length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                        className="text-sm text-gray-400 hover:text-gray-200 transition"
                      >
                        {selectedAlert?.id === alert.id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                      {selectedAlert?.id === alert.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 p-3 bg-gray-900 rounded-lg"
                        >
                          <pre className="text-xs text-gray-300 overflow-x-auto">
                            {JSON.stringify(alert.details, null, 2)}
                          </pre>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Resolution Info */}
                  {alert.is_resolved && alert.resolved_at && (
                    <p className="text-sm text-gray-500">
                      Resolved {formatTimeAgo(alert.resolved_at)} by {alert.resolved_by || 'system'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4 flex gap-2">
                  {!alert.is_resolved && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => resolveAlert(alert.id)}
                      className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg hover:bg-green-900/70 transition"
                    >
                      Resolve
                    </motion.button>
                  )}
                  {alert.severity === 'critical' && !alert.alert_sent && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900/70 transition"
                    >
                      Send Alert
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No alerts found</p>
          <p className="text-gray-600 text-sm mt-2">
            {filter === 'unresolved' ? 'All alerts have been resolved' : 'System is running smoothly'}
          </p>
        </div>
      )}
    </div>
  )
}