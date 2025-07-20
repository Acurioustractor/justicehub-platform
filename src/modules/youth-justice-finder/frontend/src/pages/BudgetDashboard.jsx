import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Calendar, 
  FileText,
  PieChart,
  BarChart3,
  Target,
  Clock,
  Award,
  Building,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { apiService } from '../lib/api'

export default function BudgetDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2025-26')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [selectedPeriod])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiService.getBudgetDashboard()
      setDashboardData(response)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load budget dashboard')
      // Set demo data for development
      setDashboardData({
        summary: {
          totalBudget: 770900000,
          totalSpent: 156780000,
          utilizationRate: '20.3',
          remainingBudget: 614120000,
          contractCount: 247,
          activeOpportunities: 12,
          highPriorityAlerts: 3
        },
        recentContracts: [
          {
            description: 'Staying On Track Rehabilitation Program',
            supplier: 'Mission Australia',
            value: 15000000,
            category: 'Community Programs',
            awardDate: new Date('2024-11-15')
          },
          {
            description: 'Youth Justice Schools Infrastructure',
            supplier: 'Department of Education',
            value: 12000000,
            category: 'Infrastructure',
            awardDate: new Date('2024-10-20')
          }
        ],
        spendingByCategory: {
          'Community Programs': 45000000,
          'Education Services': 38000000,
          'Infrastructure': 25000000,
          'Health Services': 18000000,
          'Cultural Services': 15000000,
          'Administration': 10000000,
          'Other': 5780000
        },
        spendingByRegion: {
          'Brisbane': 58000000,
          'Gold Coast': 25000000,
          'Townsville': 20000000,
          'Cairns': 18000000,
          'Toowoomba': 12000000,
          'Other': 23780000
        },
        monthlyTrends: {
          '2024-08': 12000000,
          '2024-09': 18000000,
          '2024-10': 25000000,
          '2024-11': 22000000,
          '2024-12': 28000000,
          '2025-01': 31000000,
          '2025-02': 20780000
        },
        upcomingOpportunities: [
          {
            title: 'Youth After Hours Services Expansion',
            amount: 8000000,
            closingDate: new Date('2025-03-15'),
            status: 'Open'
          },
          {
            title: 'Indigenous Youth Programs Grant',
            amount: 5000000,
            closingDate: new Date('2025-04-30'),
            status: 'Open'
          }
        ],
        criticalAlerts: [
          {
            type: 'warning',
            title: 'Budget Utilization Above Target',
            message: 'Q2 spending 15% above projected quarterly allocation',
            priority: 'high'
          },
          {
            type: 'opportunity',
            title: 'Major Grant Closing Soon',
            message: 'Youth After Hours Services grant closes in 28 days',
            priority: 'high'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatLargeCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return formatCurrency(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { summary, recentContracts, spendingByCategory, spendingByRegion, monthlyTrends, upcomingOpportunities, criticalAlerts } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Queensland Youth Justice Budget Intelligence
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time tracking of $2.256B youth justice investment using Queensland government contract disclosure data
              </p>
              {dashboardData?.summary?.dataSource && (
                <div className="mt-3">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {dashboardData.summary.dataSource}
                    {dashboardData.summary.lastUpdated && (
                      <span className="ml-2">
                        • Updated: {new Date(dashboardData.summary.lastUpdated).toLocaleDateString('en-AU')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field"
              >
                <option value="2025-26">2025-26 Budget</option>
                <option value="2024-25">2024-25 Budget</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="btn-secondary"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                {criticalAlerts.length} high priority alert{criticalAlerts.length !== 1 ? 's' : ''}
              </span>
              <span className="text-yellow-700">
                - {criticalAlerts[0].message}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto container-mobile section-mobile">
        {/* Summary Cards */}
        <div className="grid-mobile gap-mobile mb-8">
          <div className="stat-mobile">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="stat-label-mobile">Total Budget</p>
                <p className="stat-number-mobile">
                  {formatLargeCurrency(summary.totalBudget)}
                </p>
              </div>
            </div>
          </div>

          <div className="stat-mobile">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="stat-label-mobile">Total Spent</p>
                <p className="stat-number-mobile">
                  {formatLargeCurrency(summary.totalSpent)}
                </p>
                <p className="text-mobile-xs text-gray-500">
                  {summary.utilizationRate}% utilized
                </p>
              </div>
            </div>
          </div>

          <div className="stat-mobile">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="stat-label-mobile">Active Contracts</p>
                <p className="stat-number-mobile">
                  {summary.contractCount}
                </p>
              </div>
            </div>
          </div>

          <div className="stat-mobile">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="stat-label-mobile">Opportunities</p>
                <p className="stat-number-mobile">
                  {summary.activeOpportunities}
                </p>
                <p className="text-mobile-xs text-gray-500">Open for applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px mobile-scroll flex space-x-2 sm:space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'spending', name: 'Spending Analysis', icon: PieChart },
                { id: 'contracts', name: 'Contracts', icon: FileText },
                { id: 'opportunities', name: 'Opportunities', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`touch-target flex items-center space-x-2 py-2 px-3 sm:px-1 border-b-2 font-medium text-mobile-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid-mobile-2 gap-mobile">
            {/* Budget Utilization */}
            <div className="card-mobile">
              <h3 className="text-mobile-lg font-semibold text-gray-900 mb-4">Budget Utilization</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-mobile-sm">
                    <span>Spent</span>
                    <span>{formatLargeCurrency(summary.totalSpent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 sm:h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-3 sm:h-2 rounded-full" 
                      style={{ width: `${summary.utilizationRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-mobile-sm">
                    <span>Remaining</span>
                    <span>{formatLargeCurrency(summary.remainingBudget)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 sm:h-2 mt-1">
                    <div 
                      className="bg-green-600 h-3 sm:h-2 rounded-full" 
                      style={{ width: `${100 - parseFloat(summary.utilizationRate)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Spending Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h3>
              <div className="space-y-2">
                {Object.entries(monthlyTrends).slice(-6).map(([month, amount]) => (
                  <div key={month} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {new Date(month + '-01').toLocaleDateString('en-AU', { 
                        year: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                    <span className="font-medium">{formatLargeCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Large Contracts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Major Contracts</h3>
              <div className="space-y-4">
                {recentContracts.map((contract, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">{contract.description}</h4>
                    <p className="text-sm text-gray-600">{contract.supplier}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatLargeCurrency(contract.value)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {contract.awardDate ? new Date(contract.awardDate).toLocaleDateString('en-AU') : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Opportunities */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Opportunities</h3>
              <div className="space-y-4">
                {upcomingOpportunities.map((opportunity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{opportunity.title}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-blue-600">
                        {formatLargeCurrency(opportunity.amount)}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Closes {opportunity.closingDate ? new Date(opportunity.closingDate).toLocaleDateString('en-AU') : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spending' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
              <div className="space-y-3">
                {Object.entries(spendingByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="font-bold text-gray-900">{formatLargeCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Spending by Region */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Region</h3>
              <div className="space-y-3">
                {Object.entries(spendingByRegion)
                  .sort(([,a], [,b]) => b - a)
                  .map(([region, amount]) => (
                    <div key={region} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{region}</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatLargeCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}