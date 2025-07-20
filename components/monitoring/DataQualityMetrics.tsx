'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface DataQualityMetric {
  id: number
  data_source: string
  metric_date: string
  completeness_score: number
  validation_pass_rate: number
  missing_fields: string[]
  validation_failures: any[]
  anomalies_detected: any[]
  record_count: number
  expected_record_count: number | null
}

interface Props {
  lastRefresh: Date
}

export function DataQualityMetrics({ lastRefresh }: Props) {
  const [metrics, setMetrics] = useState<DataQualityMetric[]>([])
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchDataQualityMetrics()
  }, [lastRefresh, selectedSource])

  const fetchDataQualityMetrics = async () => {
    setLoading(true)
    try {
      // Fetch latest metrics
      let query = supabase
        .from('data_quality_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(50)

      if (selectedSource !== 'all') {
        query = query.eq('data_source', selectedSource)
      }

      const { data: metricsData, error: metricsError } = await query

      if (metricsError) throw metricsError
      setMetrics(metricsData || [])

      // Fetch historical data for charts
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let historicalQuery = supabase
        .from('data_quality_metrics')
        .select('metric_date, data_source, completeness_score, validation_pass_rate, record_count')
        .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('metric_date')

      if (selectedSource !== 'all') {
        historicalQuery = historicalQuery.eq('data_source', selectedSource)
      }

      const { data: historicalData, error: historicalError } = await historicalQuery

      if (historicalError) throw historicalError

      // Process historical data for charts
      const processedData = processHistoricalData(historicalData || [])
      setHistoricalData(processedData)
    } catch (error) {
      console.error('Error fetching data quality metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processHistoricalData = (data: any[]) => {
    const grouped = data.reduce((acc: any, item: any) => {
      const date = item.metric_date
      if (!acc[date]) {
        acc[date] = {
          date,
          avgCompleteness: 0,
          avgValidation: 0,
          totalRecords: 0,
          count: 0
        }
      }
      acc[date].avgCompleteness += item.completeness_score
      acc[date].avgValidation += item.validation_pass_rate
      acc[date].totalRecords += item.record_count
      acc[date].count += 1
      return acc
    }, {})

    return Object.values(grouped).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completeness: Math.round(item.avgCompleteness / item.count),
      validation: Math.round(item.avgValidation / item.count),
      records: item.totalRecords
    }))
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-900/20 border-green-800'
    if (score >= 70) return 'bg-yellow-900/20 border-yellow-800'
    return 'bg-red-900/20 border-red-800'
  }

  const dataSources = [
    'all',
    'parliament_hansard',
    'parliament_committees',
    'parliament_qon',
    'treasury_budget',
    'budget_website',
    'youth_statistics'
  ]

  // Calculate radar chart data
  const radarData = metrics.reduce((acc: any[], metric) => {
    const existing = acc.find(item => item.source === metric.data_source)
    if (existing) {
      existing.completeness = metric.completeness_score
      existing.validation = metric.validation_pass_rate
      existing.coverage = metric.expected_record_count 
        ? (metric.record_count / metric.expected_record_count) * 100 
        : 100
    } else {
      acc.push({
        source: metric.data_source.replace(/_/g, ' '),
        completeness: metric.completeness_score,
        validation: metric.validation_pass_rate,
        coverage: metric.expected_record_count 
          ? (metric.record_count / metric.expected_record_count) * 100 
          : 100
      })
    }
    return acc
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qld-gold"></div>
      </div>
    )
  }

  // Calculate overall scores
  const avgCompleteness = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.completeness_score, 0) / metrics.length
    : 0
  const avgValidation = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.validation_pass_rate, 0) / metrics.length
    : 0
  const totalAnomalies = metrics.reduce((sum, m) => sum + m.anomalies_detected.length, 0)
  const totalMissingFields = metrics.reduce((sum, m) => sum + m.missing_fields.length, 0)

  return (
    <div className="space-y-6">
      {/* Source Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400">Data Source:</label>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-4 py-2"
        >
          {dataSources.map(source => (
            <option key={source} value={source}>
              {source === 'all' ? 'All Sources' : source.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 border ${getScoreBgColor(avgCompleteness)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Avg Completeness</p>
            <span className="text-2xl">📊</span>
          </div>
          <p className={`text-3xl font-bold ${getScoreColor(avgCompleteness)}`}>
            {avgCompleteness.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl p-6 border ${getScoreBgColor(avgValidation)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Validation Pass Rate</p>
            <span className="text-2xl">✅</span>
          </div>
          <p className={`text-3xl font-bold ${getScoreColor(avgValidation)}`}>
            {avgValidation.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-yellow-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Anomalies Detected</p>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{totalAnomalies}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-red-900"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400">Missing Fields</p>
            <span className="text-2xl">❌</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{totalMissingFields}</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Trends */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold mb-4">Quality Trends (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="completeness"
                stroke="#10B981"
                strokeWidth={2}
                name="Completeness %"
                dot={{ fill: '#10B981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="validation"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Validation %"
                dot={{ fill: '#3B82F6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold mb-4">Source Quality Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="source" stroke="#9CA3AF" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
              <Radar
                name="Completeness"
                dataKey="completeness"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Radar
                name="Validation"
                dataKey="validation"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Radar
                name="Coverage"
                dataKey="coverage"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Detailed Quality Metrics</h3>
        {metrics.slice(0, 5).map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold">{metric.data_source.replace(/_/g, ' ')}</h4>
                <p className="text-sm text-gray-400">
                  {new Date(metric.metric_date).toLocaleDateString()} - {metric.record_count} records
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Completeness</p>
                  <p className={`text-2xl font-bold ${getScoreColor(metric.completeness_score)}`}>
                    {metric.completeness_score}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Validation</p>
                  <p className={`text-2xl font-bold ${getScoreColor(metric.validation_pass_rate)}`}>
                    {metric.validation_pass_rate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Issues */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metric.missing_fields.length > 0 && (
                <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
                  <p className="text-sm font-medium text-red-400 mb-2">Missing Fields</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {metric.missing_fields.slice(0, 3).map((field, i) => (
                      <li key={i}>• {field}</li>
                    ))}
                    {metric.missing_fields.length > 3 && (
                      <li className="text-gray-500">
                        +{metric.missing_fields.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {metric.validation_failures.length > 0 && (
                <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800">
                  <p className="text-sm font-medium text-yellow-400 mb-2">Validation Failures</p>
                  <p className="text-xs text-gray-300">
                    {metric.validation_failures.length} records failed validation
                  </p>
                </div>
              )}

              {metric.anomalies_detected.length > 0 && (
                <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-800">
                  <p className="text-sm font-medium text-purple-400 mb-2">Anomalies</p>
                  <p className="text-xs text-gray-300">
                    {metric.anomalies_detected.length} anomalies detected
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}