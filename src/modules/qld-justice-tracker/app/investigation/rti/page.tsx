'use client'

import { useState } from 'react'
import { FileText, Lock, Calendar, AlertCircle, Download, Search, Copy, TrendingUp } from 'lucide-react'

interface RTIRequest {
  id: string
  title: string
  department: string
  dateRequested: string
  dateResponded?: string
  status: 'Pending' | 'Released' | 'Refused' | 'Partial'
  cost: number
  keyFindings?: string[]
  refusalReason?: string
  documentUrl?: string
  pagesReleased?: number
  pagesRedacted?: number
  tags: string[]
}

const rtiRequests: RTIRequest[] = [
  {
    id: '1',
    title: 'True Cost of Youth Detention Including Hidden Expenses',
    department: 'Department of Youth Justice',
    dateRequested: '2023-08-15',
    dateResponded: '2023-11-28',
    status: 'Partial',
    cost: 487.50,
    keyFindings: [
      'Actual cost $1,570/day not $857 as publicly stated',
      'Healthcare costs deliberately excluded from public figures',
      'Infrastructure deterioration costs hidden',
      'Staff injury compensation not included'
    ],
    pagesReleased: 127,
    pagesRedacted: 89,
    tags: ['Costs', 'Transparency', 'Hidden Data']
  },
  {
    id: '2',
    title: 'Indigenous Youth Overrepresentation Internal Reports',
    department: 'Queensland Police Service',
    dateRequested: '2023-09-01',
    dateResponded: '2024-01-15',
    status: 'Refused',
    cost: 325.00,
    refusalReason: 'Release would prejudice law enforcement and individual privacy',
    tags: ['Indigenous', 'Police', 'Discrimination']
  },
  {
    id: '3',
    title: 'Deaths and Serious Incidents in Youth Detention 2020-2023',
    department: 'Department of Youth Justice',
    dateRequested: '2023-07-20',
    dateResponded: '2023-10-05',
    status: 'Partial',
    cost: 0,
    keyFindings: [
      '17 serious self-harm incidents unreported publicly',
      '3 near-death incidents in isolation cells',
      'Staff training on suicide prevention "inadequate"',
      '89% of incidents involved Indigenous youth'
    ],
    pagesReleased: 45,
    pagesRedacted: 112,
    documentUrl: '/documents/rti-deaths-incidents.pdf',
    tags: ['Deaths', 'Self-harm', 'Cover-up']
  },
  {
    id: '4',
    title: 'Watch House Children Mental Health Assessments',
    department: 'Queensland Health',
    dateRequested: '2023-10-10',
    status: 'Pending',
    cost: 0,
    tags: ['Watch Houses', 'Mental Health', 'Children']
  },
  {
    id: '5',
    title: 'Alternative Program Funding Rejections 2018-2023',
    department: 'Queensland Treasury',
    dateRequested: '2023-06-15',
    dateResponded: '2023-09-30',
    status: 'Released',
    cost: 275.00,
    keyFindings: [
      '23 evidence-based programs rejected despite positive evaluations',
      'Community programs rejected for "budget constraints"',
      'Same period approved $89M for new detention facilities',
      'Treasury admitted community programs more cost-effective'
    ],
    pagesReleased: 234,
    pagesRedacted: 12,
    documentUrl: '/documents/rti-program-rejections.pdf',
    tags: ['Funding', 'Alternatives', 'Budget']
  }
]

const templateRequests = [
  {
    title: 'Recidivism Data by Program Type',
    description: 'Compare success rates of detention vs community programs',
    template: `I request all documents relating to recidivism rates for youth who have participated in detention programs versus community-based programs from 2020 to present, including but not limited to:
- Statistical comparisons
- Program evaluations
- Cost-benefit analyses
- Internal reports and briefings`
  },
  {
    title: 'Staff Incident Reports',
    description: 'Uncover unreported violence and safety issues',
    template: `I request all staff incident reports from youth detention facilities for the period 2022-2024, including:
- Assault reports
- Injury statistics
- Workers compensation claims
- Safety assessments`
  },
  {
    title: 'Budget Allocation Decisions',
    description: 'Expose funding priorities and rejected alternatives',
    template: `I request all documents relating to youth justice budget allocation decisions for 2024-25, including:
- Budget proposals
- Ministerial briefings
- Treasury assessments
- Rejected funding applications`
  }
]

