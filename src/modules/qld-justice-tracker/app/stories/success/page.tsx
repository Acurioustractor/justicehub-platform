'use client'

import { useState } from 'react'
import { Star, TrendingUp, DollarSign, Users, Globe, CheckCircle, ArrowRight } from 'lucide-react'

interface SuccessStory {
  id: string
  location: string
  country: string
  program: string
  description: string
  started: number
  results: {
    metric: string
    improvement: string
    detail: string
  }[]
  costComparison: {
    traditional: number
    alternative: number
    savedPerYouth: number
  }
  keyFeatures: string[]
  quote: string
  quoteSource: string
  scalability: string
  moreInfo: string
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    location: 'Missouri',
    country: 'USA',
    program: 'Missouri Model',
    description: 'Replaced large youth prisons with small, therapeutic facilities focused on rehabilitation',
    started: 1983,
    results: [
      {
        metric: 'Recidivism Rate',
        improvement: '67% reduction',
        detail: 'From 75% to 25% within 3 years'
      },
      {
        metric: 'Education Completion',
        improvement: '84% graduation',
        detail: 'Compared to 12% in traditional detention'
      },
      {
        metric: 'Cost Savings',
        improvement: '$43,000/year saved',
        detail: 'Per youth compared to traditional detention'
      },
      {
        metric: 'Staff Assaults',
        improvement: '91% reduction',
        detail: 'Creating safer environments for all'
      }
    ],
    costComparison: {
      traditional: 125000,
      alternative: 82000,
      savedPerYouth: 43000
    },
    keyFeatures: [
      'Maximum 12 youth per facility',
      'Home-like environment, not cells',
      'Intensive therapy and counseling',
      'Family involvement mandatory',
      'Staff as mentors, not guards',
      'Education and job training focus'
    ],
    quote: "We stopped treating children like criminals and started treating them like children with problems we could solve.",
    quoteSource: "Mark Steward, Former Director",
    scalability: "Replicated in 15 US states with similar success",
    moreInfo: "https://www.aecf.org/resources/the-missouri-model"
  },
  {
    id: '2',
    location: 'Norway',
    country: 'Scandinavia',
    program: 'Restorative Youth Justice',
    description: 'Community-based alternatives with victim reconciliation and family support',
    started: 1991,
    results: [
      {
        metric: 'Youth Detention Rate',
        improvement: '89% reduction',
        detail: 'Only 11 youth in detention nationwide'
      },
      {
        metric: 'Reoffending',
        improvement: '15% rate',
        detail: 'Lowest youth reoffending in Europe'
      },
      {
        metric: 'Victim Satisfaction',
        improvement: '92% approval',
        detail: 'Victims report feeling heard and healed'
      },
      {
        metric: 'Community Safety',
        improvement: '78% safer',
        detail: 'Youth crime decreased dramatically'
      }
    ],
    costComparison: {
      traditional: 180000,
      alternative: 35000,
      savedPerYouth: 145000
    },
    keyFeatures: [
      'Mediation between victim and offender',
      'Community service instead of detention',
      'Mandatory family counseling',
      'Educational continuity guaranteed',
      'Mental health support standard',
      'Age of responsibility raised to 15'
    ],
    quote: "When we invested in healing instead of punishment, both our youth and our communities thrived.",
    quoteSource: "Kristin Bergersen, Justice Ministry",
    scalability: "Model adopted across Nordic countries",
    moreInfo: "https://www.unicef.org/norway/youth-justice"
  },
  {
    id: '3',
    location: 'New Zealand',
    country: 'Pacific',
    program: 'Family Group Conferences',
    description: 'Indigenous-led approach bringing families and communities into justice process',
    started: 1989,
    results: [
      {
        metric: 'Youth Court Cases',
        improvement: '73% reduction',
        detail: 'Most resolved in community'
      },
      {
        metric: 'Indigenous Youth',
        improvement: '58% better outcomes',
        detail: 'Māori youth reconnected to culture'
      },
      {
        metric: 'Family Engagement',
        improvement: '95% participation',
        detail: 'Families actively involved in solutions'
      },
      {
        metric: 'Long-term Success',
        improvement: '82% no reoffense',
        detail: 'After 5 years follow-up'
      }
    ],
    costComparison: {
      traditional: 110000,
      alternative: 15000,
      savedPerYouth: 95000
    },
    keyFeatures: [
      'Extended family included in decisions',
      'Cultural practices integrated',
      'Victim voice central to process',
      'Community creates the plan',
      'Professional support available',
      'Focus on accountability and healing'
    ],
    quote: "By returning to our traditional ways of resolving conflict, we found modern solutions to youth offending.",
    quoteSource: "Judge Carolyn Henwood",
    scalability: "Adapted in Australia, Canada, and UK",
    moreInfo: "https://www.justice.govt.nz/family-group-conferences"
  },
  {
    id: '4',
    location: 'Scotland',
    country: 'UK',
    program: "Children's Hearings System",
    description: 'Welfare-based approach treating youth offending as child protection issue',
    started: 1971,
    results: [
      {
        metric: 'Youth Prosecution',
        improvement: '85% avoided',
        detail: 'Diverted to support services'
      },
      {
        metric: 'Educational Outcomes',
        improvement: '71% improvement',
        detail: 'Youth stay in school'
      },
      {
        metric: 'Mental Health',
        improvement: '88% receive support',
        detail: 'Addressing root causes'
      },
      {
        metric: 'Public Safety',
        improvement: '62% crime reduction',
        detail: 'Youth crime at record lows'
      }
    ],
    costComparison: {
      traditional: 95000,
      alternative: 22000,
      savedPerYouth: 73000
    },
    keyFeatures: [
      'Trained community volunteers decide',
      'Focus on child\'s needs not punishment',
      'Parents included as partners',
      'Regular review and adjustment',
      'Multiple services coordinated',
      'Legal safeguards maintained'
    ],
    quote: "We asked 'what does this child need?' instead of 'how should we punish them?' Everything changed.",
    quoteSource: "Children's Panel Member",
    scalability: "Influenced reforms across Europe",
    moreInfo: "https://www.chscotland.gov.uk"
  }
]

