'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, ExternalLink, Send, User, Building, AlertCircle } from 'lucide-react'

interface Representative {
  id: string
  name: string
  role: string
  party: string
  electorate?: string
  portfolio?: string
  email: string
  phone: string
  address: string
  committees?: string[]
  keyVotes?: {
    issue: string
    position: 'for' | 'against' | 'absent'
  }[]
}

const keyRepresentatives: Representative[] = [
  {
    id: '1',
    name: 'Annastacia Palaszczuk',
    role: 'Premier of Queensland',
    party: 'Labor',
    email: 'thepremier@premiers.qld.gov.au',
    phone: '07 3719 7000',
    address: '1 William St, Brisbane QLD 4000',
    keyVotes: [
      { issue: 'Raise the Age to 14', position: 'against' },
      { issue: 'Youth Detention Funding Increase', position: 'for' }
    ]
  },
  {
    id: '2',
    name: 'Yvette D\'Ath',
    role: 'Attorney-General',
    party: 'Labor',
    portfolio: 'Justice and Attorney-General',
    email: 'attorney@ministerial.qld.gov.au',
    phone: '07 3719 7400',
    address: '1 William St, Brisbane QLD 4000',
    committees: ['Legal Affairs and Safety Committee'],
    keyVotes: [
      { issue: 'Youth Justice Reform Bill', position: 'for' },
      { issue: 'Community-Based Programs', position: 'against' }
    ]
  },
  {
    id: '3',
    name: 'Di Farmer',
    role: 'Minister for Youth Justice',
    party: 'Labor',
    portfolio: 'Child Safety, Youth and Women',
    email: 'youthjustice@ministerial.qld.gov.au',
    phone: '07 3719 7330',
    address: '1 William St, Brisbane QLD 4000',
    committees: ['Youth Justice Committee']
  }
]

const committees = [
  {
    name: 'Legal Affairs and Safety Committee',
    email: 'lasc@parliament.qld.gov.au',
    description: 'Reviews youth justice legislation',
    currentInquiries: ['Youth Justice Reform Bill 2024', 'Bail Act Amendments']
  },
  {
    name: 'Community Support and Services Committee',
    email: 'cssc@parliament.qld.gov.au',
    description: 'Oversees community programs and support services',
    currentInquiries: ['Alternative Detention Programs', 'Family Support Services']
  }
]

const talkingPoints = [
  {
    topic: 'Budget Misallocation',
    points: [
      '90.6% of $396.5M youth justice budget spent on detention',
      'Only 9.4% on proven community programs',
      'Community programs cost $150-300/day vs $1,570/day for detention',
      '26% better outcomes from community programs'
    ]
  },
  {
    topic: 'Indigenous Overrepresentation',
    points: [
      '20x overrepresentation of Indigenous youth',
      '86% of 10-11 year olds in court are Indigenous',
      '66-70% of detention population is Indigenous',
      'Clear evidence of systemic discrimination'
    ]
  },
  {
    topic: 'Human Rights Violations',
    points: [
      '470 children held in police watch houses',
      'Average 5-14 days in adult facilities',
      'Children as young as 10 being detained',
      'Breach of UN Convention on Rights of the Child'
    ]
  }
]

