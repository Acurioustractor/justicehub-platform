'use client'

import { useState } from 'react'
import { Building, Calendar, FileText, AlertTriangle, Download, ExternalLink, Search } from 'lucide-react'

interface Inquiry {
  id: string
  name: string
  type: 'Royal Commission' | 'Parliamentary Inquiry' | 'Coroner\'s Inquest' | 'Review'
  year: number
  status: 'Completed' | 'Ongoing' | 'Ignored'
  commissioner?: string
  keyFindings: string[]
  recommendations: {
    total: number
    implemented: number
    rejected: number
    ignored: number
  }
  quote: string
  reportUrl?: string
  governmentResponse?: string
  tags: string[]
}

const inquiries: Inquiry[] = [
  {
    id: '1',
    name: 'Royal Commission into Aboriginal Deaths in Custody',
    type: 'Royal Commission',
    year: 1991,
    status: 'Ignored',
    commissioner: 'Elliott Johnston QC',
    keyFindings: [
      'Indigenous people 20x more likely to be in custody',
      'Majority of deaths preventable with proper care',
      'Systemic racism throughout justice system',
      'Failure to implement alternatives to detention',
      'Children as young as 10 being detained'
    ],
    recommendations: {
      total: 339,
      implemented: 38,
      rejected: 0,
      ignored: 301
    },
    quote: "The principal conclusion is that Aboriginal people die in custody at a rate which is totally unacceptable and which would not be tolerated if it occurred in the non-Aboriginal community.",
    reportUrl: 'http://www.austlii.edu.au/au/other/IndigLRes/rciadic/',
    governmentResponse: 'Accepted in principle, minimal action taken',
    tags: ['Indigenous', 'Deaths in Custody', 'Youth Justice']
  },
  {
    id: '2',
    name: 'Queensland Child Protection Commission of Inquiry',
    type: 'Parliamentary Inquiry',
    year: 2013,
    status: 'Completed',
    commissioner: 'Tim Carmody QC',
    keyFindings: [
      'Youth justice system failing vulnerable children',
      'Overrepresentation of children from care in detention',
      'Lack of early intervention programs',
      'Punitive approach creating more harm',
      'Indigenous children disproportionately affected'
    ],
    recommendations: {
      total: 121,
      implemented: 45,
      rejected: 31,
      ignored: 45
    },
    quote: "The current system criminalizes vulnerability and trauma rather than addressing root causes.",
    reportUrl: 'https://www.qld.gov.au/cpci',
    governmentResponse: 'Partial implementation, key reforms rejected',
    tags: ['Child Protection', 'System Reform', 'Early Intervention']
  },
  {
    id: '3',
    name: "Atkinson Report on Youth Justice",
    type: 'Review',
    year: 2018,
    status: 'Ignored',
    commissioner: 'Bob Atkinson AO APM',
    keyFindings: [
      '72% of youth in detention have disability or mental illness',
      'Current approach increases recidivism',
      'Community programs 3x more effective than detention',
      'Police watch houses inappropriate for children',
      'Need to raise age of criminal responsibility'
    ],
    recommendations: {
      total: 77,
      implemented: 12,
      rejected: 23,
      ignored: 42
    },
    quote: "We are setting these children up to fail by our response to their behavior, which is often a cry for help.",
    governmentResponse: 'Report shelved, opposite approach taken',
    tags: ['Mental Health', 'Disability', 'Watch Houses']
  },
  {
    id: '4',
    name: "Coroner's Inquest into Youth Detention Deaths",
    type: "Coroner's Inquest",
    year: 2019,
    status: 'Completed',
    commissioner: 'Terry Ryan',
    keyFindings: [
      'Multiple preventable deaths in youth detention',
      'Inadequate mental health support',
      'Use of isolation causing severe harm',
      'Staff not trained in trauma-informed care',
      'Aboriginal youth at highest risk'
    ],
    recommendations: {
      total: 43,
      implemented: 8,
      rejected: 0,
      ignored: 35
    },
    quote: "These were children who needed help, not punishment. The system failed them catastrophically.",
    reportUrl: 'https://www.courts.qld.gov.au/coroners-findings',
    governmentResponse: 'Commitments made, little follow-through',
    tags: ['Deaths', 'Mental Health', 'Isolation']
  },
  {
    id: '5',
    name: 'UN Committee on Rights of the Child Review',
    type: 'Review',
    year: 2019,
    status: 'Ongoing',
    commissioner: 'UN Human Rights Committee',
    keyFindings: [
      'Australia violating international obligations',
      'Age 10 criminal responsibility "shocking"',
      'Indigenous children facing discrimination',
      'Detention conditions breach human rights',
      'Lack of data transparency'
    ],
    recommendations: {
      total: 52,
      implemented: 3,
      rejected: 15,
      ignored: 34
    },
    quote: "Australia's treatment of children in the justice system, particularly Indigenous children, constitutes systematic violations of the Convention on the Rights of the Child.",
    reportUrl: 'https://www.ohchr.org/en/countries/australia',
    governmentResponse: 'Rejected key recommendations',
    tags: ['International', 'Human Rights', 'Age of Responsibility']
  }
]

