'use client'

import { Calendar, Clock, RefreshCw, CheckCircle, AlertCircle, Bell } from 'lucide-react'

interface ScheduleItem {
  source: string
  frequency: string
  nextUpdate: string
  lastUpdate: string
  status: 'active' | 'delayed' | 'maintenance'
  description: string
  dataTypes: string[]
}

const updateSchedule: ScheduleItem[] = [
  {
    source: 'Australian Institute of Health and Welfare',
    frequency: 'Weekly (Monday 6 AM)',
    nextUpdate: '2024-03-04 06:00',
    lastUpdate: '2024-02-26 06:15',
    status: 'active',
    description: 'National youth justice statistics including Indigenous overrepresentation data',
    dataTypes: ['Youth Statistics', 'Indigenous Data', 'Supervision Rates']
  },
  {
    source: 'Queensland Treasury',
    frequency: 'Weekly (Monday 8 AM)',
    nextUpdate: '2024-03-04 08:00',
    lastUpdate: '2024-02-26 08:03',
    status: 'active',
    description: 'Budget allocations and spending analysis for youth justice',
    dataTypes: ['Budget Data', 'Spending Analysis', 'Cost Comparisons']
  },
  {
    source: "Children's Court of Queensland",
    frequency: 'Weekly (Tuesday 1 PM)',
    nextUpdate: '2024-03-05 13:00',
    lastUpdate: '2024-02-27 13:12',
    status: 'active',
    description: 'Court statistics, sentencing data, and bail information',
    dataTypes: ['Court Statistics', 'Sentencing', 'Demographics']
  },
  {
    source: 'Queensland Police Service',
    frequency: 'Weekly (Tuesday 2 PM)',
    nextUpdate: '2024-03-05 14:00',
    lastUpdate: '2024-02-27 14:08',
    status: 'delayed',
    description: 'Youth crime statistics and offender demographics',
    dataTypes: ['Crime Data', 'Offender Profiles', 'Regional Statistics']
  },
  {
    source: 'Department of Youth Justice',
    frequency: 'Weekly (Tuesday 12 PM)',
    nextUpdate: '2024-03-05 12:00',
    lastUpdate: '2024-02-27 12:22',
    status: 'active',
    description: 'Detention centre data and program outcomes',
    dataTypes: ['Detention Stats', 'Program Data', 'Occupancy']
  },
  {
    source: 'RTI Disclosure Logs',
    frequency: 'Weekly (Thursday 3 PM)',
    nextUpdate: '2024-03-07 15:00',
    lastUpdate: '2024-02-29 15:18',
    status: 'active',
    description: 'Government transparency disclosures and hidden data',
    dataTypes: ['RTI Requests', 'Hidden Costs', 'Internal Reports']
  }
]

const maintenanceWindows = [
  {
    date: '2024-03-10',
    time: '2:00 AM - 4:00 AM',
    description: 'Database optimization and backup',
    impact: 'Data updates will be paused'
  },
  {
    date: '2024-03-24',
    time: '3:00 AM - 5:00 AM',
    description: 'Scraper infrastructure upgrade',
    impact: 'Some historical data may be temporarily unavailable'
  }
]

export default function SchedulePage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'delayed': return 'text-amber-600 bg-amber-50'
      case 'maintenance': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'delayed': return <AlertCircle className="w-4 h-4" />
      case 'maintenance': return <RefreshCw className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Update Schedule</h1>
        </div>
        <p className="text-xl text-gray-600">
          When and how our data is refreshed from government sources
        </p>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">Active Scrapers</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">5 of 6</p>
          <p className="text-sm text-green-700">Running normally</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Next Update</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">2h 15m</p>
          <p className="text-sm text-blue-700">AIHW Statistics</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-900">Update Frequency</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">Weekly</p>
          <p className="text-sm text-purple-700">All sources</p>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-bold text-gray-900">Data Source Update Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Types
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {updateSchedule.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.source}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.frequency}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(item.lastUpdate).toLocaleString('en-AU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {new Date(item.nextUpdate).toLocaleString('en-AU')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.dataTypes.map((type, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Windows */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 mb-3">Scheduled Maintenance</h3>
            <div className="space-y-3">
              {maintenanceWindows.map((window, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(window.date).toLocaleDateString('en-AU', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{window.time} AEST</p>
                      <p className="text-sm text-gray-700 mt-1">{window.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600 font-medium">Impact:</p>
                      <p className="text-xs text-gray-600">{window.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe to Updates */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8">
        <div className="flex items-start gap-4">
          <Bell className="w-8 h-8 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Subscribe to Update Notifications</h3>
            <p className="mb-4 opacity-90">
              Get notified when new data is available or when there are changes to the update schedule
            </p>
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              />
              <button className="px-6 py-2 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}