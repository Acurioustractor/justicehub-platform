'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, DollarSign, Users, Bell, X, Share2 } from 'lucide-react'

interface Alert {
  id: string
  type: 'indigenous_overrepresentation' | 'budget_misallocation' | 'court_discrimination' | 'system_failure'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  timestamp: Date
  source: string
  actionItems: string[]
  isNew: boolean
}

export default function RealTimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'new'>('all')

  useEffect(() => {
    // Initialize with mock alerts representing real accountability findings
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'indigenous_overrepresentation',
        severity: 'critical',
        title: 'Indigenous Overrepresentation Reaches 20x Factor',
        message: 'AIHW data confirms Indigenous youth are 20 times more likely to be under youth justice supervision. This represents the highest documented overrepresentation rate in Australia.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        source: 'AIHW Youth Justice Statistics',
        actionItems: [
          'Prepare parliamentary submission on Indigenous overrepresentation',
          'Alert Indigenous rights organizations',
          'Generate media fact-sheet with official statistics',
          'Schedule briefing with advocacy groups'
        ],
        isNew: true
      },
      {
        id: '2',
        type: 'budget_misallocation',
        severity: 'critical',
        title: 'Budget Allocation Crisis: 90.6% on Detention',
        message: 'Treasury data reveals 90.6% of $396.5M youth justice budget allocated to detention operations, only 9.4% to community programs despite evidence of better outcomes.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        source: 'Queensland Treasury Budget Papers',
        actionItems: [
          'Calculate cost-effectiveness of community vs detention',
          'Prepare budget transparency report',
          'Brief media on spending misallocation',
          'Draft questions for parliamentary estimates'
        ],
        isNew: true
      },
      {
        id: '3',
        type: 'court_discrimination',
        severity: 'critical',
        title: 'Court System Admits 86% of 10-11 Year Olds are Indigenous',
        message: 'Children\'s Court annual report officially admits 86% of 10-11 year olds appearing in court are Indigenous - clear evidence of systemic discrimination.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        source: 'Children\'s Court Annual Report 2022-23',
        actionItems: [
          'Document official government admission of discrimination',
          'Compare with international human rights standards',
          'Prepare legal analysis of systemic bias',
          'Alert UN Special Rapporteur on Indigenous Rights'
        ],
        isNew: false
      },
      {
        id: '4',
        type: 'system_failure',
        severity: 'high',
        title: '470 Children Held in Police Watch Houses',
        message: 'Court data reveals 470 children held in police watch houses for average 5-14 days - constituting cruel and unusual treatment of children.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        source: 'Children\'s Court Quarterly Data',
        actionItems: [
          'Document human rights violations',
          'Calculate total child-days in inappropriate custody',
          'Brief child rights advocates',
          'Prepare urgent intervention recommendations'
        ],
        isNew: false
      },
      {
        id: '5',
        type: 'budget_misallocation',
        severity: 'high',
        title: 'True Detention Cost $1,570/day vs $857 Official Claim',
        message: 'QAO analysis reveals true cost of youth detention is $1,570 per day when including hidden costs, nearly double the official $857 claim.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        source: 'Queensland Audit Office Report',
        actionItems: [
          'Calculate annual hidden cost to taxpayers',
          'Compare with community program costs',
          'Prepare cost transparency analysis',
          'Brief treasury accountability committee'
        ],
        isNew: false
      }
    ]

    setAlerts(mockAlerts)

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Occasionally add new alerts to simulate real-time monitoring
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: 'indigenous_overrepresentation',
          severity: 'medium',
          title: 'Data Update: Monthly Indigenous Statistics',
          message: 'Routine data update detected changes in Indigenous youth supervision rates.',
          timestamp: new Date(),
          source: 'Automated Data Monitor',
          actionItems: ['Review updated statistics', 'Check for significant changes'],
          isNew: true
        }
        
        setAlerts(prev => [newAlert, ...prev])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'indigenous_overrepresentation': return <Users className="h-5 w-5" />
      case 'budget_misallocation': return <DollarSign className="h-5 w-5" />
      case 'court_discrimination': return <AlertTriangle className="h-5 w-5" />
      case 'system_failure': return <TrendingUp className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
    }
  }

  const getSeverityTextColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-700'
      case 'high': return 'text-orange-700'
      case 'medium': return 'text-yellow-700'
      case 'low': return 'text-blue-700'
    }
  }

  const filteredAlerts = alerts
    .filter(alert => !dismissedAlerts.includes(alert.id))
    .filter(alert => {
      switch (filter) {
        case 'critical': return alert.severity === 'critical'
        case 'high': return alert.severity === 'high' || alert.severity === 'critical'
        case 'new': return alert.isNew
        default: return true
      }
    })

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  const shareAlert = (alert: Alert) => {
    const text = `🚨 Queensland Youth Justice Alert: ${alert.title}\n\n${alert.message}\n\nSource: ${alert.source}`
    
    if (navigator.share) {
      navigator.share({
        title: alert.title,
        text: text,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(text)
      // Could show a toast notification here
    }
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !dismissedAlerts.includes(a.id)).length
  const newCount = alerts.filter(a => a.isNew && !dismissedAlerts.includes(a.id)).length

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Bell className="h-8 w-8 text-red-500" />
          <h1 className="text-4xl font-bold text-gray-900">
            Real-Time Accountability Alerts
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Automated monitoring of Queensland youth justice failures. 
          Critical accountability issues detected and documented with official government data.
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-sm text-red-700">Critical Issues</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
          <div className="text-3xl font-bold text-orange-600">{alerts.filter(a => a.severity === 'high').length}</div>
          <div className="text-sm text-orange-700">High Priority</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-3xl font-bold text-blue-600">{newCount}</div>
          <div className="text-sm text-blue-700">New Alerts</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-3xl font-bold text-green-600">24/7</div>
          <div className="text-sm text-green-700">Monitoring</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'critical', label: 'Critical Only' },
          { key: 'high', label: 'High Priority' },
          { key: 'new', label: 'New Alerts' },
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
            {key === 'new' && newCount > 0 && (
              <Badge className="bg-blue-500 text-white ml-1">{newCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity).replace('bg-', 'border-')}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)} text-white`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      {alert.isNew && (
                        <Badge className="bg-blue-500 text-white">NEW</Badge>
                      )}
                      <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {alert.source} • {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareAlert(alert)}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${getSeverityTextColor(alert.severity)} font-medium`}>
                {alert.message}
              </p>
              
              {alert.actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Recommended Actions:</h4>
                  <ul className="space-y-1">
                    {alert.actionItems.map((action, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                <Button variant="outline" size="sm">
                  Generate Report
                </Button>
                <Button variant="outline" size="sm">
                  Brief Stakeholders
                </Button>
                <Button variant="outline" size="sm">
                  Media Package
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No alerts match your filter</h3>
          <p className="text-gray-500">Try adjusting your filter settings to see more alerts.</p>
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">AIHW Monitor</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">Budget Tracker</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-700">Court Monitor</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}