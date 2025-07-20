'use client'

import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { formatCurrency } from '@/lib/utils'
import MetricCard from '@/components/MetricCard'
import AllocationsTable from '@/components/AllocationsTable'

ChartJS.register(ArcElement, Tooltip, Legend)

interface SpendingData {
  total_budget: number
  detention_total: number
  community_total: number
  detention_percentage: number
  community_percentage: number
  detention_daily_cost: number
  community_daily_cost: number
  cost_ratio: number
  allocations: any[]
}

export default function SpendingPage() {
  const [data, setData] = useState<SpendingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/spending')
        if (!response.ok) throw new Error('Failed to fetch spending data')
        const data = await response.json()
        setData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-qld-maroon"></div></div>
    )
  }

  if (error || !data) {
    return <div className="p-8 text-red-600">Error: {error || 'No data available'}</div>
  }

  const spendingChartData = {
    labels: ['Detention', 'Community Programs'],
    datasets: [{
      label: 'Budget Allocation',
      data: [data.detention_total, data.community_total],
      backgroundColor: ['#EF4444', '#10B981'],
      borderColor: ['#DC2626', '#059669'],
      borderWidth: 1
    }]
  }

  const spendingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = formatCurrency(context.parsed)
            const percentage = context.dataIndex === 0 
              ? data.detention_percentage 
              : data.community_percentage
            return `${label}: ${value} (${percentage.toFixed(1)}%)`
          }
        }
      }
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold">Spending</h1>
      <p className="text-gray-600 mt-2 mb-8">A detailed breakdown of financials, including budget allocations, expenditure trends, and cost comparisons.</p>
      
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Youth Justice Budget"
            value={formatCurrency(data.total_budget)}
            subtitle="Annual spending"
            variant="primary"
          />
          <MetricCard
            title="Detention Spending"
            value={formatCurrency(data.detention_total)}
            subtitle={`${data.detention_percentage.toFixed(1)}% of budget`}
            variant="danger"
          />
          <MetricCard
            title="Community Programs"
            value={formatCurrency(data.community_total)}
            subtitle={`${data.community_percentage.toFixed(1)}% of budget`}
            variant="success"
          />
          <MetricCard
            title="Cost Ratio"
            value={`${data.cost_ratio.toFixed(1)}x`}
            subtitle="Detention vs Community"
            variant="warning"
          />
        </div>
      </section>

      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-4">Spending Split</h3>
            <div className="h-80">
              <Doughnut data={spendingChartData} options={spendingChartOptions} />
            </div>
          </div>
          <AllocationsTable allocations={data.allocations} />
        </div>
      </section>
    </div>
  )
}
