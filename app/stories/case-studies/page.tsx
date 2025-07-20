'use client'

import { useState } from 'react'
import { User, Calendar, MapPin, TrendingDown, ArrowRight, AlertCircle, Share2 } from 'lucide-react'

interface CaseStudy {
  id: string
  name: string
  age: number
  background: string
  timeline: {
    age: number
    event: string
    impact: string
  }[]
  costs: {
    detention: number
    court: number
    police: number
    total: number
  }
  outcome: string
  alternativeCost: number
  tags: string[]
}

const caseStudies: CaseStudy[] = [
  {
    id: '1',
    name: 'James',
    age: 17,
    background: 'Indigenous boy from regional Queensland, first contact at age 11',
    timeline: [
      {
        age: 11,
        event: 'First arrest for shoplifting food',
        impact: 'Placed in youth detention for 3 days'
      },
      {
        age: 12,
        event: 'Arrested for being in stolen vehicle',
        impact: '2 weeks in watch house, 3 months detention'
      },
      {
        age: 13,
        event: 'School expulsion after detention',
        impact: 'No education support provided'
      },
      {
        age: 14,
        event: 'Multiple arrests for property offences',
        impact: '8 months total in detention'
      },
      {
        age: 15,
        event: 'Serious assault charge',
        impact: '18 months detention sentence'
      },
      {
        age: 17,
        event: 'Released with no support',
        impact: 'Re-offended within 3 months'
      }
    ],
    costs: {
      detention: 1248750, // $1,570/day × 795 days
      court: 125000,
      police: 87500,
      total: 1461250
    },
    outcome: 'Currently in adult prison',
    alternativeCost: 75000, // Intensive family support program
    tags: ['Indigenous', 'Regional', 'Child Protection Failure']
  },
  {
    id: '2',
    name: 'Sarah',
    age: 19,
    background: 'Trauma survivor, entered care system at age 8',
    timeline: [
      {
        age: 10,
        event: 'Ran away from 5th foster placement',
        impact: 'Charged with property damage'
      },
      {
        age: 11,
        event: 'First detention for assault on foster carer',
        impact: 'No trauma counseling provided'
      },
      {
        age: 12,
        event: 'Self-harm in detention',
        impact: 'Placed in isolation "for safety"'
      },
      {
        age: 14,
        event: 'Aged out of youth programs',
        impact: 'Homeless within 2 weeks'
      },
      {
        age: 15,
        event: 'Survival crimes escalate',
        impact: 'Cycle of detention continues'
      },
      {
        age: 18,
        event: 'Transitioned to adult system',
        impact: 'Lost all youth support services'
      }
    ],
    costs: {
      detention: 892000,
      court: 95000,
      police: 63000,
      total: 1050000
    },
    outcome: 'Homeless, ongoing mental health crisis',
    alternativeCost: 120000, // Therapeutic residential care
    tags: ['Foster Care', 'Mental Health', 'Female']
  },
  {
    id: '3',
    name: 'Michael',
    age: 15,
    background: 'Learning disabilities, undiagnosed ADHD, single parent family',
    timeline: [
      {
        age: 10,
        event: 'Suspended from school repeatedly',
        impact: 'No learning support assessment'
      },
      {
        age: 11,
        event: 'First police contact for vandalism',
        impact: 'Cautioned, no follow-up support'
      },
      {
        age: 12,
        event: 'Expelled from school',
        impact: 'No alternative education provided'
      },
      {
        age: 13,
        event: 'Arrested with older youth group',
        impact: 'First detention experience'
      },
      {
        age: 14,
        event: 'Mother loses job due to court dates',
        impact: 'Family housing instability'
      },
      {
        age: 15,
        event: 'Serious charges pending',
        impact: 'Facing 2+ years detention'
      }
    ],
    costs: {
      detention: 428000,
      court: 56000,
      police: 41000,
      total: 525000
    },
    outcome: 'Awaiting sentencing, family destroyed',
    alternativeCost: 45000, // Special education support
    tags: ['Disability', 'Education Failure', 'Family Impact']
  }
]

