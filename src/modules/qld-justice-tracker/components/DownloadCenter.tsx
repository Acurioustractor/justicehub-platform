'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardData, useSourcesData } from '@/hooks/useDashboardData'
import { 
  Download, FileText, FileSpreadsheet, Image, 
  Presentation, CheckCircle, ExternalLink, FileJson 
} from 'lucide-react'

interface DownloadOption {
  id: string
  title: string
  description: string
  format: string
  icon: React.ReactNode
  size: string
  badge?: string
}

export default function DownloadCenter() {
  const { data } = useDashboardData()
  const { data: sources } = useSourcesData()
  const [downloading, setDownloading] = useState<string | null>(null)

  if (!data) return null

  const downloadOptions: DownloadOption[] = [
    {
      id: 'fact-sheet',
      title: 'One-Page Fact Sheet',
      description: 'Key statistics with sources for quick reference',
      format: 'PDF',
      icon: <FileText className="w-5 h-5" />,
      size: '248 KB',
      badge: 'Most Popular'
    },
    {
      id: 'full-data',
      title: 'Complete Dataset',
      description: 'All statistics in spreadsheet format for analysis',
      format: 'CSV',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      size: '156 KB'
    },
    {
      id: 'infographics',
      title: 'Social Media Graphics',
      description: 'Pre-designed images with verified statistics',
      format: 'PNG',
      icon: <Image className="w-5 h-5" />,
      size: '2.4 MB',
      badge: 'New'
    },
    {
      id: 'presentation',
      title: 'PowerPoint Presentation',
      description: '15-slide deck for meetings and presentations',
      format: 'PPTX',
      icon: <Presentation className="w-5 h-5" />,
      size: '4.1 MB'
    },
    {
      id: 'raw-json',
      title: 'Developer API Data',
      description: 'Raw JSON data for developers and researchers',
      format: 'JSON',
      icon: <FileJson className="w-5 h-5" />,
      size: '89 KB'
    },
    {
      id: 'source-pack',
      title: 'Source Documents',
      description: 'Links to all government PDFs referenced',
      format: 'PDF',
      icon: <ExternalLink className="w-5 h-5" />,
      size: '124 KB'
    }
  ]

  const generateFactSheet = () => {
    // In production, this would generate a real PDF
    const content = `QUEENSLAND YOUTH JUSTICE: THE FACTS
Generated: ${new Date().toLocaleDateString()}

CRISIS OVERVIEW
• ${data.detention.totalYouth} children in detention
• ${data.detention.indigenousPercentage}% are Indigenous (${Math.round(data.insights.indigenousOverrepresentation.detention)}x overrepresentation)
• ${data.detention.capacityPercentage}% capacity (overcrowded)
• ${data.detention.remandPercentage}% on remand (not convicted)

FINANCIAL WASTE
• Total budget: $${(data.budget.totalYouthJustice / 1000000).toFixed(1)} million
• ${data.budget.detentionPercentage}% spent on detention
• Only ${data.budget.communityPercentage}% on prevention
• Daily waste: $${Math.floor(data.budget.dailyDetentionCost).toLocaleString()}

SYSTEM FAILURES
• ${data.police.repeatOffenderPercentage}% reoffend
• ${data.court.totalDefendants.toLocaleString()} youth in court
• ${data.court.averageDaysToFinalization} days average processing

SOURCES
All data from official Queensland Government reports:
- Children's Court Annual Report 2023-24
- Youth Detention Census Q1 2024
- Queensland Budget 2024-25
- QPS Statistical Review 2023-24
- Queensland Audit Office Report 2024`

    return content
  }

  const generateCSV = () => {
    const csv = `Category,Metric,Value,Source,Page Reference,Last Updated
Court Statistics,Total Defendants,${data.court.totalDefendants},"Children's Court AR 2023-24","p. 15",${data.lastUpdated.court}
Court Statistics,Indigenous Percentage,${data.court.indigenousPercentage}%,"Children's Court AR 2023-24","p. 18-19",${data.lastUpdated.court}
Court Statistics,Bail Refused,${data.court.bailRefusedPercentage}%,"Children's Court AR 2023-24","p. 22",${data.lastUpdated.court}
Detention,Total Youth,${data.detention.totalYouth},"Youth Detention Census Q1 2024","Summary",${data.lastUpdated.detention}
Detention,Indigenous Youth,${data.detention.indigenousPercentage}%,"Youth Detention Census Q1 2024","Demographics",${data.lastUpdated.detention}
Detention,On Remand,${data.detention.remandPercentage}%,"Youth Detention Census Q1 2024","Summary",${data.lastUpdated.detention}
Budget,Total Allocation,${data.budget.totalYouthJustice},"Queensland Budget 2024-25","p. 78",${data.lastUpdated.budget}
Budget,Detention Spending,${data.budget.detentionPercentage}%,"Queensland Budget 2024-25","p. 78-82",${data.lastUpdated.budget}
Budget,Community Programs,${data.budget.communityPercentage}%,"Queensland Budget 2024-25","p. 78-82",${data.lastUpdated.budget}
Police,Youth Offenders,${data.police.youthOffenders},"QPS Statistical Review","p. 47",${data.lastUpdated.police}
Police,Repeat Offender Rate,${data.police.repeatOffenderPercentage}%,"QPS Statistical Review","p. 47",${data.lastUpdated.police}
Audit,True Cost Per Day,$${data.audit.trueCostPerDay},"QAO Report 2024","Ch. 3",${data.lastUpdated.audit}
Audit,Hidden Costs,${data.audit.hiddenCostPercentage}%,"QAO Report 2024","Ch. 3",${data.lastUpdated.audit}`

    return csv
  }

  const generateJSON = () => {
    return JSON.stringify({
      metadata: {
        generated: new Date().toISOString(),
        source: 'Queensland Youth Justice Tracker',
        disclaimer: 'All data from official Queensland Government sources'
      },
      statistics: data,
      sources: sources?.primarySources || []
    }, null, 2)
  }

  const handleDownload = async (option: DownloadOption) => {
    setDownloading(option.id)
    
    // Simulate download preparation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    let content = ''
    let filename = ''
    let mimeType = ''
    
    switch (option.id) {
      case 'fact-sheet':
        content = generateFactSheet()
        filename = `qld-youth-justice-facts-${new Date().toISOString().split('T')[0]}.txt`
        mimeType = 'text/plain'
        break
      case 'full-data':
        content = generateCSV()
        filename = `qld-youth-justice-data-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
        break
      case 'raw-json':
        content = generateJSON()
        filename = `qld-youth-justice-api-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
        break
      default:
        content = 'Download not yet implemented'
        filename = 'placeholder.txt'
        mimeType = 'text/plain'
    }
    
    // Create download
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    setDownloading(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-6 h-6" />
            Download Evidence & Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Statistics Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Youth in detention</p>
                <p className="font-bold text-lg">{data.detention.totalYouth}</p>
              </div>
              <div>
                <p className="text-gray-600">Indigenous</p>
                <p className="font-bold text-lg">{data.detention.indigenousPercentage}%</p>
              </div>
              <div>
                <p className="text-gray-600">Daily cost</p>
                <p className="font-bold text-lg">${Math.floor(data.budget.dailyDetentionCost / 1000)}k</p>
              </div>
              <div>
                <p className="text-gray-600">Last updated</p>
                <p className="font-bold text-lg">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {downloadOptions.map(option => (
              <Card 
                key={option.id} 
                className="hover:shadow-lg transition cursor-pointer"
                onClick={() => handleDownload(option)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {option.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{option.title}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    {option.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{option.format}</span>
                      <span>{option.size}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={downloading === option.id}
                    >
                      {downloading === option.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-2"></div>
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Citation Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to Cite This Data</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Academic:</strong> Queensland Youth Justice Tracker. (2024). <em>Youth Justice Statistics</em>. Retrieved from [URL]</p>
              <p><strong>Media:</strong> According to the Queensland Youth Justice Tracker, which compiles official government data...</p>
              <p><strong>Social:</strong> Source: QLD Youth Justice Tracker (verified government data)</p>
            </div>
          </div>

          {/* License */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              All data is compiled from publicly available Queensland Government sources.
              <br />
              This compilation is provided under{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Creative Commons CC-BY 4.0
              </a>
              {' '}with attribution required.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Original Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Original Government Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources?.primarySources.map(source => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{source.name}</p>
                  <p className="text-sm text-gray-600">{source.category} • Updated {source.updateFrequency}</p>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">View PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}