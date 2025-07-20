'use client'

import { useState } from 'react'
import { Upload, FileText, Code, Database, Users, Heart, Shield, Mail } from 'lucide-react'

interface ContributionType {
  id: string
  title: string
  icon: JSX.Element
  description: string
  examples: string[]
  requirements: string[]
  howTo: string
}

const contributionTypes: ContributionType[] = [
  {
    id: 'data',
    title: 'Data & Documents',
    icon: <Database className="w-6 h-6" />,
    description: 'Share government documents, RTI responses, or data that exposes system failures',
    examples: [
      'RTI responses revealing hidden information',
      'Internal government reports or memos',
      'Budget documents not publicly available',
      'Meeting minutes or correspondence'
    ],
    requirements: [
      'Verify authenticity of documents',
      'Redact personal information',
      'Include source and date',
      'Provide context'
    ],
    howTo: 'Email documents to: data@qld-youth-justice.org'
  },
  {
    id: 'stories',
    title: 'Personal Stories',
    icon: <Heart className="w-6 h-6" />,
    description: 'Share experiences of the youth justice system - as a young person, family member, or worker',
    examples: [
      'First-person accounts from affected youth',
      'Family impact stories',
      'Worker whistleblower accounts',
      'Community perspectives'
    ],
    requirements: [
      'Consent from all parties mentioned',
      'Can be anonymous',
      'Verify key facts',
      'Trauma-informed approach'
    ],
    howTo: 'Submit via secure form: qld-youth-justice.org/share-story'
  },
  {
    id: 'code',
    title: 'Technical Contributions',
    icon: <Code className="w-6 h-6" />,
    description: 'Help improve our data collection, analysis, and presentation',
    examples: [
      'Web scraping improvements',
      'Data visualization components',
      'Analysis algorithms',
      'Accessibility enhancements'
    ],
    requirements: [
      'Open source contributions',
      'Follow coding standards',
      'Include tests',
      'Document changes'
    ],
    howTo: 'GitHub: github.com/qld-youth-justice/tracker'
  },
  {
    id: 'research',
    title: 'Research & Analysis',
    icon: <FileText className="w-6 h-6" />,
    description: 'Contribute research, analysis, or fact-checking to strengthen our evidence base',
    examples: [
      'Academic research on youth justice',
      'Cost-benefit analyses',
      'International comparisons',
      'Fact-checking government claims'
    ],
    requirements: [
      'Cite all sources',
      'Peer review preferred',
      'Transparent methodology',
      'Conflicts of interest declared'
    ],
    howTo: 'Submit to: research@qld-youth-justice.org'
  },
  {
    id: 'advocacy',
    title: 'Advocacy Support',
    icon: <Users className="w-6 h-6" />,
    description: 'Help spread awareness and mobilize community action',
    examples: [
      'Social media campaigns',
      'Community organizing',
      'Media connections',
      'Political engagement'
    ],
    requirements: [
      'Align with evidence-based approach',
      'Respectful communication',
      'Protect vulnerable people',
      'Coordinate with team'
    ],
    howTo: 'Join at: qld-youth-justice.org/volunteer'
  }
]

const securityMeasures = [
  'All submissions reviewed by legal team',
  'Personal information automatically redacted',
  'Secure encrypted submission channels',
  'Anonymous options available',
  'Whistleblower protections applied',
  'Data verified before publication'
]

export default function ContributePage() {
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle submission
    alert('Thank you for your interest in contributing! We\'ll be in touch soon.')
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Contribute</h1>
        </div>
        <p className="text-xl text-gray-600">
          Help expose the truth about Queensland's youth justice system
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-900 mb-2">Your Safety is Our Priority</h3>
            <p className="text-green-700 mb-3">
              We take security seriously and protect all contributors:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {securityMeasures.map((measure, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="text-green-700">{measure}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contribution Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {contributionTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
            onClick={() => setSelectedType(type)}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                {type.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{type.title}</h3>
            </div>
            
            <p className="text-gray-700 mb-4">{type.description}</p>
            
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Examples:</p>
              <ul className="list-disc list-inside space-y-1">
                {type.examples.slice(0, 2).map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
            
            <button className="mt-4 text-qld-maroon font-medium hover:underline">
              Learn more →
            </button>
          </div>
        ))}
      </div>

      {/* Quick Contact Form */}
      <div className="bg-gray-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anonymous@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contribution Type
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent">
                <option>Select type...</option>
                {contributionTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Tell us how you'd like to contribute..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
            />
          </div>
          
          <button
            type="submit"
            className="px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Detailed Modal */}
      {selectedType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                    {selectedType.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedType.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedType(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-lg text-gray-700 mb-6">{selectedType.description}</p>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Examples of Contributions</h3>
                <ul className="space-y-2">
                  {selectedType.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {selectedType.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-gray-900 mb-2">How to Contribute</h4>
                <p className="text-gray-700">{selectedType.howTo}</p>
              </div>

              <button
                onClick={() => setSelectedType(null)}
                className="w-full px-6 py-3 bg-qld-maroon text-white rounded-lg hover:bg-qld-maroon/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Why Contribute */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Why Your Contribution Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="font-bold mb-2">Expose Truth</h3>
            <p className="text-sm opacity-90">
              Government hides failures. Your evidence reveals reality.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">⚖️</div>
            <h3 className="font-bold mb-2">Drive Reform</h3>
            <p className="text-sm opacity-90">
              Data and stories create pressure for systemic change.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <h3 className="font-bold mb-2">Protect Children</h3>
            <p className="text-sm opacity-90">
              Every contribution helps save youth from harmful system.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">For sensitive contributions or questions:</p>
        <div className="flex items-center justify-center gap-2">
          <Mail className="w-5 h-5 text-gray-400" />
          <a href="mailto:secure@qld-youth-justice.org" className="text-qld-maroon hover:underline">
            secure@qld-youth-justice.org
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-2">PGP key available on request</p>
      </div>
    </div>
  )
}