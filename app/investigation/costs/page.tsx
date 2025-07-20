'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from "@/lib/supabase/client"
import { DollarSign, TrendingUp, PieChart, AlertTriangle, Download, Calculator } from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)


interface CostData {
  category: string
  officialCost: number
  trueCost: number
  hiddenCosts: {
    item: string
    amount: number
  }[]
}

const costBreakdown: CostData[] = [
  {
    category: 'Youth Detention',
    officialCost: 857,
    trueCost: 1570,
    hiddenCosts: [
      { item: 'Healthcare & Medical', amount: 285 },
      { item: 'Education Services', amount: 178 },
      { item: 'Security & Monitoring', amount: 125 },
      { item: 'Infrastructure Maintenance', amount: 92 },
      { item: 'Administration Overhead', amount: 33 }
    ]
  },
  {
    category: 'Community Programs',
    officialCost: 150,
    trueCost: 195,
    hiddenCosts: [
      { item: 'Case Management', amount: 25 },
      { item: 'Family Support', amount: 20 }
    ]
  }
]

export default function CostsPage() {
  const [budgetData, setBudgetData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('2025-26')
  const [comparisonMode, setComparisonMode] = useState<'qld' | 'national' | 'international'>('qld')
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchBudgetData()
  }, [selectedYear])

  const fetchBudgetData = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_allocations')
        .select('*')
        .eq('fiscal_year', selectedYear)
        .order('amount', { ascending: false })

      if (error) throw error
      setBudgetData(data || [])
    } catch (error) {
      console.error('Error fetching budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalBudget = () => {
    return budgetData.reduce((sum, item) => sum + Number(item.amount), 0)
  }

  const calculateDetentionPercentage = () => {
    const total = calculateTotalBudget()
    const detention = budgetData
      .filter(item => item.category === 'detention')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    return total > 0 ? (detention / total) * 100 : 0
  }

  const pieChartData = {
    labels: ['Detention Operations', 'Community Programs', 'Administration', 'Other'],
    datasets: [{
      data: [
        calculateDetentionPercentage(),
        9.4,
        5.2,
        100 - calculateDetentionPercentage() - 9.4 - 5.2
      ],
      backgroundColor: [
        '#ef4444', // red for detention
        '#10b981', // green for community
        '#6366f1', // indigo for admin
        '#9ca3af'  // gray for other
      ],
      borderWidth: 0
    }]
  }

  const costComparisonData = {
    labels: ['Official Cost', 'True Cost (QAO)', 'Norway Prison', 'Finland Youth Program'],
    datasets: [{
      label: 'Cost per day per youth ($)',
      data: [857, 1570, 450, 280],
      backgroundColor: ['#893843', '#ef4444', '#3b82f6', '#10b981']
    }]
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">True Cost Analysis</h1>
        </div>
        <p className="text-xl text-gray-600">
          Exposing the hidden costs of Queensland's failed youth justice system
        </p>
      </div>

      {/* Key Findings Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 mb-2">Critical Finding: $713 Per Day Hidden Costs</h3>
            <p className="text-red-700">
              Queensland Audit Office reveals the true cost of youth detention is $1,570 per day - 
              83% higher than the $857 officially reported. This represents $713 in hidden costs 
              taxpayers are not told about.
            </p>
          </div>
        </div>
      </div>

      {/* Total Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <DollarSign className="w-8 h-8 text-qld-maroon mb-2" />
          <p className="text-3xl font-bold text-gray-900">$1.38B</p>
          <p className="text-sm text-gray-600">Total Youth Justice Budget</p>
          <p className="text-xs text-gray-500 mt-1">2025-26 Financial Year</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6">
          <TrendingUp className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-3xl font-bold text-red-600">90.6%</p>
          <p className="text-sm text-gray-700">Spent on Detention</p>
          <p className="text-xs text-red-600 mt-1">↑ 15% from 2019</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <PieChart className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-3xl font-bold text-green-600">9.4%</p>
          <p className="text-sm text-gray-700">Community Programs</p>
          <p className="text-xs text-green-600 mt-1">↓ 8% from 2019</p>
        </div>
        <div className="bg-amber-50 rounded-lg shadow p-6">
          <Calculator className="w-8 h-8 text-amber-600 mb-2" />
          <p className="text-3xl font-bold text-amber-600">$573K</p>
          <p className="text-sm text-gray-700">Annual Per Youth</p>
          <p className="text-xs text-amber-600 mt-1">Could fund 20 teachers</p>
        </div>
      </div>

      {/* Cost Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Allocation Breakdown</h3>
          <div className="h-64">
            <Pie data={pieChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return context.label + ': ' + context.parsed.toFixed(1) + '%'
                    }
                  }
                }
              }
            }} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Comparison</h3>
          <div className="h-64">
            <Bar data={costComparisonData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + value
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Hidden Costs Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Hidden Costs Exposed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {costBreakdown.map((cost, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">{cost.category}</h3>
              <div className="flex justify-between items-center mb-3 pb-3 border-b">
                <span className="text-gray-600">Official Daily Cost</span>
                <span className="text-xl font-bold">${cost.officialCost}</span>
              </div>
              
              <div className="space-y-2 mb-3">
                {cost.hiddenCosts.map((hidden, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{hidden.item}</span>
                    <span className="text-red-600">+${hidden.amount}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-bold text-gray-900">True Daily Cost</span>
                <span className="text-2xl font-bold text-red-600">${cost.trueCost}</span>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                Hidden costs: ${cost.trueCost - cost.officialCost} ({((cost.trueCost - cost.officialCost) / cost.officialCost * 100).toFixed(0)}% higher)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Effectiveness Analysis */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">What $1.38 Billion Could Buy Instead</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Education Investment</h3>
            <ul className="space-y-2">
              <li>• 27,600 teachers for one year</li>
              <li>• 138 new schools fully equipped</li>
              <li>• Free laptops for every Queensland student</li>
              <li>• 10 years of breakfast programs statewide</li>
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Community Support</h3>
            <ul className="space-y-2">
              <li>• 9,200 youth workers and counselors</li>
              <li>• 1,380 community youth centers</li>
              <li>• Mental health support for 100,000 families</li>
              <li>• Housing support for 5,000 at-risk youth</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Download Full Cost Analysis</h3>
            <p className="text-gray-600">Detailed breakdown with all sources and calculations</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition">
            <Download className="w-5 h-5" />
            Download Report
          </button>
        </div>
      </div>
    </div>
  )
}