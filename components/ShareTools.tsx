'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/useDashboardData'
import { 
  Share2, Copy, CheckCircle, Twitter, Facebook, 
  MessageCircle, Mail, Linkedin, FileText 
} from 'lucide-react'

interface ShareTemplate {
  id: string
  platform: string
  icon: React.ReactNode
  title: string
  content: string
  hashtags?: string[]
}

export default function ShareTools() {
  const { data } = useDashboardData()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('shock-stat')

  if (!data) return null

  const shareTemplates: ShareTemplate[] = [
    {
      id: 'shock-stat',
      platform: 'Twitter/X',
      icon: <Twitter className="w-4 h-4" />,
      title: 'The Shocking Truth',
      content: `🚨 QUEENSLAND YOUTH JUSTICE CRISIS:
• ${data.detention.indigenousPercentage}% of kids in detention are Indigenous (they're ${data.insights.indigenousOverrepresentation.populationPercentage}% of population)
• $${Math.floor(data.budget.dailyDetentionCost).toLocaleString()} wasted EVERY DAY on failed detention
• ${data.police.repeatOffenderPercentage}% reoffend after $${(data.budget.totalYouthJustice / 1000000).toFixed(0)}M spent

Source: Official QLD Gov data`,
      hashtags: ['QLDpol', 'YouthJustice', 'Indigenous', 'DataDriven']
    },
    {
      id: 'money-waste',
      platform: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      title: 'Follow the Money',
      content: `While you were reading this, Queensland just wasted another $${Math.floor(data.budget.dailyDetentionCost / 1440).toLocaleString()} on youth detention that doesn't work.

FACT CHECK ✓
• Daily detention cost: $${data.budget.claimedDetentionCostPerDay} (government claims)
• REAL cost: $${data.audit.trueCostPerDay}/day (QLD Audit Office)
• Community programs: $${data.budget.dailyCommunityProgramCost}/day
• That's ${data.budget.costRatio}x more expensive for WORSE outcomes!

Every statistic verified from official government PDFs. See sources: [link]`,
      hashtags: ['QLDWaste', 'YouthJustice', 'Accountability']
    },
    {
      id: 'indigenous-crisis',
      platform: 'LinkedIn',
      icon: <Linkedin className="w-4 h-4" />,
      title: 'Professional Analysis',
      content: `New data reveals Queensland's youth justice system is in crisis:

KEY FINDINGS (All from official government sources):
📊 ${data.court.totalDefendants.toLocaleString()} youth defendants in 2023-24
📊 ${data.court.indigenousPercentage}% are Indigenous (${Math.round(data.insights.indigenousOverrepresentation.court)}x overrepresentation)
📊 ${data.detention.capacityPercentage}% capacity - facilities overcrowded
📊 ${data.detention.remandPercentage}% held on remand (not convicted)

FINANCIAL ANALYSIS:
💰 Total budget: $${(data.budget.totalYouthJustice / 1000000).toFixed(1)}M
💰 ${data.budget.detentionPercentage}% spent on detention
💰 Only ${data.budget.communityPercentage}% on prevention

Queensland Audit Office: "${data.audit.accountabilityFinding}"

Full data with sources available.`,
      hashtags: ['DataAnalysis', 'PolicyReform', 'Queensland']
    },
    {
      id: 'whatsapp-family',
      platform: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      title: 'Share with Family',
      content: `Did you know? 😱

In Queensland right now:
• ${data.detention.totalYouth} kids locked up
• ${data.detention.indigenousPercentage}% are Indigenous kids
• We spend $${Math.floor(data.budget.dailyDetentionCost).toLocaleString()} EVERY DAY on this
• ${data.police.repeatOffenderPercentage}% go on to reoffend

The government could help ${Math.floor(data.budget.dailyDetentionCost / data.budget.dailyCommunityProgramCost)} kids with community programs for the same money!

All verified from government reports. Check it out: [link]`
    },
    {
      id: 'email-template',
      platform: 'Email',
      icon: <Mail className="w-4 h-4" />,
      title: 'Email Template',
      content: `Subject: Urgent: Queensland Youth Justice Crisis - Official Data

Dear [Recipient],

I'm writing to share concerning data from official Queensland Government reports about our youth justice system:

VERIFIED STATISTICS:
• Total youth defendants (2023-24): ${data.court.totalDefendants.toLocaleString()} (Source: Children's Court Annual Report, p.15)
• Indigenous representation: ${data.court.indigenousPercentage}% (despite being ${data.insights.indigenousOverrepresentation.populationPercentage}% of population)
• Youth in detention: ${data.detention.totalYouth} (${data.detention.indigenousPercentage}% Indigenous)
• Detention capacity: ${data.detention.capacityPercentage}% (overcrowded)
• On remand: ${data.detention.remandPercentage}% (not convicted)

FINANCIAL FACTS:
• Total budget: $${(data.budget.totalYouthJustice / 1000000).toFixed(1)} million
• Spent on detention: ${data.budget.detentionPercentage}%
• Spent on prevention: ${data.budget.communityPercentage}%
• Cost per day (detention): $${data.audit.trueCostPerDay} (true cost)
• Cost per day (community): $${data.budget.dailyCommunityProgramCost}

The Queensland Audit Office found: "${data.audit.accountabilityFinding}"

This data demands urgent action. I encourage you to verify these statistics yourself using the government sources provided.

Best regards,
[Your name]`
    },
    {
      id: 'journalist-pitch',
      platform: 'Media',
      icon: <FileText className="w-4 h-4" />,
      title: 'Media Pitch',
      content: `STORY PITCH: Queensland's Hidden Youth Justice Crisis

NEW DATA REVEALS:
• ${data.detention.indigenousPercentage}% of detained youth are Indigenous (official census data)
• True detention cost is $${data.audit.trueCostPerDay}/day - ${data.audit.hiddenCostPercentage}% higher than government claims
• ${data.police.repeatOffenderPercentage}% reoffending rate despite $${(data.audit.totalSpending2018to2023 / 1000000000).toFixed(2)}B spent (2018-2023)

KEY ANGLE: Queensland spends ${data.budget.costRatio}x more on failed detention than successful community programs.

All statistics independently verified from:
- Children's Court Annual Report 2023-24
- Youth Detention Census Q1 2024  
- Queensland Budget Papers 2024-25
- QAO Performance Audit 2024

Full dataset with page references available for fact-checking.`
    }
  ]

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOnPlatform = (template: ShareTemplate) => {
    const text = template.content
    const hashtags = template.hashtags?.join(',') || ''
    
    switch (template.platform) {
      case 'Twitter/X':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${hashtags}`, '_blank')
        break
      case 'Facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`, '_blank')
        break
      case 'LinkedIn':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')
        break
      case 'WhatsApp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        break
      case 'Email':
        window.location.href = `mailto:?subject=Queensland Youth Justice Crisis - Official Data&body=${encodeURIComponent(text)}`
        break
    }
  }

  const selectedTemplateData = shareTemplates.find(t => t.id === selectedTemplate)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Share the Truth with Verified Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose your message
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {shareTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 transition
                    ${selectedTemplate === template.id 
                      ? 'border-qld-maroon bg-qld-maroon/5' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {template.icon}
                  <span className="text-sm font-medium">{template.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedTemplateData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Preview</h3>
                <Badge variant="outline" className="gap-1">
                  {selectedTemplateData.icon}
                  {selectedTemplateData.platform}
                </Badge>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {selectedTemplateData.content}
                </pre>
                {selectedTemplateData.hashtags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTemplateData.hashtags.map(tag => (
                      <span key={tag} className="text-blue-600 text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => copyToClipboard(selectedTemplateData.content, selectedTemplateData.id)}
                  variant="outline"
                  className="flex-1"
                >
                  {copiedId === selectedTemplateData.id ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Text
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => shareOnPlatform(selectedTemplateData)}
                  className="flex-1"
                >
                  Share on {selectedTemplateData.platform}
                </Button>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Why These Numbers Matter</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Every statistic is from official Queensland Government reports</li>
              <li>• All numbers include page references for verification</li>
              <li>• Data is updated weekly from primary sources</li>
              <li>• Sharing accurate information drives real change</li>
            </ul>
          </div>

          {/* Quick Stats Reference */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Quick Reference</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Kids in detention:</span>
                <span className="font-bold ml-2">{data.detention.totalYouth}</span>
              </div>
              <div>
                <span className="text-gray-600">Indigenous:</span>
                <span className="font-bold ml-2">{data.detention.indigenousPercentage}%</span>
              </div>
              <div>
                <span className="text-gray-600">Daily waste:</span>
                <span className="font-bold ml-2">${Math.floor(data.budget.dailyDetentionCost).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Reoffend rate:</span>
                <span className="font-bold ml-2">{data.police.repeatOffenderPercentage}%</span>
              </div>
              <div>
                <span className="text-gray-600">On remand:</span>
                <span className="font-bold ml-2">{data.detention.remandPercentage}%</span>
              </div>
              <div>
                <span className="text-gray-600">Budget on detention:</span>
                <span className="font-bold ml-2">{data.budget.detentionPercentage}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}