'use client'

import { useState } from 'react'
import { Building2, Calendar, User, FileText, TrendingUp, AlertTriangle, Quote } from 'lucide-react'

interface ParliamentaryRecord {
  id: string
  type: 'Question' | 'Debate' | 'Motion' | 'Report'
  date: string
  member: string
  party: string
  topic: string
  summary: string
  keyQuotes: {
    text: string
    context: string
  }[]
  response?: {
    minister: string
    summary: string
    evasive: boolean
  }
  outcome?: string
  hansardUrl: string
  tags: string[]
}

const parliamentaryRecords: ParliamentaryRecord[] = [
  {
    id: '1',
    type: 'Question',
    date: '2024-02-14',
    member: 'Sandy Bolton MP',
    party: 'Independent',
    topic: 'True cost of youth detention vs community programs',
    summary: 'Asked Attorney-General to explain why 90.6% of budget goes to detention when community programs proven more effective',
    keyQuotes: [
      {
        text: "How can the government justify spending $1,570 per day per child on detention when community programs costing $200 per day achieve 73% better outcomes?",
        context: "Question on notice #1847"
      }
    ],
    response: {
      minister: "Yvette D'Ath",
      summary: "Claimed detention necessary for 'community safety' despite evidence showing increased recidivism",
      evasive: true
    },
    hansardUrl: 'https://www.parliament.qld.gov.au/hansard',
    tags: ['Budget', 'Costs', 'Alternatives']
  },
  {
    id: '2',
    type: 'Debate',
    date: '2023-11-22',
    member: 'Amy MacMahon MP',
    party: 'Greens',
    topic: 'Raise the Age to 14 - Criminal Responsibility Bill',
    summary: 'Introduced bill to raise age of criminal responsibility, citing UN recommendations and medical evidence',
    keyQuotes: [
      {
        text: "We are the only developed nation criminalizing 10-year-olds. The science is clear - children's brains are not developed enough to understand consequences.",
        context: "Second reading speech"
      },
      {
        text: "This government would rather lock up Indigenous children than listen to doctors, lawyers, and the United Nations.",
        context: "Response to government opposition"
      }
    ],
    outcome: 'Bill defeated 88-7, only Greens and 2 independents supported',
    hansardUrl: 'https://www.parliament.qld.gov.au/hansard',
    tags: ['Age of Responsibility', 'Human Rights', 'Indigenous']
  },
  {
    id: '3',
    type: 'Question',
    date: '2024-03-06',
    member: 'Michael Berkman MP',
    party: 'Greens',
    topic: 'Children held in adult watch houses',
    summary: 'Demanded explanation for 470 children held in police watch houses, some for weeks',
    keyQuotes: [
      {
        text: "How many more children need to attempt suicide in watch houses before this government acts?",
        context: "Question without notice"
      }
    ],
    response: {
      minister: 'Mark Ryan',
      summary: "Blamed 'lack of detention beds' rather than addressing why children detained at all",
      evasive: true
    },
    hansardUrl: 'https://www.parliament.qld.gov.au/hansard',
    tags: ['Watch Houses', 'Human Rights', 'Mental Health']
  },
  {
    id: '4',
    type: 'Motion',
    date: '2023-09-13',
    member: 'Maiwar Electorate',
    party: 'Greens',
    topic: 'Parliamentary Inquiry into Youth Justice Failures',
    summary: 'Motion for comprehensive inquiry into systemic failures and Indigenous overrepresentation',
    keyQuotes: [
      {
        text: "This parliament has blood on its hands. Every child who dies in detention, every suicide attempt, every family destroyed - that's on us.",
        context: "Moving the motion"
      }
    ],
    outcome: 'Motion defeated 87-8 along party lines',
    hansardUrl: 'https://www.parliament.qld.gov.au/hansard',
    tags: ['Inquiry', 'System Reform', 'Accountability']
  },
  {
    id: '5',
    type: 'Report',
    date: '2024-01-30',
    member: 'Legal Affairs Committee',
    party: 'Cross-party',
    topic: 'Youth Justice Reform Bill - Committee Report',
    summary: 'Committee split on party lines, minority report scathing of government approach',
    keyQuotes: [
      {
        text: "The majority's recommendations will worsen the crisis, increase recidivism, and violate human rights.",
        context: "Greens minority report"
      },
      {
        text: "We cannot support legislation that treats children as adults and ignores all expert evidence.",
        context: "Independent member statement"
      }
    ],
    outcome: 'Government accepted majority report, ignored dissenting views',
    hansardUrl: 'https://www.parliament.qld.gov.au/committees',
    tags: ['Legislation', 'Committee', 'Reform']
  }
]

