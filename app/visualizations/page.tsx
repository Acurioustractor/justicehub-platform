'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function VisualizationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const visualizations = [
    {
      id: 'cost-comparison',
      title: 'True Cost Revelation',
      description: 'Interactive comparison of official vs. hidden costs',
      category: 'costs',
      icon: '💰',
      impact: 'high',
      insights: ['$1,570/day true cost', '82% hidden from public', '$256M annual hidden costs'],
      link: '/visualizations/cost-comparison',
      status: 'ready'
    },
    {
      id: 'indigenous-overrepresentation',
      title: 'Indigenous Overrepresentation Crisis',
      description: 'Visual breakdown of Indigenous youth in the justice system',
      category: 'indigenous',
      icon: '👥',
      impact: 'critical',
      insights: ['13.7x overrepresentation', '75% of detained youth', '3.4x regional disparity'],
      link: '/visualizations/indigenous-crisis',
      status: 'ready'
    },
    {
      id: 'system-failure',
      title: 'System Failure Analysis',
      description: 'Reoffending rates and program effectiveness',
      category: 'outcomes',
      icon: '🔄',
      impact: 'high',
      insights: ['58% repeat offender rate', '72% reoffending within 12 months', 'Detention ineffective'],
      link: '/visualizations/system-failure',
      status: 'ready'
    },
    {
      id: 'regional-disparities',
      title: 'Regional Justice Disparities',
      description: 'Map showing youth justice variations across Queensland',
      category: 'regional',
      icon: '🗺️',
      impact: 'medium',
      insights: ['Cairns: 74.2% Indigenous', 'Gold Coast: 21.7% Indigenous', '3.4x difference'],
      link: '/visualizations/regional-map',
      status: 'ready'
    },
    {
      id: 'budget-waste',
      title: 'Budget Allocation Analysis',
      description: 'Where youth justice money really goes',
      category: 'costs',
      icon: '📊',
      impact: 'high',
      insights: ['77% spent on detention', '23% on community programs', '21x cost difference'],
      link: '/visualizations/budget-breakdown',
      status: 'ready'
    },
    {
      id: 'transparency-scorecard',
      title: 'Government Transparency Scorecard',
      description: 'How much data is hidden from the public',
      category: 'transparency',
      icon: '📄',
      impact: 'medium',
      insights: ['80% transparency score', '82% costs hidden', 'RTI needed for truth'],
      link: '/visualizations/transparency',
      status: 'ready'
    },
    {
      id: 'community-vs-detention',
      title: 'Community Programs vs Detention',
      description: 'Cost and outcome comparison',
      category: 'solutions',
      icon: '🌱',
      impact: 'high',
      insights: ['$41/day vs $1,570/day', '40% better outcomes', '30,282 youth could be helped'],
      link: '/visualizations/alternatives',
      status: 'ready'
    },
    {
      id: 'timeline-trends',
      title: 'Historical Trends Analysis',
      description: 'How youth justice metrics have changed over time',
      category: 'trends',
      icon: '📈',
      impact: 'medium',
      insights: ['Bail refusal increasing', 'Indigenous rate worsening', 'Costs escalating'],
      link: '/visualizations/trends',
      status: 'ready'
    }
  ]

  const categories = [
    { id: 'all', label: 'All Visualizations', icon: '🎯' },
    { id: 'costs', label: 'Cost Analysis', icon: '💰' },
    { id: 'indigenous', label: 'Indigenous Crisis', icon: '👥' },
    { id: 'outcomes', label: 'System Outcomes', icon: '🔄' },
    { id: 'regional', label: 'Regional Data', icon: '🗺️' },
    { id: 'transparency', label: 'Transparency', icon: '📄' },
    { id: 'solutions', label: 'Better Solutions', icon: '🌱' },
    { id: 'trends', label: 'Historical Trends', icon: '📈' }
  ]

  const filteredVisualizations = selectedCategory === 'all' 
    ? visualizations 
    : visualizations.filter(v => v.category === selectedCategory)

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-red-300 bg-red-50'
      case 'high': return 'border-orange-300 bg-orange-50'
      case 'medium': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Interactive Data Visualizations
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore compelling visual stories exposing Queensland's youth justice failures
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mission Impact Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">🎯 Mission: Expose the Truth</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">$1.2M</div>
              <div className="text-sm opacity-90">Wasted daily on ineffective detention</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">30,282</div>
              <div className="text-sm opacity-90">Youth who could be helped in community</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">13.7x</div>
              <div className="text-sm opacity-90">Indigenous overrepresentation factor</div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Explore by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisualizations.map((viz) => (
            <div key={viz.id} className={`bg-white rounded-lg shadow-lg border-l-4 ${getImpactColor(viz.impact)} p-6 hover:shadow-xl transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{viz.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{viz.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getImpactBadge(viz.impact)}`}>
                      {viz.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{viz.description}</p>

              {/* Key Insights */}
              <div className="space-y-2 mb-6">
                <h4 className="font-medium text-gray-900">🔍 Key Insights:</h4>
                {viz.insights.map((insight, i) => (
                  <div key={i} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    • {insight}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${viz.status === 'ready' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{viz.status}</span>
                </div>
                
                {viz.status === 'ready' ? (
                  <Link 
                    href={viz.link}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Explore →
                  </Link>
                ) : (
                  <button 
                    disabled
                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded text-sm font-medium cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Stories Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📰 Ready-to-Share Data Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-800 mb-3">
                🚨 "Queensland Hides 82% of Youth Detention Costs"
              </h3>
              <p className="text-red-700 text-sm mb-4">
                Viral-ready story exposing the $256M in hidden costs that taxpayers don't know about.
              </p>
              <div className="flex space-x-2">
                <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                  Share Story
                </button>
                <button className="border border-red-600 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-50">
                  Download Data
                </button>
              </div>
            </div>
            
            <div className="border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-orange-800 mb-3">
                👥 "Indigenous Children 13.7x More Likely to Face Detention"
              </h3>
              <p className="text-orange-700 text-sm mb-4">
                Compelling evidence of systemic discrimination in Queensland's youth justice system.
              </p>
              <div className="flex space-x-2">
                <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">
                  Share Story
                </button>
                <button className="border border-orange-600 text-orange-600 px-3 py-1 rounded text-sm hover:bg-orange-50">
                  Download Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">💡 How to Use These Visualizations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-bold mb-2">📱 For Social Media</h4>
              <p>Click "Share Story" to get social-media-ready graphics and copy exposing youth justice failures</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">📊 For Research</h4>
              <p>Download raw data and detailed charts for academic papers, reports, or deeper analysis</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">🎯 For Advocacy</h4>
              <p>Use interactive visualizations in presentations to politicians, media, or community groups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}