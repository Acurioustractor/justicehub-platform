'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { HeadlineMetrics } from '@/components/HeadlineMetrics'
import { ArrowRight, Download, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

interface DashboardData {
  timestamp: string
  spending?: {
    total_budget: number
    detention_total: number
    community_total: number
    detention_percentage: number
    community_percentage: number
    detention_daily_cost: number
    community_daily_cost: number
    cost_ratio: number
  }
  indigenous: {
    detention_percentage: number
    population_percentage: number
    overrepresentation_factor: number
    min_factor: number
    max_factor: number
  }
  trends: {
    dates: string[]
    detention_percentages: number[]
    community_percentages: number[]
  }
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Failed to fetch data')
      const data = await response.json()
      setData(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qld-maroon mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading accountability data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-2">Unable to load dashboard</p>
          <p className="text-gray-600">{error || 'No data available'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-qld-maroon text-white rounded-lg hover:bg-opacity-90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-12 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Queensland Youth Justice Accountability
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time tracking of government failures using official data. 
              Every number verified. Every source documented.
            </p>
          </motion.div>

          {/* Key Metrics */}
          <HeadlineMetrics 
            onSectionClick={(section) => {
              // Navigate to relevant section
              if (section === 'costs') {
                window.location.href = '/investigation/costs'
              } else if (section === 'indigenous') {
                window.location.href = '/data-explorer?focus=indigenous'
              }
            }}
            mode="overview"
          />

          {/* Primary Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-qld-maroon text-white rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              <TrendingUp className="w-5 h-5" />
              View Full Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/action"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-medium hover:border-gray-400 transition"
            >
              <Download className="w-5 h-5" />
              Take Action
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Key Insights Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What the Data Reveals
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Failure */}
            <Link href="/investigation/inquiries" className="group">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 h-full hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <span className="text-sm text-red-600 group-hover:underline">Investigate →</span>
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">System in Crisis</h3>
                <p className="text-red-800 mb-4">
                  Queensland has the highest youth detention rate in Australia at 175 per 10,000
                </p>
                <div className="space-y-2 text-sm text-red-700">
                  <div className="flex justify-between">
                    <span>Detention capacity:</span>
                    <span className="font-bold">107% (overcrowded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On remand (not convicted):</span>
                    <span className="font-bold">74.5%</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Financial Waste */}
            <Link href="/investigation/costs" className="group">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 h-full hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                  <span className="text-sm text-amber-600 group-hover:underline">Analyze →</span>
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Massive Waste</h3>
                <p className="text-amber-800 mb-4">
                  $1.38 billion spent with 90.6% going to failed detention approach
                </p>
                <div className="space-y-2 text-sm text-amber-700">
                  <div className="flex justify-between">
                    <span>Cost per day (detention):</span>
                    <span className="font-bold">$923</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per day (community):</span>
                    <span className="font-bold">$41</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Indigenous Crisis */}
            <Link href="/data-explorer?focus=indigenous" className="group">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 h-full hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <span className="text-sm text-purple-600 group-hover:underline">Explore →</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Systemic Injustice</h3>
                <p className="text-purple-800 mb-4">
                  Indigenous youth face extreme overrepresentation at every stage
                </p>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex justify-between">
                    <span>In detention:</span>
                    <span className="font-bold">75% Indigenous</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Population percentage:</span>
                    <span className="font-bold">4.5%</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Clear Call to Action */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            This Data Demands Action
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Every day of inaction costs Queensland taxpayers $1.2 million and fails hundreds of young people
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              href="/action/campaigns"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h3 className="font-bold text-gray-900 mb-2">For Advocates</h3>
              <p className="text-gray-600 text-sm mb-4">
                Share-ready content and campaign tools to demand change
              </p>
              <span className="text-qld-maroon font-medium">Get Started →</span>
            </Link>

            <Link 
              href="/sources"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h3 className="font-bold text-gray-900 mb-2">For Journalists</h3>
              <p className="text-gray-600 text-sm mb-4">
                Verified statistics with direct links to government sources
              </p>
              <span className="text-qld-maroon font-medium">Fact Check →</span>
            </Link>

            <Link 
              href="/downloads"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h3 className="font-bold text-gray-900 mb-2">For Researchers</h3>
              <p className="text-gray-600 text-sm mb-4">
                Complete datasets in multiple formats with methodology
              </p>
              <span className="text-qld-maroon font-medium">Download →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Statement */}
      <section className="py-8 px-4 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">
            All data sourced directly from Queensland Government. Updated weekly.
            <Link href="/transparency/methodology" className="text-qld-maroon hover:underline ml-2">
              Learn about our methodology →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}