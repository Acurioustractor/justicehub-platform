'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboardData } from '@/hooks/useDashboardData'
import CountUp from 'react-countup'
import { Calculator, School, Home, Heart } from 'lucide-react'

const QUEENSLAND_SUBURBS = [
  'Brisbane CBD', 'South Brisbane', 'West End', 'New Farm', 'Fortitude Valley',
  'Toowong', 'St Lucia', 'Indooroopilly', 'Kenmore', 'Chapel Hill',
  'Gold Coast', 'Surfers Paradise', 'Broadbeach', 'Burleigh Heads', 'Robina',
  'Cairns', 'Townsville', 'Toowoomba', 'Ipswich', 'Logan',
  'Redcliffe', 'Caboolture', 'Sunshine Coast', 'Noosa', 'Caloundra'
]

const TEACHER_SALARY = 85000
const YOUTH_WORKER_SALARY = 65000
const MENTAL_HEALTH_WORKER_SALARY = 75000
const SCHOOL_COUNSELOR_SALARY = 80000

export default function ImpactCalculator() {
  const { data } = useDashboardData()
  const [suburb, setSuburb] = useState('')
  const [showResults, setShowResults] = useState(false)

  if (!data) return null

  const dailyWaste = data.budget.dailyDetentionCost
  const yearlyWaste = data.budget.detentionOperations
  const communityProgramCost = data.budget.dailyCommunityProgramCost

  // Calculate what could be funded
  const teachersPerYear = Math.floor(yearlyWaste / TEACHER_SALARY)
  const youthWorkersPerYear = Math.floor(yearlyWaste / YOUTH_WORKER_SALARY)
  const mentalHealthWorkersPerYear = Math.floor(yearlyWaste / MENTAL_HEALTH_WORKER_SALARY)
  const schoolCounselorsPerYear = Math.floor(yearlyWaste / SCHOOL_COUNSELOR_SALARY)
  
  // Kids who could be helped
  const kidsHelpedPerDay = Math.floor(dailyWaste / communityProgramCost)
  const kidsHelpedPerYear = kidsHelpedPerDay * 365

  const handleCalculate = () => {
    if (suburb) {
      setShowResults(true)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Calculate Impact on Your Community
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Suburb Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your suburb or enter postcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                list="suburbs"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g., Brisbane CBD or 4000"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
              />
              <datalist id="suburbs">
                {QUEENSLAND_SUBURBS.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <Button onClick={handleCalculate}>
                Calculate
              </Button>
            </div>
          </div>

          {/* Results */}
          {showResults && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-900 mb-4">
                  What {suburb || 'Your Community'} Is Missing Out On
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <School className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      <CountUp end={Math.floor(teachersPerYear / 100)} duration={2} />
                    </p>
                    <p className="text-sm text-gray-600">
                      Extra teachers for local schools
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <Heart className="w-8 h-8 text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      <CountUp end={Math.floor(mentalHealthWorkersPerYear / 100)} duration={2} />
                    </p>
                    <p className="text-sm text-gray-600">
                      Mental health workers
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <Home className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      <CountUp end={Math.floor(youthWorkersPerYear / 100)} duration={2} />
                    </p>
                    <p className="text-sm text-gray-600">
                      Youth support workers
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <Calculator className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      <CountUp end={Math.floor(kidsHelpedPerYear / 100)} duration={2} />
                    </p>
                    <p className="text-sm text-gray-600">
                      Kids in community programs
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Impact */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="font-bold text-amber-900 mb-2">Every Single Day</h4>
                <p className="text-amber-800">
                  While the government spends <span className="font-bold">${dailyWaste.toLocaleString()}</span> on 
                  failed detention, {suburb || 'your community'} could instead help{' '}
                  <span className="font-bold">{kidsHelpedPerDay}</span> young people with proven 
                  community programs that actually work.
                </p>
              </div>

              {/* Comparison */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-blue-900 mb-4">The Choice Is Clear</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Current approach (detention):</span>
                    <span className="font-bold text-red-600">{data.police.repeatOffenderPercentage}% reoffend</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Community programs:</span>
                    <span className="font-bold text-green-600">Evidence shows 70%+ success</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Cost difference:</span>
                    <span className="font-bold text-purple-600">{data.budget.costRatio}x more expensive</span>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center pt-4">
                <p className="text-gray-600 mb-4">
                  Your community is being robbed of resources that could actually help young people
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline">
                    Share These Numbers
                  </Button>
                  <Button>
                    Email Your Local MP
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Statewide Impact */}
          {!showResults && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Queensland-Wide Impact</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {teachersPerYear.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Teachers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {youthWorkersPerYear.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Youth Workers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {mentalHealthWorkersPerYear.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Mental Health Staff</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {kidsHelpedPerYear.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Kids Helped</p>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-4">
                Enter your suburb above to see local impact
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}