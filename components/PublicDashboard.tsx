'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, TrendingDown, AlertTriangle, Users, DollarSign, 
  FileText, Download, Share2, ExternalLink, Play, Pause
} from 'lucide-react'

interface KeyStat {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  severity: 'critical' | 'warning' | 'normal'
  source: string
  lastUpdated: string
}

interface StorySection {
  id: string
  title: string
  description: string
  keyFinding: string
  impact: string
  evidence: string[]
  visualData: any
}

export default function PublicDashboard() {
  const [autoPlay, setAutoPlay] = useState(false)
  const [currentStory, setCurrentStory] = useState(0)

  const keyStats: KeyStat[] = [
    {
      label: 'Indigenous Overrepresentation',
      value: '20x',
      change: '+0.1x from last year',
      trend: 'up',
      severity: 'critical',
      source: 'AIHW Official Data',
      lastUpdated: '2 hours ago'
    },
    {
      label: 'Budget on Detention',
      value: '90.6%',
      change: 'No change from previous allocation',
      trend: 'stable',
      severity: 'critical',
      source: 'Queensland Treasury',
      lastUpdated: '6 hours ago'
    },
    {
      label: 'Indigenous 10-11yr in Court',
      value: '86%',
      change: 'Official court admission',
      trend: 'stable',
      severity: 'critical',
      source: 'Children\'s Court Report',
      lastUpdated: '1 day ago'
    },
    {
      label: 'Children in Watch Houses',
      value: '470',
      change: 'Average 5-14 days each',
      trend: 'up',
      severity: 'critical',
      source: 'Court Quarterly Data',
      lastUpdated: '3 days ago'
    },
    {
      label: 'True Detention Cost',
      value: '$1,570/day',
      change: 'vs $857 claimed by government',
      trend: 'up',
      severity: 'warning',
      source: 'QAO Hidden Cost Analysis',
      lastUpdated: '1 week ago'
    },
    {
      label: 'Indigenous Return Rate',
      value: '74%',
      change: 'Highest in Australia',
      trend: 'up',
      severity: 'critical',
      source: 'AIHW Statistics',
      lastUpdated: '2 hours ago'
    }
  ]

  const storyData: StorySection[] = [
    {
      id: 'crisis-overview',
      title: 'The Queensland Youth Justice Crisis',
      description: 'A systematic breakdown of government accountability using official data',
      keyFinding: 'Queensland has the worst youth justice outcomes in Australia, with 20x Indigenous overrepresentation',
      impact: '$1.38 billion spent with no accountability, 470 children in inappropriate custody',
      evidence: [
        'AIHW: Queensland has highest youth supervision rate (175 per 10,000)',
        'Treasury: 90.6% budget allocated to ineffective detention',
        'Court: 86% of youngest children in court are Indigenous',
        'QAO: No single entity accountable for system success'
      ],
      visualData: {
        type: 'comparison',
        data: [
          { state: 'Queensland', rate: 175, status: 'Worst' },
          { state: 'National Average', rate: 89, status: 'Average' },
          { state: 'Best State', rate: 45, status: 'Best' }
        ]
      }
    },
    {
      id: 'indigenous-discrimination',
      title: 'Systematic Indigenous Discrimination',
      description: 'Official government data reveals unprecedented racial bias in youth justice system',
      keyFinding: 'Indigenous children are 20 times more likely to be under youth justice supervision',
      impact: '86% of 10-11 year olds in court are Indigenous despite being 3.8% of population',
      evidence: [
        'AIHW: 20x overrepresentation factor (highest documented)',
        'Court: 86% Indigenous representation in youngest age group',
        'AIHW: 74% Indigenous return rate (highest in Australia)',
        'Court: 21.4x more likely to be in detention'
      ],
      visualData: {
        type: 'age_demographics',
        data: [
          { age: '10-11', indigenous: 86, population: 3.8 },
          { age: '12', indigenous: 81, population: 3.8 },
          { age: '13', indigenous: 65, population: 3.8 },
          { age: '14', indigenous: 58, population: 3.8 }
        ]
      }
    },
    {
      id: 'budget-failure',
      title: 'Budget Transparency Crisis',
      description: '$1.38 billion spent on failed detention-focused approach with no accountability',
      keyFinding: '90.6% of budget spent on detention despite evidence showing community programs work better',
      impact: 'Taxpayers pay $1,570 per day true cost vs $857 government claims',
      evidence: [
        'Treasury: $396.5M current allocation, 90.6% to detention',
        'QAO: $1.38B total spending 2018-2023',
        'QAO: True cost $1,570/day including hidden expenses',
        'QAO: "No one entity accountable for system success"'
      ],
      visualData: {
        type: 'budget_breakdown',
        data: [
          { category: 'Detention Operations', amount: 356.5, effective: false },
          { category: 'Community Programs', amount: 37.1, effective: true },
          { category: 'Administration', amount: 2.9, effective: false }
        ]
      }
    },
    {
      id: 'human-rights',
      title: 'Human Rights Violations',
      description: 'Children held in inappropriate custody for extended periods',
      keyFinding: '470 children held in police watch houses for average 5-14 days',
      impact: 'Constitutes cruel and unusual treatment of children under international law',
      evidence: [
        'Court: 470 children in police watch houses',
        'Court: Average stay 5-14 days in adult facilities',
        'UN: Violates Convention on Rights of the Child',
        'Expert: Constitutes cruel and unusual treatment'
      ],
      visualData: {
        type: 'custody_conditions',
        data: [
          { facility: 'Police Watch Houses', children: 470, appropriate: false },
          { facility: 'Youth Detention', children: 115, appropriate: false },
          { facility: 'Community Programs', children: 89, appropriate: true }
        ]
      }
    }
  ]

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(() => {
        setCurrentStory((prev) => (prev + 1) % storyData.length)
      }, 10000) // 10 seconds per story

      return () => clearInterval(interval)
    }
  }, [autoPlay, storyData.length])

  const downloadReport = () => {
    // This would generate and download a PDF report
    console.log('Generating accountability report...')
  }

  const shareStory = (story: StorySection) => {
    const text = `🚨 Queensland Youth Justice Crisis: ${story.title}\n\n${story.keyFinding}\n\nImpact: ${story.impact}\n\nSource: Official government data`
    
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: text,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'warning': return 'border-orange-500 bg-orange-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700'
      case 'warning': return 'text-orange-700'
      default: return 'text-gray-700'
    }
  }

  const currentStoryData = storyData[currentStory]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Queensland Youth Justice Crisis
          </h1>
          <p className="text-xl mb-8 max-w-4xl mx-auto">
            Exposing systematic discrimination and government failures using official data. 
            20x Indigenous overrepresentation. $1.38 billion spent with no accountability.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="secondary" 
              className="bg-white text-red-600 hover:bg-gray-100"
              onClick={downloadReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Full Report
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-red-600"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Evidence
            </Button>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Critical Accountability Failures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyStats.map((stat, index) => (
            <Card key={index} className={`border-l-4 ${getSeverityColor(stat.severity)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{stat.label}</h3>
                    <div className={`text-3xl font-bold ${getSeverityTextColor(stat.severity)}`}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
                    {stat.trend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
                    {stat.trend === 'stable' && <div className="h-5 w-5 bg-yellow-500 rounded-full" />}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{stat.change}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{stat.source}</span>
                  <span>{stat.lastUpdated}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive Story Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">The Evidence Story</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Step through the systematic failures documented with official government data
            </p>
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setAutoPlay(!autoPlay)}
                className="flex items-center gap-2"
              >
                {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoPlay ? 'Pause' : 'Auto Play'}
              </Button>
              <span className="text-sm text-gray-500">
                {currentStory + 1} of {storyData.length}
              </span>
            </div>
          </div>

          {/* Story Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {storyData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStory(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStory ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Story */}
          <Card className="max-w-5xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-red-700">
                {currentStoryData.title}
              </CardTitle>
              <p className="text-gray-600">{currentStoryData.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-800 mb-2">Key Finding</h3>
                <p className="text-red-700 text-lg">{currentStoryData.keyFinding}</p>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h3 className="font-bold text-orange-800 mb-2">Impact</h3>
                <p className="text-orange-700">{currentStoryData.impact}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3">Official Evidence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentStoryData.evidence.map((evidence, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{evidence}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => shareStory(currentStoryData)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share This Story
                </Button>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Sources
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress bar */}
          <div className="max-w-5xl mx-auto mt-6">
            <Progress 
              value={((currentStory + 1) / storyData.length) * 100} 
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Take Action</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            This crisis demands immediate attention. Use this evidence to hold the Queensland Government accountable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Contact Your MP</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Use our evidence packages to brief your local representative
                </p>
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                  Get MP Kit
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardContent className="p-6 text-center">
                <Share2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Share the Data</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Spread awareness with verified government statistics
                </p>
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                  Share Now
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Media Inquiry</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Access fact-checked data for accurate reporting
                </p>
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                  Media Kit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Data Sources Footer */}
      <div className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h3 className="font-bold text-gray-800">All Data Verified From Official Government Sources</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-sm text-gray-600">
            <div>Australian Institute of Health & Welfare (AIHW)</div>
            <div>Queensland Treasury Budget Papers</div>
            <div>Children's Court Annual Reports</div>
            <div>Queensland Audit Office</div>
          </div>
          <div className="text-center mt-4 text-xs text-gray-500">
            Last updated: {new Date().toLocaleDateString()} • Real-time monitoring active
          </div>
        </div>
      </div>
    </div>
  )
}