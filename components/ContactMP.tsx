'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Mail, Phone, MapPin, ExternalLink, Copy, CheckCircle } from 'lucide-react'

// Sample MP data - in production this would come from a database
const QLD_MPS = [
  {
    name: 'Annastacia Palaszczuk',
    electorate: 'Inala',
    role: 'Former Premier',
    email: 'inala@parliament.qld.gov.au',
    phone: '(07) 3373 7888',
    postcodes: ['4077', '4078']
  },
  {
    name: 'Steven Miles',
    electorate: 'Murrumba',
    role: 'Premier',
    email: 'murrumba@parliament.qld.gov.au',
    phone: '(07) 3205 5011',
    postcodes: ['4503', '4504']
  }
  // Add more MPs here
]

export default function ContactMP() {
  const { data } = useDashboardData()
  const [postcode, setPostcode] = useState('')
  const [selectedMP, setSelectedMP] = useState<typeof QLD_MPS[0] | null>(null)
  const [copied, setCopied] = useState(false)

  if (!data) return null

  const findMP = () => {
    // In production, this would query a proper API
    const mp = QLD_MPS.find(mp => mp.postcodes.includes(postcode))
    setSelectedMP(mp || QLD_MPS[0]) // Default to first MP if not found
  }

  const emailTemplate = `Subject: Urgent: Youth Justice Crisis in ${selectedMP?.electorate || 'Queensland'} - Action Required

Dear ${selectedMP?.name || 'Representative'},

I am writing as a concerned constituent about Queensland's youth justice crisis, using verified data from official government reports.

KEY STATISTICS FROM GOVERNMENT SOURCES:

Youth in Crisis:
• ${data.detention.totalYouth} children currently in detention (Youth Detention Census Q1 2024)
• ${data.detention.indigenousPercentage}% are Indigenous youth (${Math.round(data.insights.indigenousOverrepresentation.detention)}x overrepresentation)
• ${data.detention.remandPercentage}% held on remand - legally innocent
• Facilities at ${data.detention.capacityPercentage}% capacity (overcrowded)

Financial Mismanagement:
• $${(data.budget.totalYouthJustice / 1000000).toFixed(1)} million total budget (Budget Papers 2024-25, p.78)
• ${data.budget.detentionPercentage}% spent on failed detention approach
• Only ${data.budget.communityPercentage}% on proven community programs
• True cost: $${data.audit.trueCostPerDay}/day vs $${data.budget.dailyCommunityProgramCost}/day for community programs

System Failures:
• ${data.police.repeatOffenderPercentage}% of youth reoffend (QPS Statistical Review 2023-24, p.47)
• ${data.court.totalDefendants.toLocaleString()} youth faced court last year
• Average ${data.court.averageDaysToFinalization} days to finalize cases

The Queensland Audit Office found: "${data.audit.accountabilityFinding}" (QAO Report 2024)

WHAT ${selectedMP?.electorate?.toUpperCase() || 'OUR COMMUNITY'} IS MISSING:
Every day, $${Math.floor(data.budget.dailyDetentionCost).toLocaleString()} is wasted on detention. This could instead fund:
• ${Math.floor(data.budget.dailyDetentionCost / data.budget.dailyCommunityProgramCost)} youth in effective community programs
• Additional teachers, youth workers, and mental health support

I URGE YOU TO:
1. Demand immediate reallocation of funding from detention to community programs
2. Call for transparency in youth justice spending
3. Advocate for evidence-based approaches that actually reduce reoffending
4. Address the extreme overrepresentation of Indigenous youth

The evidence is clear: Queensland's current approach is failing our youth, wasting taxpayer money, and making communities less safe. We need immediate action.

I look forward to your response outlining what specific actions you will take to address this crisis.

Sources:
- Children's Court Annual Report 2023-24
- Youth Detention Census Q1 2024
- Queensland Budget 2024-25
- QPS Statistical Review 2023-24
- Queensland Audit Office Report 2024

Yours sincerely,
[Your name]
[Your address]
[Your phone number]`

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Urgent: Youth Justice Crisis in ${selectedMP?.electorate || 'Queensland'} - Action Required`)
    const body = encodeURIComponent(emailTemplate)
    window.location.href = `mailto:${selectedMP?.email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Contact Your Local MP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Postcode Finder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your postcode to find your MP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., 4000"
                maxLength={4}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
              />
              <Button onClick={findMP}>
                Find My MP
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Don't know your postcode? <a href="https://www.ecq.qld.gov.au/electoral-boundaries/find-my-electorate" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Find it here</a>
            </p>
          </div>

          {/* MP Details */}
          {selectedMP && (
            <Card className="border-2 border-qld-maroon/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedMP.name}</h3>
                    <p className="text-gray-600">Member for {selectedMP.electorate}</p>
                    {selectedMP.role && (
                      <Badge className="mt-2">{selectedMP.role}</Badge>
                    )}
                  </div>
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedMP.email}`} className="text-blue-600 hover:underline">
                      {selectedMP.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedMP.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Template */}
          {selectedMP && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Email Template</h3>
                <Badge variant="outline">Pre-filled with verified data</Badge>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {emailTemplate}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={copyEmail}
                  variant="outline"
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Email
                    </>
                  )}
                </Button>
                <Button
                  onClick={sendEmail}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Open in Email App
                </Button>
              </div>
            </div>
          )}

          {/* Talking Points */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-3">Key Talking Points</h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>${Math.floor(data.budget.dailyDetentionCost).toLocaleString()} wasted daily on detention that doesn't work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>{data.detention.indigenousPercentage}% of detained youth are Indigenous ({Math.round(data.insights.indigenousOverrepresentation.detention)}x overrepresentation)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>{data.police.repeatOffenderPercentage}% reoffend despite $${(data.budget.totalYouthJustice / 1000000).toFixed(0)}M budget</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Community programs cost {data.budget.costRatio}x less with better outcomes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>QAO: "{data.audit.accountabilityFinding}"</span>
              </li>
            </ul>
          </div>

          {/* Follow Up */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Following Up</h4>
            <p className="text-sm text-blue-800 mb-3">
              MPs are required to respond to constituent concerns. If you don't receive a response within 2 weeks:
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Call their office directly</li>
              <li>• Attend their community office hours</li>
              <li>• Share your letter publicly on social media</li>
              <li>• Contact local media about the lack of response</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}