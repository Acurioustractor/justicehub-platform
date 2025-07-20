'use client'

import { useState } from 'react'
import { Bar } from 'react-chartjs-2'

export default function HiddenCosts() {
  const [selectedLocation, setSelectedLocation] = useState('mount-isa')

  const costData = {
    'mount-isa': {
      travel: 450,
      phone: 200,
      lostWages: 800,
      total: 2350,
      distance: '1,400km'
    },
    'cairns': {
      travel: 250,
      phone: 200,
      lostWages: 400,
      total: 1250,
      distance: '800km'
    },
    'townsville': {
      travel: 180,
      phone: 200,
      lostWages: 400,
      total: 980,
      distance: '600km'
    }
  }

  const currentData = costData[selectedLocation as keyof typeof costData]

  const chartData = {
    labels: ['Travel', 'Phone Calls', 'Lost Wages'],
    datasets: [{
      label: 'Monthly Cost',
      data: [currentData.travel, currentData.phone, currentData.lostWages],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderColor: ['#2563EB', '#059669', '#D97706'],
      borderWidth: 1
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value
          }
        }
      }
    }
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-2">Hidden Family Costs</h2>
      <p className="text-gray-600 mb-6">Costs borne by families that don't appear in government budgets</p>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select family location:
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="mount-isa">Mount Isa ({costData['mount-isa'].distance} round trip)</option>
                <option value="cairns">Cairns ({costData.cairns.distance} round trip)</option>
                <option value="townsville">Townsville ({costData.townsville.distance} round trip)</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Travel costs</span>
                <span className="font-semibold">${currentData.travel}/visit</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Phone calls</span>
                <span className="font-semibold">${currentData.phone}/month</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Lost wages</span>
                <span className="font-semibold">${currentData.lostWages}/month</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-yellow-50 px-3 rounded">
                <span className="font-semibold text-lg">Total family burden</span>
                <span className="font-bold text-xl text-yellow-600">${currentData.total}/month</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Annual cost:</strong> ${(currentData.total * 12).toLocaleString()}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                This hidden cost represents <strong>{((currentData.total * 12) / (857 * 365) * 100).toFixed(1)}%</strong> of the official detention cost
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Monthly Cost Breakdown</h4>
            <div className="h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}