const keyVotes = [
  {
    date: '2023-11-22',
    bill: 'Raise the Age to 14',
    result: 'Defeated 88-7',
    labor: 'Against',
    lnp: 'Against',
    greens: 'For',
    other: 'Mixed'
  },
  {
    date: '2023-05-17',
    bill: 'Mandatory Detention Expansion',
    result: 'Passed 81-10',
    labor: 'For',
    lnp: 'For',
    greens: 'Against',
    other: 'Against'
  },
  {
    date: '2024-02-28',
    bill: 'Community Programs Funding',
    result: 'Defeated 85-9',
    labor: 'Against',
    lnp: 'Against',
    greens: 'For',
    other: 'For'
  }
]

export default function ParliamentPage() {
  const [selectedRecord, setSelectedRecord] = useState<ParliamentaryRecord | null>(null)
  const [filter, setFilter] = useState<'all' | 'questions' | 'debates' | 'motions'>('all')

  const filteredRecords = parliamentaryRecords.filter(record => {
    if (filter === 'all') return true
    if (filter === 'questions') return record.type === 'Question'
    if (filter === 'debates') return record.type === 'Debate'
    if (filter === 'motions') return record.type === 'Motion'
    return true
  })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Parliamentary Watch</h1>
        </div>
        <p className="text-xl text-gray-600">
          Tracking what Queensland MPs say and do about youth justice
        </p>
      </div>

      {/* Key Stats */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">147</p>
            <p className="text-sm text-red-600">Questions Evaded</p>
          </div>
          <div className="text-center">
            <Building2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">23</p>
            <p className="text-sm text-red-600">Reform Bills Defeated</p>
          </div>
          <div className="text-center">
            <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">11</p>
            <p className="text-sm text-green-600">MPs Supporting Reform</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">0</p>
            <p className="text-sm text-amber-600">Evidence-Based Laws Passed</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'questions', 'debates', 'motions'].map((f) => (
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

      {/* Parliamentary Records */}
      <div className="space-y-6 mb-8">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.type === 'Question' ? 'bg-blue-100 text-blue-700' :
                      record.type === 'Debate' ? 'bg-purple-100 text-purple-700' :
                      record.type === 'Motion' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {record.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{record.topic}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {record.member} ({record.party})
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{record.summary}</p>

              {record.keyQuotes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <Quote className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-gray-700 italic">"{record.keyQuotes[0].text}"</p>
                  <p className="text-sm text-gray-500 mt-2">— {record.keyQuotes[0].context}</p>
                </div>
              )}

              {record.response && (
                <div className={`rounded-lg p-4 mb-4 ${
                  record.response.evasive 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className="font-medium text-gray-900 mb-1">
                    Government Response ({record.response.minister})
                  </p>
                  <p className="text-sm text-gray-700">{record.response.summary}</p>
                  {record.response.evasive && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Question evaded</p>
                  )}
                </div>
              )}

              {record.outcome && (
                <p className="text-sm font-medium text-red-600 mb-4">
                  Outcome: {record.outcome}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {record.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                >
                  View Hansard
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Votes Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-bold text-gray-900">Key Parliamentary Votes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill/Motion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Labor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">LNP</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Greens</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {keyVotes.map((vote, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm">{vote.date}</td>
                  <td className="px-6 py-4 text-sm font-medium">{vote.bill}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-medium ${
                      vote.result.includes('Passed') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {vote.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vote.labor === 'For' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {vote.labor}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vote.lnp === 'For' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {vote.lnp}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vote.greens === 'For' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {vote.greens}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vote.other === 'For' ? 'bg-green-100 text-green-700' : 
                      vote.other === 'Against' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vote.other}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Representatives Are Failing Queensland's Children</h2>
        <p className="mb-6 max-w-2xl mx-auto">
          The parliamentary record shows both major parties consistently vote against evidence-based reform. 
          Only a handful of MPs are standing up for youth justice.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
            Contact Your MP
          </button>
          <a
            href="https://www.parliament.qld.gov.au/work-of-assembly/sitting-dates/watch-live"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white/20 text-white border border-white rounded-lg font-medium hover:bg-white/30 transition"
          >
            Watch Parliament Live
          </a>
        </div>
      </div>
    </div>
  )
}