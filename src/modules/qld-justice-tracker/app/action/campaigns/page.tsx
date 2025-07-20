'use client'

import { useState } from 'react'
import { Share2, Download, Copy, Twitter, Facebook, Mail, MessageCircle, Megaphone, Target, Users } from 'lucide-react'

interface CampaignResource {
  id: string
  type: 'social' | 'email' | 'print' | 'media'
  title: string
  description: string
  content: string
  tags: string[]
  shareStats?: {
    shares: number
    engagement: number
  }
}

const campaignResources: CampaignResource[] = [
  {
    id: '1',
    type: 'social',
    title: '$1.38 Billion Failure',
    description: 'Shareable infographic exposing the massive budget allocation failure',
    content: '🚨 QUEENSLAND SPENDING $1.38 BILLION TO FAIL CHILDREN\n\n📊 90.6% spent on detention\n📊 9.4% on proven community programs\n📊 74% return to crime\n\n#QLDYouthJustice #SystemFailure',
    tags: ['budget', 'detention', 'reform'],
    shareStats: { shares: 2847, engagement: 15420 }
  },
  {
    id: '2',
    type: 'social',
    title: 'Indigenous Crisis: 20x Overrepresentation',
    description: 'Fact sheet on Indigenous youth in the system',
    content: '⚠️ INDIGENOUS YOUTH CRISIS IN QUEENSLAND\n\n• 20x more likely to be detained\n• 86% of 10-11 year olds in court are Indigenous\n• 66-70% of youth detention population\n\nThis is systemic discrimination. #IndigenousJustice',
    tags: ['indigenous', 'discrimination', 'human-rights'],
    shareStats: { shares: 3921, engagement: 22103 }
  },
  {
    id: '3',
    type: 'email',
    title: 'MP Email Template: Demand Reform',
    description: 'Ready-to-send email template for contacting representatives',
    content: `Subject: Urgent: Youth Justice System Failing Queensland Children

Dear [MP Name],

I am writing as a concerned constituent about the catastrophic failure of Queensland's youth justice system, documented by official government data:

• $1.38 billion spent with 74% recidivism rate
• 90.6% of budget on detention vs 9.4% on community programs
• Indigenous youth 20x overrepresented
• Children as young as 10 held in adult watch houses

I urge you to:
1. Redirect funding from detention to evidence-based community programs
2. Raise the age of criminal responsibility to 14
3. Address Indigenous overrepresentation as a priority
4. Support therapeutic, not punitive approaches

The evidence is clear. The current system is expensive, cruel, and ineffective. 

I look forward to your response outlining concrete actions you will take.

Regards,
[Your name]
[Your suburb]`,
    tags: ['parliament', 'advocacy', 'template']
  },
  {
    id: '4',
    type: 'media',
    title: 'Media Release: Hidden Costs Exposed',
    description: 'Press release template for advocacy groups',
    content: `FOR IMMEDIATE RELEASE

New Analysis Reveals True Cost of Youth Detention: $1,570 Per Day

BRISBANE - Government data analysis reveals Queensland taxpayers are paying $1,570 per day to detain each young person - nearly double the official figure of $857.

Key findings:
• Hidden costs include healthcare, education, security, and infrastructure
• Community programs cost only $150-300 per day with 26% better outcomes
• Total annual cost exceeds $500 million for approximately 300 detained youth

"This represents a catastrophic failure of public policy and fiscal responsibility," said [Spokesperson].

The analysis, based on Queensland Audit Office data and Treasury documents, exposes systematic underreporting of youth detention costs.

CONTACT: [Name] | [Email] | [Phone]

###`,
    tags: ['media', 'costs', 'transparency']
  }
]

