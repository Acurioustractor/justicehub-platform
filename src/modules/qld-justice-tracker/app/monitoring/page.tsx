'use client'

import { useState } from 'react'
import ScraperHealthDashboard from '@/components/ScraperHealthDashboard'
import DataSummaryCards from '@/components/DataSummaryCards'

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'data'>('overview')

  const tabs = [
    { id: 'overview', label: '📊 Data Overview', description: 'Summary of all collected data and insights' },
    { id: 'health', label: '🔧 Scraper Health', description: 'Real-time status of data collection systems' },
    { id: 'data', label: '📋 Data Sources', description: 'Detailed view of what each source provides' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🔍 Data Monitoring & Transparency
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Real-time view of our data collection exposing Queensland's youth justice failures
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Description */}
        <div className="mb-6">
          <p className="text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Mission Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">$1,570</div>
                    <div className="text-sm text-red-800">True daily cost per youth</div>
                    <div className="text-xs text-red-600">82% higher than claimed</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">13.7x</div>
                    <div className="text-sm text-orange-800">Indigenous overrepresentation</div>
                    <div className="text-xs text-orange-600">And getting worse</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">58%</div>
                    <div className="text-sm text-purple-800">Repeat offender rate</div>
                    <div className="text-xs text-purple-600">System is failing</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">21x</div>
                    <div className="text-sm text-green-800">Community programs cheaper</div>
                    <div className="text-xs text-green-600">With better outcomes</div>
                  </div>
                </div>
              </div>

              {/* Data Summary Cards */}
              <DataSummaryCards />
              
              {/* Key Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Next Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-800 mb-2">📢 Share the Truth</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Use our viral-ready data stories to expose the hidden costs
                    </p>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Data Stories →
                    </button>
                  </div>
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h3 className="font-bold text-purple-800 mb-2">📝 Submit RTI Requests</h3>
                    <p className="text-purple-700 text-sm mb-3">
                      Get more hidden data with our targeted RTI templates
                    </p>
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                      RTI Templates →
                    </button>
                  </div>
                  <div className="border border-green-200 rounded-lg p-4">
                    <h3 className="font-bold text-green-800 mb-2">📊 Explore Data</h3>
                    <p className="text-green-700 text-sm mb-3">
                      Dive deep into the interactive visualizations
                    </p>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                      View Charts →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && <ScraperHealthDashboard />}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Data Source Details</h2>
                <p className="text-gray-600 mb-6">
                  Complete transparency about what data we collect, from where, and how reliable it is.
                  Every piece of information is sourced from official Queensland government documents and websites.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h3 className="font-bold text-blue-800">Data Transparency</h3>
                    <p className="text-blue-700 text-sm">
                      All sources are publicly available Queensland government data
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <h3 className="font-bold text-green-800">Weekly Updates</h3>
                    <p className="text-green-700 text-sm">
                      All scrapers run weekly to ensure latest information is available
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded p-4">
                    <h3 className="font-bold text-purple-800">Quality Assured</h3>
                    <p className="text-purple-700 text-sm">
                      Data validation and error checking maintain accuracy
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Note</h3>
                  <p className="text-yellow-700 text-sm">
                    Some critical data is hidden by the Queensland government and requires Right to Information (RTI) requests to access. 
                    We track these gaps and submit strategic requests to expose what they don't want the public to know.
                  </p>
                </div>
              </div>

              <DataSummaryCards />
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">🌟 The Impact of Transparency</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-400">$256M</div>
                <div className="text-sm text-gray-300">Hidden costs exposed annually</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">30,282</div>
                <div className="text-sm text-gray-300">Youth who could be helped in community instead</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">82%</div>
                <div className="text-sm text-gray-300">More expensive than government admits</div>
              </div>
            </div>
            <p className="mt-6 text-gray-300 max-w-2xl mx-auto">
              Every day Queensland wastes $1.2M on ineffective detention that could fund 
              evidence-based community programs. The data is now exposed. The choice is ours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}