export default function RTIPage() {
  const [selectedRequest, setSelectedRequest] = useState<RTIRequest | null>(null)
  const [filter, setFilter] = useState<'all' | 'released' | 'refused' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRequests = rtiRequests.filter(request => {
    const matchesFilter = filter === 'all' || 
      (filter === 'released' && request.status === 'Released') ||
      (filter === 'refused' && request.status === 'Refused') ||
      (filter === 'pending' && request.status === 'Pending')
    
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const calculateResponseTime = (request: RTIRequest) => {
    if (!request.dateResponded) return null
    const requested = new Date(request.dateRequested)
    const responded = new Date(request.dateResponded)
    const days = Math.floor((responded.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const copyTemplate = (template: string) => {
    navigator.clipboard.writeText(template)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">RTI Tracker</h1>
        </div>
        <p className="text-xl text-gray-600">
          Exposing hidden data through Right to Information requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Lock className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-900">{rtiRequests.length}</p>
          <p className="text-sm text-blue-700">RTI Requests Filed</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <FileText className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-900">
            {rtiRequests.filter(r => r.status === 'Released' || r.status === 'Partial').length}
          </p>
          <p className="text-sm text-green-700">Documents Obtained</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
          <p className="text-2xl font-bold text-red-900">
            {rtiRequests.filter(r => r.status === 'Refused').length}
          </p>
          <p className="text-sm text-red-700">Requests Refused</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <TrendingUp className="w-6 h-6 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-amber-900">
            ${rtiRequests.reduce((sum, r) => sum + r.cost, 0)}
          </p>
          <p className="text-sm text-amber-700">Total Cost</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search RTI requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'released', 'refused', 'pending'].map((f) => (
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
      </div>

      {/* RTI Requests List */}
      <div className="space-y-4 mb-8">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{request.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{request.department}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.status === 'Released' ? 'bg-green-100 text-green-700' :
                request.status === 'Refused' ? 'bg-red-100 text-red-700' :
                request.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {request.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Requested: {new Date(request.dateRequested).toLocaleDateString()}
              </span>
              {request.dateResponded && (
                <span>
                  Responded: {new Date(request.dateResponded).toLocaleDateString()}
                  ({calculateResponseTime(request)} days)
                </span>
              )}
              {request.cost > 0 && (
                <span>Cost: ${request.cost}</span>
              )}
            </div>

            {request.keyFindings && (
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <h4 className="font-medium text-gray-900 mb-2">Key Findings:</h4>
                <ul className="space-y-1">
                  {request.keyFindings.slice(0, 2).map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {request.refusalReason && (
              <div className="bg-red-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-red-700">
                  <strong>Refusal Reason:</strong> {request.refusalReason}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {request.pagesReleased && (
                  <span className="text-sm text-gray-600">
                    {request.pagesReleased} pages released
                    {request.pagesRedacted && ` (${request.pagesRedacted} redacted)`}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {request.documentUrl && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RTI Templates */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">RTI Request Templates</h2>
        <p className="mb-6">Use these templates to file your own RTI requests and expose hidden data</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templateRequests.map((template, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">{template.title}</h3>
              <p className="text-sm opacity-90 mb-4">{template.description}</p>
              <button
                onClick={() => copyTemplate(template.template)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-qld-maroon rounded-lg hover:bg-gray-100 transition"
              >
                <Copy className="w-4 h-4" />
                Copy Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* How to File RTI */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">How to File an RTI Request</h3>
        <ol className="space-y-2 text-blue-800">
          <li>1. Visit: <a href="https://www.rti.qld.gov.au" className="underline">www.rti.qld.gov.au</a></li>
          <li>2. No cost for first 5 hours of processing</li>
          <li>3. Response required within 25 business days</li>
          <li>4. Can appeal refusals to Information Commissioner</li>
        </ol>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.title}</h2>
                  <p className="text-gray-600">{selectedRequest.department}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {selectedRequest.keyFindings && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Key Findings</h3>
                  <ul className="space-y-2">
                    {selectedRequest.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-gray-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}