export default function InquiriesPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [filter, setFilter] = useState<'all' | 'implemented' | 'ignored'>('all')

  const calculateImplementationRate = (inquiry: Inquiry) => {
    return Math.round((inquiry.recommendations.implemented / inquiry.recommendations.total) * 100)
  }

  const getTotalRecommendations = () => {
    return inquiries.reduce((sum, inq) => sum + inq.recommendations.total, 0)
  }

  const getTotalImplemented = () => {
    return inquiries.reduce((sum, inq) => sum + inq.recommendations.implemented, 0)
  }

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter === 'implemented') return calculateImplementationRate(inquiry) > 30
    if (filter === 'ignored') return calculateImplementationRate(inquiry) < 30
    return true
  })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Inquiries Hub</h1>
        </div>
        <p className="text-xl text-gray-600">
          Decades of investigations, thousands of recommendations, minimal action
        </p>
      </div>

      {/* Summary Stats */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{getTotalRecommendations()}</p>
            <p className="text-sm text-red-700">Total Recommendations</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{getTotalImplemented()}</p>
            <p className="text-sm text-green-700">Implemented</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">
              {getTotalRecommendations() - getTotalImplemented()}
            </p>
            <p className="text-sm text-amber-700">Ignored or Rejected</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {Math.round((getTotalImplemented() / getTotalRecommendations()) * 100)}%
            </p>
            <p className="text-sm text-red-700">Implementation Rate</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'implemented', 'ignored'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-qld-maroon text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Inquiry Cards */}
      <div className="space-y-6">
        {filteredInquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="md:flex">
              <div className="md:flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{inquiry.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {inquiry.year}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {inquiry.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        inquiry.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        inquiry.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inquiry.status}
                      </span>
                    </div>
                  </div>
                </div>

                {inquiry.commissioner && (
                  <p className="text-sm text-gray-600 mb-3">
                    Commissioner: {inquiry.commissioner}
                  </p>
                )}

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Findings:</h4>
                  <ul className="space-y-1">
                    {inquiry.keyFindings.slice(0, 3).map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span className="text-gray-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <blockquote className="border-l-4 border-gray-300 pl-4 mb-4">
                  <p className="text-gray-700 italic">"{inquiry.quote}"</p>
                </blockquote>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                  >
                    View Details
                  </button>
                  {inquiry.reportUrl && (
                    <a
                      href={inquiry.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Download className="w-4 h-4" />
                      Full Report
                    </a>
                  )}
                </div>
              </div>

              {/* Recommendations Chart */}
              <div className="md:w-80 bg-gray-50 p-6 border-l">
                <h4 className="font-bold text-gray-900 mb-4">Recommendations Status</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Implemented</span>
                      <span className="font-medium">{inquiry.recommendations.implemented}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(inquiry.recommendations.implemented / inquiry.recommendations.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Rejected</span>
                      <span className="font-medium">{inquiry.recommendations.rejected}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${(inquiry.recommendations.rejected / inquiry.recommendations.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ignored</span>
                      <span className="font-medium">{inquiry.recommendations.ignored}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{ width: `${(inquiry.recommendations.ignored / inquiry.recommendations.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-2xl font-bold text-center">
                    {calculateImplementationRate(inquiry)}%
                  </p>
                  <p className="text-sm text-gray-600 text-center">Implementation Rate</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedInquiry.name}</h2>
                  <p className="text-gray-600">{selectedInquiry.year} • {selectedInquiry.type}</p>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">All Key Findings</h3>
                <ul className="space-y-2">
                  {selectedInquiry.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span className="text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedInquiry.governmentResponse && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <h4 className="font-bold text-amber-900 mb-2">Government Response</h4>
                  <p className="text-amber-700">{selectedInquiry.governmentResponse}</p>
                </div>
              )}

              <div className="flex gap-3">
                {selectedInquiry.reportUrl && (
                  <a
                    href={selectedInquiry.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read Full Report
                  </a>
                )}
                <button
                  onClick={() => setSelectedInquiry(null)}
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
      <div className="mt-12 bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">33 Years of Ignored Recommendations</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          Since 1991, inquiry after inquiry has identified the same problems and proposed evidence-based solutions. 
          The government's failure to act is not ignorance - it's a choice.
        </p>
        <button className="px-6 py-3 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
          Demand Implementation Now
        </button>
      </div>
    </div>
  )
}