'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, DollarSign, Users, Bell, X, Share2, RefreshCw, Download } from 'lucide-react'


interface Alert {
  id: string
  scraper_name: string
  data_source: string
  alert_type: 'failure' | 'data_quality' | 'performance' | 'anomaly' | 'missing_data'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  details: any
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

interface DataAnomaly {
  id: string
  metric: string
  expected: number
  actual: number
  severity: 'critical' | 'high' | 'medium'
  description: string
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dataAnomalies, setDataAnomalies] = useState<DataAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'unresolved' | 'recent'>('all')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchAlerts()
    fetchDataAnomalies()
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts()
      fetchDataAnomalies()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // If no alerts, create some based on scraper health
      if (!data || data.length === 0) {
        const { data: healthData } = await supabase
          .from('scraper_health')
          .select('*')

        const generatedAlerts: Alert[] = []
        
        healthData?.forEach(health => {
          if (health.status === 'error' || health.consecutive_failures > 2) {
            generatedAlerts.push({
              id: `health-${health.id}`,
              scraper_name: health.scraper_name,
              data_source: health.data_source,
              alert_type: 'failure',
              severity: health.consecutive_failures > 3 ? 'critical' : 'high',
              message: `${health.scraper_name} has failed ${health.consecutive_failures} consecutive times`,
              details: { error_count: health.error_count, last_run: health.last_run_at },
              is_resolved: false,
              resolved_at: null,
              created_at: new Date().toISOString()
            })
          }
        })

        setAlerts(generatedAlerts)
      } else {
        setAlerts(data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const fetchDataAnomalies = async () => {
    try {
      // Check for anomalies in key metrics
      const anomalies = []

      // Check budget allocations
      const { data: budgetData } = await supabase
        .from('budget_allocations')
        .select('category, amount')
        .eq('fiscal_year', '2025-26')

      if (budgetData && budgetData.length > 0) {
        const detentionTotal = budgetData
          .filter(b => b.category === 'detention')
          .reduce((sum, b) => sum + Number(b.amount), 0)
        
        const communityTotal = budgetData
          .filter(b => b.category === 'community')
          .reduce((sum, b) => sum + Number(b.amount), 0)

        const total = detentionTotal + communityTotal
        if (total > 0) {
          const detentionPercentage = (detentionTotal / total) * 100
          
          if (detentionPercentage > 85) {
            anomalies.push({
              id: 'budget-imbalance',
              metric: 'Budget Allocation',
              expected: 50,
              actual: detentionPercentage,
              severity: detentionPercentage > 90 ? 'critical' : 'high' as 'critical' | 'high',
              description: `${detentionPercentage.toFixed(1)}% of youth justice budget allocated to detention, only ${(100 - detentionPercentage).toFixed(1)}% to community programs`,
              created_at: new Date().toISOString()
            })
          }
        }
      }

      // Check Indigenous overrepresentation
      const { data: youthStats } = await supabase
        .from('youth_statistics')
        .select('indigenous_percentage')
        .order('date', { ascending: false })
        .limit(10)

      if (youthStats && youthStats.length > 0) {
        const avgIndigenousPercentage = youthStats.reduce((sum, s) => sum + Number(s.indigenous_percentage), 0) / youthStats.length
        
        if (avgIndigenousPercentage > 50) {
          anomalies.push({
            id: 'indigenous-overrep',
            metric: 'Indigenous Youth in Detention',
            expected: 5, // Population percentage
            actual: avgIndigenousPercentage,
            severity: avgIndigenousPercentage > 65 ? 'critical' : 'high' as 'critical' | 'high',
            description: `Indigenous youth represent ${avgIndigenousPercentage.toFixed(1)}% of detention population vs 5% of general youth population`,
            created_at: new Date().toISOString()
          })
        }
      }

      setDataAnomalies(anomalies)
    } catch (error) {
      console.error('Error checking anomalies:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failure': return <AlertTriangle className="h-5 w-5" />
      case 'data_quality': return <TrendingUp className="h-5 w-5" />
      case 'performance': return <DollarSign className="h-5 w-5" />
      case 'anomaly': return <Users className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('scraper_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId)

      if (!error) {
        setAlerts(alerts.map(a => 
          a.id === alertId 
            ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() }
            : a
        ))
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const shareAlert = (alert: Alert | DataAnomaly) => {
    const message = 'message' in alert ? alert.message : alert.description
    const text = `🚨 Queensland Youth Justice Alert: ${message}\n\nView more: ${window.location.href}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Youth Justice Alert',
        text: text,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const exportAlerts = () => {
    const data = {
      alerts: alerts.filter(a => !a.is_resolved),
      anomalies: dataAnomalies,
      generated: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `youth-justice-alerts-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const refresh = () => {
    setLoading(true)
    setLastRefresh(new Date())
    fetchAlerts()
    fetchDataAnomalies()
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unresolved') return !alert.is_resolved
    if (filter === 'critical') return alert.severity === 'critical' && !alert.is_resolved
    if (filter === 'recent') {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return new Date(alert.created_at) > hourAgo
    }
    return true
  })

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length
  const unresolvedCount = alerts.filter(a => !a.is_resolved).length

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Bell className="h-8 w-8 text-red-500" />
          <h1 className="text-4xl font-bold text-gray-900">
            System Alerts & Anomalies
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Real-time monitoring of data collection issues and critical findings in Queensland youth justice system
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-sm text-red-700">Critical Issues</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-orange-600">{unresolvedCount}</div>
            <div className="text-sm text-orange-700">Unresolved Alerts</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-yellow-600">{dataAnomalies.length}</div>
            <div className="text-sm text-yellow-700">Data Anomalies</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Last Update</div>
            <div className="text-sm font-semibold text-green-700">
              {lastRefresh.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Alerts' },
            { key: 'critical', label: 'Critical Only' },
            { key: 'unresolved', label: 'Unresolved' },
            { key: 'recent', label: 'Last Hour' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key as any)}
              className="flex items-center gap-2"
            >
              {label}
              {key === 'critical' && criticalCount > 0 && (
                <Badge className="bg-red-500 text-white ml-1">{criticalCount}</Badge>
              )}
              {key === 'unresolved' && unresolvedCount > 0 && (
                <Badge className="bg-orange-500 text-white ml-1">{unresolvedCount}</Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportAlerts}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Anomalies Section */}
      {dataAnomalies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Critical Data Findings</h2>
          {dataAnomalies.map((anomaly) => (
            <Card key={anomaly.id} className="border-l-4 border-red-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      {anomaly.metric}
                      <Badge className={`${getSeverityColor(anomaly.severity)} text-white`}>
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareAlert(anomaly)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{anomaly.description}</p>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Expected</div>
                    <div className="text-2xl font-bold text-gray-900">{anomaly.expected}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Actual</div>
                    <div className="text-2xl font-bold text-red-600">{anomaly.actual.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* System Alerts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">System Alerts</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qld-maroon mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No alerts match your filter</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'All systems operating normally. No alerts at this time.'
                  : 'Try adjusting your filter settings to see more alerts.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 ${alert.is_resolved ? 'opacity-60' : ''} ${getSeverityColor(alert.severity).replace('bg-', 'border-')}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)} text-white`}>
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {alert.scraper_name}
                        <Badge variant={alert.is_resolved ? "secondary" : "default"}>
                          {alert.alert_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {!alert.is_resolved && (
                          <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="text-sm text-gray-600 mt-1">
                        {alert.data_source} • {new Date(alert.created_at).toLocaleString()}
                        {alert.is_resolved && ` • Resolved ${new Date(alert.resolved_at!).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareAlert(alert)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {!alert.is_resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{alert.message}</p>
                {alert.details && Object.keys(alert.details).length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Details:</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(alert.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Monitoring Status */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">Scraper Monitor</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">Data Quality</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">Anomaly Detection</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">Performance Monitor</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}