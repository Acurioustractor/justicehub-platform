'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BudgetAllocation {
  id: string
  fiscal_year: string
  department: string | null
  program: string
  category: string | null
  amount: number
  description: string | null
  source_url: string | null
  source_document: string | null
  scraped_date: string
  created_at: string
  updated_at: string
}

interface YouthStatistic {
  id: string
  date: string
  facility_name: string | null
  total_youth: number
  indigenous_youth: number | null
  indigenous_percentage: number | null
  average_age: number | null
  average_stay_days: number | null
  program_type: string | null
  source_url: string | null
  scraped_date: string
  created_at: string
  updated_at: string
}

export function SupabaseDataExample() {
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([])
  const [youthStats, setYouthStats] = useState<YouthStatistic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // Fetch budget allocations
        const { data: budgetData, error: budgetError } = await supabase
          .from('budget_allocations')
          .select('*')
          .order('fiscal_year', { ascending: false })
          .limit(10)
        
        if (budgetError) throw budgetError
        setBudgetAllocations(budgetData || [])
        
        // Fetch youth statistics
        const { data: statsData, error: statsError } = await supabase
          .from('youth_statistics')
          .select('*')
          .order('date', { ascending: false })
          .limit(10)
        
        if (statsError) throw statsError
        setYouthStats(statsData || [])
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Calculate totals
  const detentionTotal = budgetAllocations
    .filter(a => a.category === 'detention')
    .reduce((sum, a) => sum + a.amount, 0)
  
  const communityTotal = budgetAllocations
    .filter(a => a.category === 'community')
    .reduce((sum, a) => sum + a.amount, 0)
  
  const totalBudget = detentionTotal + communityTotal
  
  // Calculate youth statistics averages
  const totalYouth = youthStats.reduce((sum, s) => sum + s.total_youth, 0)
  const totalIndigenous = youthStats.reduce((sum, s) => sum + (s.indigenous_youth || 0), 0)
  const indigenousPercentage = totalYouth > 0 ? (totalIndigenous / totalYouth * 100).toFixed(1) : '0'
  
  if (loading) {
    return <div className="p-4">Loading data from Supabase...</div>
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>
  }
  
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Queensland Youth Justice Data (from Supabase)</h1>
      
      {/* Budget Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Budget Allocations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Total Budget</h3>
            <p className="text-2xl font-bold">${(totalBudget / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Detention Spending</h3>
            <p className="text-2xl font-bold">${(detentionTotal / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-gray-500">
              {totalBudget > 0 ? ((detentionTotal / totalBudget) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Community Programs</h3>
            <p className="text-2xl font-bold">${(communityTotal / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-gray-500">
              {totalBudget > 0 ? ((communityTotal / totalBudget) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
        
        {/* Budget Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Fiscal Year</th>
                <th className="px-4 py-2 text-left">Program</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {budgetAllocations.map((allocation) => (
                <tr key={allocation.id} className="border-t">
                  <td className="px-4 py-2">{allocation.fiscal_year}</td>
                  <td className="px-4 py-2">{allocation.program}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      allocation.category === 'detention' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {allocation.category}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${(allocation.amount / 1000000).toFixed(2)}M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Youth Statistics Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Youth Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Total Youth in System</h3>
            <p className="text-2xl font-bold">{totalYouth}</p>
            <p className="text-sm text-gray-500">Across {youthStats.length} reports</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Indigenous Youth</h3>
            <p className="text-2xl font-bold">{totalIndigenous}</p>
            <p className="text-sm text-gray-500">{indigenousPercentage}% of total</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-600">Average Stay</h3>
            <p className="text-2xl font-bold">
              {youthStats[0]?.average_stay_days?.toFixed(1) || 'N/A'} days
            </p>
            <p className="text-sm text-gray-500">Latest data</p>
          </div>
        </div>
        
        {/* Youth Statistics Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Facility</th>
                <th className="px-4 py-2 text-center">Total Youth</th>
                <th className="px-4 py-2 text-center">Indigenous</th>
                <th className="px-4 py-2 text-center">Indigenous %</th>
                <th className="px-4 py-2 text-center">Avg Stay (days)</th>
              </tr>
            </thead>
            <tbody>
              {youthStats.map((stat) => (
                <tr key={stat.id} className="border-t">
                  <td className="px-4 py-2">
                    {new Date(stat.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{stat.facility_name || 'All facilities'}</td>
                  <td className="px-4 py-2 text-center">{stat.total_youth}</td>
                  <td className="px-4 py-2 text-center">{stat.indigenous_youth || '-'}</td>
                  <td className="px-4 py-2 text-center">
                    {stat.indigenous_percentage?.toFixed(1) || '-'}%
                  </td>
                  <td className="px-4 py-2 text-center">
                    {stat.average_stay_days?.toFixed(1) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* API Usage Example */}
      <section className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Using the API Endpoints</h3>
        <p className="text-sm text-gray-600 mb-2">
          You can also fetch this data using our API endpoints:
        </p>
        <ul className="text-sm space-y-1 font-mono">
          <li>GET /api/budget-allocations</li>
          <li>GET /api/youth-statistics</li>
          <li>GET /api/cost-comparisons</li>
          <li>GET /api/hidden-costs</li>
          <li>GET /api/parliamentary-documents</li>
        </ul>
      </section>
    </div>
  )
}