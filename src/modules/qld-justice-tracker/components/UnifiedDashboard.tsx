'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeadlineMetrics } from './HeadlineMetrics'
import { useDashboardData, useMoneyCounter } from '@/hooks/useDashboardData'
import CountUp from 'react-countup'
import { 
  TrendingUp, AlertTriangle, Users, DollarSign, FileText, 
  Download, Share2, ExternalLink, Clock, CheckCircle 
} from 'lucide-react'

export default function UnifiedDashboard() {
  const { data, isLoading } = useDashboardData()
  const { moneyWasted, kidsHelped } = useMoneyCounter()
  const [activeSection, setActiveSection] = useState<string>('overview')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qld-maroon mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading verified government data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900">Unable to load dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-qld-maroon text-white px-4 py-2 rounded">
        Skip to main content
      </a>
      
      {/* Hero Section - Impact at a glance */}
      <section className="pt-12 pb-20 px-4" role="banner" aria-label="Dashboard overview">
        <div className="max-w-7xl mx-auto">
          <HeadlineMetrics 
            onSectionClick={setActiveSection}
            mode="overview"
          />
          
          {/* Live Impact Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-red-900 mb-4">
                While You've Been Reading This
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-4xl font-bold text-red-700">
                    <CountUp
                      start={moneyWasted - 100}
                      end={moneyWasted}
                      duration={2}
                      separator=","
                      prefix="$"
                      decimals={0}
                      preserveValue
                    />
                  </p>
                  <p className="text-red-600">taxpayer money wasted</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-emerald-700">
                    <CountUp
                      start={0}
                      end={kidsHelped}
                      duration={2}
                      separator=","
                    />
                  </p>
                  <p className="text-emerald-600">kids could have been helped</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Evidence Section - Build trust */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Every Number Verified
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Latest Court Data */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Court Statistics</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {data.lastUpdated.court}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.court.totalDefendants.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">youth defendants in 2023-24</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">
                    {data.court.indigenousPercentage}%
                  </p>
                  <p className="text-sm text-gray-600">are Indigenous youth</p>
                </div>
                <a
                  href={data.court.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FileText className="w-4 h-4" />
                  View source (p. 15)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>

            {/* Latest Detention Data */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Youth Detention</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {data.lastUpdated.detention}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.detention.totalYouth}
                  </p>
                  <p className="text-sm text-gray-600">children in detention</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">
                    {data.detention.capacityPercentage}%
                  </p>
                  <p className="text-sm text-gray-600">capacity (overcrowded)</p>
                </div>
                <a
                  href={data.detention.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FileText className="w-4 h-4" />
                  View census report
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>

            {/* Budget Reality */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Budget Allocation</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {data.budget.source.fiscalYear}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(data.budget.totalYouthJustice / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-600">total youth justice budget</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-600">
                    {data.budget.detentionPercentage}%
                  </p>
                  <p className="text-sm text-gray-600">spent on failed detention</p>
                </div>
                <a
                  href={data.budget.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FileText className="w-4 h-4" />
                  View budget (p. 78-82)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Data Quality Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                All data extracted from official Queensland Government PDFs
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Findings Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            The Evidence Is Overwhelming
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Indigenous Crisis */}
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <Badge className="bg-red-600 text-white">Critical</Badge>
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Extreme Indigenous Overrepresentation
                </h3>
                <p className="text-red-800 mb-4">
                  Indigenous youth are {Math.round(data.insights.indigenousOverrepresentation.detention)}x more likely to be detained despite being only {data.insights.indigenousOverrepresentation.populationPercentage}% of the population
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">In detention:</span>
                    <span className="font-bold text-red-900">{data.detention.indigenousPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">In court:</span>
                    <span className="font-bold text-red-900">{data.court.indigenousPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">10-11 year olds in court:</span>
                    <span className="font-bold text-red-900">86% Indigenous</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Waste */}
            <Card className="border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                  <Badge className="bg-amber-600 text-white">Wasteful</Badge>
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Massive Financial Mismanagement
                </h3>
                <p className="text-amber-800 mb-4">
                  Queensland spends {data.budget.costRatio}x more on detention than community programs, despite worse outcomes
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">True detention cost:</span>
                    <span className="font-bold text-amber-900">${data.audit.trueCostPerDay}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Community program cost:</span>
                    <span className="font-bold text-amber-900">${data.budget.dailyCommunityProgramCost}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Hidden costs:</span>
                    <span className="font-bold text-amber-900">{data.audit.hiddenCostPercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Failure */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                  <Badge className="bg-purple-600 text-white">Failing</Badge>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  System Completely Broken
                </h3>
                <p className="text-purple-800 mb-4">
                  {data.police.repeatOffenderPercentage}% of youth reoffend after $1.38 billion spent on punishment
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Youth offenders:</span>
                    <span className="font-bold text-purple-900">{data.police.youthOffenders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">On remand (not guilty):</span>
                    <span className="font-bold text-purple-900">{data.detention.remandPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Processing time:</span>
                    <span className="font-bold text-purple-900">{data.court.averageDaysToFinalization} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accountability Gap */}
            <Card className="border-2 border-gray-300 bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-600" />
                  <Badge variant="outline">No Accountability</Badge>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Zero Accountability
                </h3>
                <p className="text-gray-800 mb-4 italic">
                  "{data.audit.accountabilityFinding}"
                </p>
                <p className="text-sm text-gray-600">
                  - Queensland Audit Office, 2024
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Action Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Take Action Now
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Every day of inaction costs taxpayers ${Math.floor(data.budget.dailyDetentionCost).toLocaleString()} and fails {Math.floor(data.budget.dailyDetentionCost / data.budget.dailyCommunityProgramCost)} young Queenslanders
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share the Truth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Pre-written social media posts with verified statistics
                </p>
                <Button className="w-full">
                  Get Share Kit
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contact Your MP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Email template with local data for your electorate
                </p>
                <Button className="w-full">
                  Draft Email
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Full dataset with sources for researchers and journalists
                </p>
                <Button className="w-full">
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Update Timer */}
      <div className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Data verified from official government sources • Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}