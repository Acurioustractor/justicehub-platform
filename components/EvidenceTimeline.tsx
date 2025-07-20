'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboardData, useSourcesData } from '@/hooks/useDashboardData'
import { Clock, FileText, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

export default function EvidenceTimeline() {
  const { data } = useDashboardData()
  const { data: sources } = useSourcesData()

  if (!data || !sources) return null

  const timelineEvents = [
    {
      date: data.lastUpdated.detention,
      category: 'Youth Detention',
      title: 'Detention Census Update',
      description: `${data.detention.totalYouth} youth in detention, ${data.detention.indigenousPercentage}% Indigenous`,
      status: 'current',
      source: data.detention.source.document,
      url: data.detention.source.url,
      icon: <AlertCircle className="w-5 h-5" />
    },
    {
      date: data.lastUpdated.court,
      category: 'Court Statistics',
      title: 'Annual Court Report Released',
      description: `${data.court.totalDefendants.toLocaleString()} defendants, ${data.court.indigenousPercentage}% Indigenous`,
      status: 'current',
      source: data.court.source.document,
      url: data.court.source.url,
      icon: <FileText className="w-5 h-5" />
    },
    {
      date: data.lastUpdated.budget,
      category: 'Budget',
      title: 'State Budget Published',
      description: `$${(data.budget.totalYouthJustice / 1000000).toFixed(1)}M allocated, ${data.budget.detentionPercentage}% to detention`,
      status: 'current',
      source: data.budget.source.document,
      url: data.budget.source.url,
      icon: <FileText className="w-5 h-5" />
    },
    {
      date: data.lastUpdated.police,
      category: 'Police Data',
      title: 'Crime Statistics Released',
      description: `${data.police.youthOffenders.toLocaleString()} youth offenders, ${data.police.repeatOffenderPercentage}% repeat`,
      status: 'current',
      source: data.police.source.document,
      url: data.police.source.url,
      icon: <FileText className="w-5 h-5" />
    },
    {
      date: data.lastUpdated.audit,
      category: 'Audit Report',
      title: 'Performance Audit Published',
      description: `$${(data.audit.totalSpending2018to2023 / 1000000000).toFixed(2)}B spent with no accountability`,
      status: 'current',
      source: data.audit.source.document,
      url: data.audit.source.url,
      icon: <CheckCircle className="w-5 h-5" />
    }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getStatusColor = (date: string) => {
    const daysSince = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince < 30) return 'bg-green-500'
    if (daysSince < 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusText = (date: string) => {
    const daysSince = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince === 0) return 'Today'
    if (daysSince === 1) return 'Yesterday'
    if (daysSince < 7) return `${daysSince} days ago`
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`
    return `${Math.floor(daysSince / 30)} months ago`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Evidence Update Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quality Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-green-900">Data Quality Score</h3>
              <Badge className="bg-green-600 text-white">
                A - Official Government Data
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-green-700">Sources verified</p>
                <p className="font-bold text-green-900">{sources.dataQuality.qualityMetrics.sourcesVerified}</p>
              </div>
              <div>
                <p className="text-green-700">Statistics extracted</p>
                <p className="font-bold text-green-900">{sources.dataQuality.qualityMetrics.statisticsExtracted}</p>
              </div>
              <div>
                <p className="text-green-700">Data completeness</p>
                <p className="font-bold text-green-900">{sources.dataQuality.qualityMetrics.dataCompleteness}%</p>
              </div>
              <div>
                <p className="text-green-700">Update errors</p>
                <p className="font-bold text-green-900">{sources.dataQuality.qualityMetrics.lastUpdateErrors}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm border-2 border-gray-200">
                    <div className="text-gray-600">
                      {event.icon}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(event.date)}`}></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {event.category}
                          </Badge>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                        </div>
                        <span className="text-sm text-gray-500">
                          {getStatusText(event.date)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{event.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Updated: {new Date(event.date).toLocaleDateString()}
                        </span>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {event.source}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Schedule */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="font-medium text-gray-900 mb-4">Expected Updates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.primarySources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{source.category}</p>
                    <p className="text-xs text-gray-600">{source.updateFrequency}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {source.updateFrequency}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Process */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Our Verification Process</h4>
            <ol className="space-y-1 text-sm text-blue-800">
              {sources.dataQuality.verificationProcess.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}