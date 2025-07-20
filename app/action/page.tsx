'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ShareTools from '@/components/ShareTools'
import ContactMP from '@/components/ContactMP'
import DownloadCenter from '@/components/DownloadCenter'
import ImpactCalculator from '@/components/ImpactCalculator'
import { Share2, Mail, Download, Calculator } from 'lucide-react'

export default function ActionPage() {
  const [activeTab, setActiveTab] = useState('share')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Take Action on Youth Justice
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use verified government data to drive real change. Every action you take helps expose the truth and demand accountability.
          </p>
        </div>

        {/* Action Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Contact MP</span>
            </TabsTrigger>
            <TabsTrigger value="download" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </TabsTrigger>
            <TabsTrigger value="calculate" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Impact</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="mt-8">
            <ShareTools />
          </TabsContent>

          <TabsContent value="contact" className="mt-8">
            <ContactMP />
          </TabsContent>

          <TabsContent value="download" className="mt-8">
            <DownloadCenter />
          </TabsContent>

          <TabsContent value="calculate" className="mt-8">
            <ImpactCalculator />
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-qld-maroon/5 border-2 border-qld-maroon/20 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why This Matters
            </h2>
            <p className="text-gray-700 mb-6">
              Every day of inaction costs Queensland taxpayers over $1.2 million and fails hundreds of vulnerable young people. 
              The evidence is clear, the solutions exist, but nothing will change without public pressure.
            </p>
            <p className="text-lg font-medium text-qld-maroon">
              Your voice matters. Use these tools to demand better.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}