export default function SuccessStoriesPage() {
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null)

  const calculateTotalSaved = (story: SuccessStory) => {
    return story.costComparison.savedPerYouth
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Success Stories</h1>
        </div>
        <p className="text-xl text-gray-600">
          Evidence-based alternatives that work - proven models Queensland could implement tomorrow
        </p>
      </div>

      {/* Global Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">47</p>
            <p className="text-sm text-green-600">Countries with alternatives</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">73%</p>
            <p className="text-sm text-green-600">Average recidivism reduction</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">$89K</p>
            <p className="text-sm text-green-600">Average saved per youth</p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">2.4M</p>
            <p className="text-sm text-green-600">Youth helped globally</p>
          </div>
        </div>
      </div>

      {/* Success Story Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {successStories.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{story.program}</h3>
                  <p className="text-green-100">{story.location}, {story.country}</p>
                </div>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  Since {story.started}
                </span>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">{story.description}</p>

              {/* Key Results */}
              <div className="space-y-2 mb-4">
                {story.results.slice(0, 2).map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{result.metric}</span>
                    <span className="font-bold text-green-600">{result.improvement}</span>
                  </div>
                ))}
              </div>

              {/* Cost Comparison */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Cost per youth per year</p>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Traditional</p>
                    <p className="text-lg font-bold text-red-600">
                      ${story.costComparison.traditional.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Alternative</p>
                    <p className="text-lg font-bold text-green-600">
                      ${story.costComparison.alternative.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded">
                    <p className="text-xs text-green-700">Saves</p>
                    <p className="font-bold text-green-700">
                      ${calculateTotalSaved(story).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStory(story)}
                className="w-full px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
              >
                Learn How It Works
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedStory.program}
                  </h2>
                  <p className="text-gray-600">
                    {selectedStory.location}, {selectedStory.country} • Operating since {selectedStory.started}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-lg text-gray-700 mb-6">{selectedStory.description}</p>

              {/* Detailed Results */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Proven Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedStory.results.map((result, idx) => (
                    <div key={idx} className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{result.metric}</span>
                        <span className="font-bold text-green-600">{result.improvement}</span>
                      </div>
                      <p className="text-sm text-gray-600">{result.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStory.keyFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <p className="text-lg text-gray-700 italic mb-3">"{selectedStory.quote}"</p>
                <p className="text-gray-600">— {selectedStory.quoteSource}</p>
              </div>

              {/* Scalability */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-blue-900 mb-2">Scalability</h4>
                <p className="text-blue-700">{selectedStory.scalability}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={selectedStory.moreInfo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queensland Implementation Call */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Queensland Could Implement These Tomorrow</h2>
        <div className="max-w-3xl mx-auto mb-6">
          <p className="text-center mb-6">
            These aren't experimental ideas - they're proven solutions working right now around the world. 
            Queensland has the resources, we just need the political will.
          </p>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">If Queensland adopted just ONE of these models:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">$89M</p>
                <p className="text-sm opacity-90">Saved annually</p>
              </div>
              <div>
                <p className="text-3xl font-bold">2,100</p>
                <p className="text-sm opacity-90">Youth helped yearly</p>
              </div>
              <div>
                <p className="text-3xl font-bold">73%</p>
                <p className="text-sm opacity-90">Fewer reoffenders</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
            Demand Reform Now
          </button>
          <button className="px-6 py-3 bg-white/20 text-white border border-white rounded-lg font-medium hover:bg-white/30 transition">
            Share Success Stories
          </button>
        </div>
      </div>
    </div>
  )
}