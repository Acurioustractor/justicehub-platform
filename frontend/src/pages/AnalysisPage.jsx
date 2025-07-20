import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { apiService } from '../lib/api'

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalysisData()
  }, [])

  const fetchAnalysisData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to fetch analysis from backend first
      try {
        const analysisResponse = await apiService.getAnalysisData()
        if (analysisResponse && !analysisResponse.demo_mode) {
          setAnalysisData(analysisResponse)
          return
        }
      } catch (apiError) {
        console.log('API analysis failed, trying direct CSV fetch')
      }
      
      // Fallback: Fetch the CSV data directly and process it
      try {
        const response = await fetch(`${apiService.baseURL}/data/dyjvs-payments`)
        if (response.ok) {
          const csvText = await response.text()
          const processedData = processCSVData(csvText)
          setAnalysisData(processedData)
          return
        }
      } catch (csvError) {
        console.log('Direct CSV fetch failed, using demo data')
      }
      
      // Final fallback: Use demo data
      throw new Error('Unable to fetch real data - using demo data')
      
    } catch (err) {
      console.error('Analysis fetch error:', err)
      setError('Using demo data - live data unavailable')
      setAnalysisData(generateDemoData())
    } finally {
      setLoading(false)
    }
  }

  const processCSVData = (csvText) => {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).filter(line => line.trim())

    const data = rows.map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row = {}
      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })
      return row
    })

    return analyzeData(data, headers)
  }

  const analyzeData = (data, headers) => {
    // Find amount and supplier columns dynamically
    const amountCol = headers.find(h => 
      h.toLowerCase().includes('amount') || 
      h.toLowerCase().includes('value') || 
      h.toLowerCase().includes('total')
    )
    
    const supplierCol = headers.find(h => 
      h.toLowerCase().includes('supplier') || 
      h.toLowerCase().includes('vendor') || 
      h.toLowerCase().includes('company')
    )
    
    const descCol = headers.find(h => 
      h.toLowerCase().includes('description') || 
      h.toLowerCase().includes('service') || 
      h.toLowerCase().includes('details')
    )

    // Process amounts
    const validData = data.filter(row => row[amountCol])
    validData.forEach(row => {
      const amountStr = String(row[amountCol]).replace(/[$,]/g, '')
      row._amount = parseFloat(amountStr) || 0
    })

    // Categorize services
    const serviceCategories = {
      'Detention Services': ['detention', 'custody', 'secure', 'centre', 'correctional'],
      'Community Services': ['community', 'supervision', 'probation', 'outreach'],
      'Support Services': ['counselling', 'mental health', 'support', 'welfare'],
      'Legal Services': ['legal', 'court', 'advocacy', 'representation'],
      'Education Services': ['education', 'training', 'school', 'learning'],
      'Health Services': ['health', 'medical', 'therapy', 'clinical'],
      'Administration': ['admin', 'management', 'overhead', 'corporate']
    }

    validData.forEach(row => {
      const text = `${row[supplierCol]} ${row[descCol]}`.toLowerCase()
      row._category = 'Other'
      
      for (const [category, keywords] of Object.entries(serviceCategories)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          row._category = category
          break
        }
      }
    })

    // Calculate statistics
    const totalAmount = validData.reduce((sum, row) => sum + row._amount, 0)
    const avgAmount = totalAmount / validData.length
    
    // Category analysis
    const categoryStats = {}
    Object.keys(serviceCategories).forEach(cat => {
      const catData = validData.filter(row => row._category === cat)
      categoryStats[cat] = {
        count: catData.length,
        total: catData.reduce((sum, row) => sum + row._amount, 0),
        avg: catData.length > 0 ? catData.reduce((sum, row) => sum + row._amount, 0) / catData.length : 0
      }
    })

    // Supplier analysis
    const supplierStats = {}
    validData.forEach(row => {
      const supplier = row[supplierCol] || 'Unknown'
      if (!supplierStats[supplier]) {
        supplierStats[supplier] = { count: 0, total: 0 }
      }
      supplierStats[supplier].count++
      supplierStats[supplier].total += row._amount
    })

    // Top suppliers
    const topSuppliers = Object.entries(supplierStats)
      .map(([name, stats]) => ({ name, ...stats, avg: stats.total / stats.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)

    // Large payments (outliers)
    const sortedAmounts = validData.map(row => row._amount).sort((a, b) => b - a)
    const top1Percent = Math.ceil(sortedAmounts.length * 0.01)
    const largePayments = validData
      .filter(row => row._amount >= sortedAmounts[top1Percent])
      .sort((a, b) => b._amount - a._amount)
      .slice(0, 10)

    return {
      summary: {
        totalRecords: validData.length,
        totalAmount,
        avgAmount,
        dateRange: 'Current Financial Year',
        uniqueSuppliers: Object.keys(supplierStats).length
      },
      categories: categoryStats,
      suppliers: topSuppliers,
      largePayments,
      rawData: validData.slice(0, 100), // Sample for table
      columns: headers
    }
  }

  const generateDemoData = () => {
    // Comprehensive demo data showing realistic youth justice spending patterns
    return {
      summary: {
        totalRecords: 3247,
        totalAmount: 52847891.50,
        avgAmount: 16276.45,
        dateRange: '2024-25 Financial Year',
        uniqueSuppliers: 387
      },
      categories: {
        'Detention Services': { count: 1450, total: 22100000, avg: 15241.38 },
        'Community Services': { count: 920, total: 14200000, avg: 15434.78 },
        'Support Services': { count: 485, total: 7800000, avg: 16082.47 },
        'Legal Services': { count: 210, total: 3900000, avg: 18571.43 },
        'Education Services': { count: 112, total: 2700000, avg: 24107.14 },
        'Health Services': { count: 70, total: 2147891.50, avg: 30684.16 }
      },
      suppliers: [
        { name: 'Youth Justice Centre Brisbane', count: 52, total: 3240000, avg: 62307.69 },
        { name: 'Community Corrections QLD', count: 89, total: 2450000, avg: 27528.09 },
        { name: 'Mental Health Support Services', count: 38, total: 2180000, avg: 57368.42 },
        { name: 'Legal Aid Queensland', count: 167, total: 1890000, avg: 11317.37 },
        { name: 'Youth Education Programs Inc', count: 31, total: 1650000, avg: 53225.81 },
        { name: 'Community Outreach Services', count: 74, total: 1420000, avg: 19189.19 },
        { name: 'Rehabilitation Programs Ltd', count: 28, total: 1380000, avg: 49285.71 },
        { name: 'Family Support Network', count: 95, total: 1340000, avg: 14105.26 },
        { name: 'Crisis Intervention Team', count: 43, total: 1180000, avg: 27441.86 },
        { name: 'Vocational Training Institute', count: 22, total: 1050000, avg: 47727.27 }
      ],
      largePayments: [
        { 'Supplier Name': 'Youth Justice Centre Construction', 'Description': 'Facility Upgrade Project - Security Systems', _amount: 650000 },
        { 'Supplier Name': 'IT Systems Implementation', 'Description': 'Statewide Case Management System Rollout', _amount: 485000 },
        { 'Supplier Name': 'Security Services Pty Ltd', 'Description': 'Annual Security Services Contract', _amount: 420000 },
        { 'Supplier Name': 'Mental Health Crisis Unit', 'Description': 'Emergency Response Team Setup', _amount: 380000 },
        { 'Supplier Name': 'Educational Assessment Services', 'Description': 'Comprehensive Learning Support Program', _amount: 295000 },
        { 'Supplier Name': 'Medical Equipment Suppliers', 'Description': 'Health Facility Equipment Upgrade', _amount: 275000 },
        { 'Supplier Name': 'Legal Advocacy Network', 'Description': 'Complex Case Legal Representation', _amount: 245000 },
        { 'Supplier Name': 'Community Housing Initiative', 'Description': 'Transitional Housing Program Setup', _amount: 220000 }
      ],
      rawData: [
        { 'Invoice Date': '2024-07-12', 'Supplier Name': 'Youth Justice Centre Brisbane', 'Description': 'Monthly operational costs - accommodation and supervision', 'Amount': '$58,250.00', _amount: 58250, _category: 'Detention Services' },
        { 'Invoice Date': '2024-07-11', 'Supplier Name': 'Legal Aid Queensland', 'Description': 'Court representation for complex youth cases', 'Amount': '$15,400.00', _amount: 15400, _category: 'Legal Services' },
        { 'Invoice Date': '2024-07-10', 'Supplier Name': 'Community Outreach Services', 'Description': 'Intensive supervision program delivery', 'Amount': '$23,750.00', _amount: 23750, _category: 'Community Services' },
        { 'Invoice Date': '2024-07-09', 'Supplier Name': 'Mental Health Support Services', 'Description': 'Psychological assessment and therapy sessions', 'Amount': '$31,200.00', _amount: 31200, _category: 'Support Services' },
        { 'Invoice Date': '2024-07-08', 'Supplier Name': 'Youth Education Programs Inc', 'Description': 'Specialized educational support and tutoring', 'Amount': '$19,850.00', _amount: 19850, _category: 'Education Services' },
        { 'Invoice Date': '2024-07-05', 'Supplier Name': 'Family Support Network', 'Description': 'Family counselling and mediation services', 'Amount': '$12,600.00', _amount: 12600, _category: 'Support Services' },
        { 'Invoice Date': '2024-07-04', 'Supplier Name': 'Crisis Intervention Team', 'Description': '24/7 emergency response and crisis support', 'Amount': '$44,300.00', _amount: 44300, _category: 'Support Services' },
        { 'Invoice Date': '2024-07-03', 'Supplier Name': 'Vocational Training Institute', 'Description': 'Skills development and job readiness programs', 'Amount': '$28,750.00', _amount: 28750, _category: 'Education Services' },
        { 'Invoice Date': '2024-07-02', 'Supplier Name': 'Community Corrections QLD', 'Description': 'Community service order supervision', 'Amount': '$17,450.00', _amount: 17450, _category: 'Community Services' },
        { 'Invoice Date': '2024-07-01', 'Supplier Name': 'Rehabilitation Programs Ltd', 'Description': 'Substance abuse treatment and counselling', 'Amount': '$35,200.00', _amount: 35200, _category: 'Support Services' },
        { 'Invoice Date': '2024-06-28', 'Supplier Name': 'Health Services Coordination', 'Description': 'Medical assessments and health monitoring', 'Amount': '$26,800.00', _amount: 26800, _category: 'Health Services' },
        { 'Invoice Date': '2024-06-27', 'Supplier Name': 'Indigenous Support Services', 'Description': 'Cultural programs and elder mentoring', 'Amount': '$22,150.00', _amount: 22150, _category: 'Support Services' },
        { 'Invoice Date': '2024-06-26', 'Supplier Name': 'Technology Training Center', 'Description': 'Digital literacy and computer skills training', 'Amount': '$14,900.00', _amount: 14900, _category: 'Education Services' },
        { 'Invoice Date': '2024-06-25', 'Supplier Name': 'Transport Coordination Services', 'Description': 'Court appearance and program transport', 'Amount': '$8,650.00', _amount: 8650, _category: 'Administration' },
        { 'Invoice Date': '2024-06-24', 'Supplier Name': 'Peer Support Network', 'Description': 'Youth-led mentoring and support programs', 'Amount': '$16,400.00', _amount: 16400, _category: 'Support Services' },
        { 'Invoice Date': '2024-06-21', 'Supplier Name': 'Art Therapy Collective', 'Description': 'Creative arts therapy and expression programs', 'Amount': '$11,250.00', _amount: 11250, _category: 'Health Services' },
        { 'Invoice Date': '2024-06-20', 'Supplier Name': 'Sports and Recreation Inc', 'Description': 'Physical activity and team building programs', 'Amount': '$13,800.00', _amount: 13800, _category: 'Education Services' },
        { 'Invoice Date': '2024-06-19', 'Supplier Name': 'Restorative Justice Facilitators', 'Description': 'Victim-offender mediation and conferencing', 'Amount': '$19,500.00', _amount: 19500, _category: 'Legal Services' },
        { 'Invoice Date': '2024-06-18', 'Supplier Name': 'Emergency Accommodation Services', 'Description': 'Temporary housing for youth in crisis', 'Amount': '$32,750.00', _amount: 32750, _category: 'Support Services' },
        { 'Invoice Date': '2024-06-17', 'Supplier Name': 'Case Management Solutions', 'Description': 'Individual case planning and coordination', 'Amount': '$24,600.00', _amount: 24600, _category: 'Administration' }
      ],
      columns: ['Invoice Date', 'Supplier Name', 'Description', 'Amount']
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalysisData()
    setRefreshing(false)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1) + '%'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Spending Data</h2>
          <p className="text-gray-600">Processing youth justice payment records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Spending Analysis Dashboard</h1>
              <p className="text-lg text-gray-600">Youth Justice Financial Analysis & Insights</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800">Using demo data - API connection failed: {error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spending</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analysisData?.summary.totalAmount || 0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{(analysisData?.summary.totalRecords || 0).toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Payment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analysisData?.summary.avgAmount || 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unique Suppliers</p>
                <p className="text-2xl font-bold text-gray-900">{(analysisData?.summary.uniqueSuppliers || 0).toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Service Categories Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Service Category</h3>
            <div className="space-y-4">
              {Object.entries(analysisData?.categories || {}).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                      <span className="text-sm text-gray-500">{formatCurrency(stats.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: formatPercentage(stats.total, analysisData?.summary.totalAmount || 1)
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{stats.count} payments</span>
                      <span>{formatPercentage(stats.total, analysisData?.summary.totalAmount || 1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h3>
            <div className="space-y-3">
              {(analysisData?.suppliers || []).slice(0, 10).map((supplier, index) => (
                <div key={supplier.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.count} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(supplier.total)}</p>
                    <p className="text-xs text-gray-500">Avg: {formatCurrency(supplier.avg)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Payments Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Largest Payments (Top 1%)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(analysisData?.largePayments || []).map((payment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment['Supplier Name'] || payment.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {payment['Description'] || payment.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment._amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment._amount > 200000 ? 'bg-red-100 text-red-800' :
                        payment._amount > 100000 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {payment._amount > 200000 ? 'High' : payment._amount > 100000 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments Sample</h3>
            <span className="text-sm text-gray-500">Showing latest {analysisData?.rawData?.length || 0} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {(analysisData?.columns || []).map((column) => (
                    <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(analysisData?.rawData || []).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {(analysisData?.columns || []).map((column) => (
                      <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[column]}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {row._category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}