export default function ContactPage() {
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null)
  const [emailTemplate, setEmailTemplate] = useState('')
  const [userElectorate, setUserElectorate] = useState('')

  const generateEmailTemplate = (rep: Representative) => {
    const template = `Dear ${rep.role === 'Premier of Queensland' ? 'Premier' : rep.name},

I am writing as a concerned Queensland resident about the failure of our youth justice system.

The evidence is overwhelming:
• $1.38 billion spent with a 74% recidivism rate
• 90.6% of budget on detention vs 9.4% on community programs
• Indigenous youth 20x overrepresented in the system
• Children as young as 10 held in adult watch houses

I urge you to:
1. Redirect funding to evidence-based community programs
2. Raise the age of criminal responsibility to 14
3. Address Indigenous overrepresentation urgently
4. Support therapeutic, not punitive approaches

The current system is expensive, cruel, and ineffective. Queensland can do better.

I look forward to your response.

Regards,
[Your name]
[Your suburb]`

    setEmailTemplate(template)
    setSelectedRep(rep)
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(emailTemplate)
  }

  const sendEmail = (rep: Representative) => {
    const subject = 'Urgent: Youth Justice System Reform Needed'
    const body = encodeURIComponent(emailTemplate)
    window.location.href = `mailto:${rep.email}?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Contact Your Representatives</h1>
        </div>
        <p className="text-xl text-gray-600">
          Your voice matters. Contact decision-makers and demand youth justice reform.
        </p>
      </div>

      {/* Quick Action Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 mb-2">Urgent Action Needed</h3>
            <p className="text-red-700">
              Parliament is currently debating youth justice reforms. Contact your representatives 
              NOW to oppose punitive measures and support evidence-based community programs.
            </p>
          </div>
        </div>
      </div>

      {/* Find Your Representative */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Find Your Local MP</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter your suburb or postcode"
            value={userElectorate}
            onChange={(e) => setUserElectorate(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
          />
          <button className="px-6 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition">
            Find MP
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Or visit the{' '}
          <a
            href="https://www.parliament.qld.gov.au/Members/Current-Members"
            target="_blank"
            rel="noopener noreferrer"
            className="text-qld-maroon hover:underline"
          >
            Queensland Parliament website
          </a>
        </p>
      </div>

      {/* Key Representatives */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Decision Makers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keyRepresentatives.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{rep.name}</h3>
                  <p className="text-sm text-gray-600">{rep.role}</p>
                  {rep.portfolio && (
                    <p className="text-xs text-gray-500 mt-1">{rep.portfolio}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rep.party === 'Labor' ? 'bg-red-100 text-red-700' :
                  rep.party === 'LNP' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {rep.party}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${rep.email}`} className="text-qld-maroon hover:underline">
                    {rep.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{rep.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{rep.address}</span>
                </div>
              </div>

              {rep.keyVotes && (
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Votes:</p>
                  {rep.keyVotes.map((vote, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-600">{vote.issue}</span>
                      <span className={`font-medium ${
                        vote.position === 'for' ? 'text-green-600' :
                        vote.position === 'against' ? 'text-red-600' :
                        'text-gray-400'
                      }`}>
                        {vote.position.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => generateEmailTemplate(rep)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parliamentary Committees */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Parliamentary Committees</h2>
        <p className="text-gray-600 mb-6">
          Submit evidence and feedback to committees reviewing youth justice legislation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {committees.map((committee, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4">
              <h3 className="font-bold text-gray-900">{committee.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{committee.description}</p>
              <a
                href={`mailto:${committee.email}`}
                className="text-sm text-qld-maroon hover:underline flex items-center gap-1"
              >
                {committee.email}
                <ExternalLink className="w-3 h-3" />
              </a>
              {committee.currentInquiries.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-700 mb-1">Current Inquiries:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {committee.currentInquiries.map((inquiry, i) => (
                      <li key={i}>• {inquiry}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Email Template Modal */}
      {selectedRep && emailTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Email Template for {selectedRep.name}
              </h3>
              <textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => sendEmail(selectedRep)}
                  className="flex items-center gap-2 px-6 py-2 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
                >
                  <Send className="w-4 h-4" />
                  Send Email
                </button>
                <button
                  onClick={copyEmail}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    setSelectedRep(null)
                    setEmailTemplate('')
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Talking Points */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Key Talking Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {talkingPoints.map((topic, idx) => (
            <div key={idx}>
              <h3 className="font-bold text-gray-900 mb-3">{topic.topic}</h3>
              <ul className="space-y-2">
                {topic.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-qld-maroon mt-0.5">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}