const actionTemplates = [
  {
    title: 'Social Media Blitz',
    description: 'Coordinated campaign across all platforms',
    steps: [
      'Download key statistics graphics',
      'Schedule posts for peak engagement (7-9am, 12-1pm, 6-8pm)',
      'Tag @QLDYouthJustice @PremierAnnastacia @YvetteDAth',
      'Use hashtags: #QLDYouthJustice #JusticeNotJails #RaiseTheAge'
    ]
  },
  {
    title: 'Community Presentation',
    description: 'Ready-made slides for community groups',
    steps: [
      'Download presentation template',
      'Customize with local statistics',
      'Book community hall or library meeting room',
      'Invite local media and MPs'
    ]
  },
  {
    title: 'Parliamentary Submission',
    description: 'Evidence-based submission template',
    steps: [
      'Use official government data citations',
      'Focus on cost-effectiveness arguments',
      'Include personal stories (with permission)',
      'Submit during committee inquiry periods'
    ]
  }
]

export default function CampaignsPage() {
  const [selectedResource, setSelectedResource] = useState<CampaignResource | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'social' | 'email' | 'print' | 'media'>('all')

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shareResource = (resource: CampaignResource, platform: string) => {
    const url = window.location.href
    const text = resource.content.substring(0, 280) // Twitter limit
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(resource.title)}&body=${encodeURIComponent(resource.content)}`
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(resource.content)}`)
        break
    }
  }

  const filteredResources = filter === 'all' 
    ? campaignResources 
    : campaignResources.filter(r => r.type === filter)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Megaphone className="w-8 h-8 text-qld-maroon" />
          <h1 className="text-4xl font-bold text-gray-900">Campaign Toolkit</h1>
        </div>
        <p className="text-xl text-gray-600">
          Evidence-based resources to demand youth justice reform. Every share matters.
        </p>
      </div>

      {/* Quick Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Target className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-900">47,382</p>
          <p className="text-sm text-blue-700">Campaign Shares</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <Users className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-900">2,145</p>
          <p className="text-sm text-green-700">Active Advocates</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Mail className="w-6 h-6 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-purple-900">892</p>
          <p className="text-sm text-purple-700">MPs Contacted</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <Megaphone className="w-6 h-6 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-amber-900">156</p>
          <p className="text-sm text-amber-700">Media Stories</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'social', 'email', 'print', 'media'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filter === type
                ? 'bg-qld-maroon text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaign Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{resource.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                resource.type === 'social' ? 'bg-blue-100 text-blue-700' :
                resource.type === 'email' ? 'bg-green-100 text-green-700' :
                resource.type === 'print' ? 'bg-purple-100 text-purple-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {resource.type.toUpperCase()}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {resource.content}
              </pre>
            </div>

            {resource.shareStats && (
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{resource.shareStats.shares.toLocaleString()} shares</span>
                <span>{resource.shareStats.engagement.toLocaleString()} engagements</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(resource.content, resource.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Copy className="w-4 h-4" />
                {copiedId === resource.id ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={() => shareResource(resource, 'twitter')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Twitter className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => shareResource(resource, 'facebook')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Facebook className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => shareResource(resource, 'email')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Mail className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => shareResource(resource, 'whatsapp')}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Templates */}
      <div className="bg-gradient-to-r from-qld-maroon to-qld-maroon/80 text-white rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Ready-to-Use Action Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actionTemplates.map((template, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">{template.title}</h3>
              <p className="text-sm opacity-90 mb-4">{template.description}</p>
              <ol className="space-y-2">
                {template.steps.map((step, stepIdx) => (
                  <li key={stepIdx} className="text-sm flex items-start gap-2">
                    <span className="font-bold">{stepIdx + 1}.</span>
                    <span className="opacity-90">{step}</span>
                  </li>
                ))}
              </ol>
              <button className="mt-4 px-4 py-2 bg-white text-qld-maroon rounded-lg font-medium hover:bg-gray-100 transition">
                Get Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resources Download */}
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Download Campaign Materials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">Social Media Graphics Pack</p>
                <p className="text-sm text-gray-600">Instagram, Twitter, Facebook ready</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">15 MB</span>
          </button>
          
          <button className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">Print Materials Bundle</p>
                <p className="text-sm text-gray-600">Flyers, posters, fact sheets</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">25 MB</span>
          </button>
        </div>
      </div>
    </div>
  )
}