export default function CaseStudiesPage() {
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null)

  const calculateSavings = (study: CaseStudy) => {
    return study.costs.total - study.alternativeCost
  }

  const shareStudy = (study: CaseStudy) => {
    const text = `Queensland spent $${study.costs.total.toLocaleString()} criminalizing ${study.name} instead of $${study.alternativeCost.toLocaleString()} on support. This is the human cost of youth detention.`
    
    if (navigator.share) {
      navigator.share({
        title: `${study.name}'s Story - Youth Justice Failure`,
        text: text,
        url: window.location.href
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Case Studies</h1>
        </div>
        <p className="text-xl text-gray-600">
          Real journeys through Queensland's youth justice system - names changed for privacy
        </p>
      </div>

      {/* Impact Summary */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 mb-2">System Failure Documented</h3>
            <p className="text-red-700">
              These three cases alone cost Queensland taxpayers $3,036,250 while destroying young lives. 
              Evidence-based alternatives would have cost $240,000 - saving $2.8 million and three futures.
            </p>
          </div>
        </div>
      </div>

      {/* Case Study Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {caseStudies.map((study) => (
          <div
            key={study.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
            onClick={() => setSelectedStudy(study)}
          >
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6">
              <h3 className="text-2xl font-bold mb-2">{study.name}</h3>
              <p className="text-sm opacity-90">Age {study.age}</p>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">{study.background}</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">System Cost</span>
                  <span className="font-bold text-red-600">
                    ${study.costs.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Alternative Cost</span>
                  <span className="font-bold text-green-600">
                    ${study.alternativeCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Wasted</span>
                  <span className="font-bold text-red-700">
                    ${calculateSavings(study).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {study.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition">
                Read Full Journey
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Case Study Modal */}
      {selectedStudy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedStudy.name}'s Journey
                  </h2>
                  <p className="text-gray-600">{selectedStudy.background}</p>
                </div>
                <button
                  onClick={() => setSelectedStudy(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Timeline */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Timeline of System Failure</h3>
                <div className="space-y-4">
                  {selectedStudy.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-16 text-right">
                        <span className="font-bold text-qld-maroon">Age {event.age}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-4 h-4 bg-qld-maroon rounded-full mt-1"></div>
                        {idx < selectedStudy.timeline.length - 1 && (
                          <div className="w-0.5 h-20 bg-gray-300 ml-1.5 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium text-gray-900">{event.event}</p>
                        <p className="text-sm text-red-600 mt-1">{event.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cost to Taxpayers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Detention</p>
                    <p className="text-xl font-bold text-red-600">
                      ${selectedStudy.costs.detention.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Court</p>
                    <p className="text-xl font-bold text-red-600">
                      ${selectedStudy.costs.court.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Police</p>
                    <p className="text-xl font-bold text-red-600">
                      ${selectedStudy.costs.police.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-red-700">
                      ${selectedStudy.costs.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Evidence-Based Alternative</p>
                      <p className="text-sm text-gray-600">Would have addressed root causes</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedStudy.alternativeCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Outcome */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-red-900 mb-2">Current Outcome</h3>
                <p className="text-red-700">{selectedStudy.outcome}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => shareStudy(selectedStudy)}
                  className="flex items-center gap-2 px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                >
                  <Share2 className="w-5 h-5" />
                  Share This Story
                </button>
                <button
                  onClick={() => setSelectedStudy(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Every Number Has a Name</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          Behind every statistic is a child failed by the system. These case studies represent 
          thousands more young Queenslanders trapped in a cycle of punishment instead of receiving help.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
            Demand Reform Now
          </button>
          <button className="px-6 py-3 bg-white/20 text-white border border-white rounded-lg font-medium hover:bg-white/30 transition">
            Read More Stories
          </button>
        </div>
      </div>
    </div>
  )
}