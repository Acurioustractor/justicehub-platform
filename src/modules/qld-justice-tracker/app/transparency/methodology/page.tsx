'use client'

import { Check, AlertCircle, Shield, Database, Code, FileSearch, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          How We Work
        </h1>
        <p className="text-xl text-gray-600">
          Complete transparency in our data collection and analysis methodology
        </p>
      </div>

      {/* Trust Statement */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-green-900 mb-2">Our Commitment to Truth</h2>
            <p className="text-green-800">
              Every piece of data on this platform comes directly from official Queensland Government sources. 
              We don't create data – we reveal what already exists in government systems but isn't being 
              effectively communicated to the public.
            </p>
          </div>
        </div>
      </div>

      {/* Core Principles */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Government Sources Only
            </h3>
            <p className="text-gray-700">
              We exclusively use data from official government websites, reports, and disclosures. 
              No third-party or unverified sources are included in our analysis.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Automated Collection
            </h3>
            <p className="text-gray-700">
              Our scrapers run weekly to ensure data is current. All collection is automated to 
              prevent human error and ensure consistency.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Transparent Process
            </h3>
            <p className="text-gray-700">
              Our entire codebase is open source. Anyone can verify our methodology, data sources, 
              and calculations.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              No Manipulation
            </h3>
            <p className="text-gray-700">
              We present data exactly as published by government sources. No adjustments, 
              estimations, or projections unless clearly labeled.
            </p>
          </div>
        </div>
      </section>

      {/* Data Collection Process */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Collection Process</h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <FileSearch className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">1. Source Identification</h3>
                <p className="text-gray-700 mb-3">
                  We identify official government sources that publish youth justice data:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Australian Institute of Health and Welfare (AIHW)</li>
                  <li>Queensland Treasury budget papers</li>
                  <li>Children's Court of Queensland reports</li>
                  <li>Queensland Police Service statistics</li>
                  <li>Department of Youth Justice publications</li>
                  <li>Right to Information (RTI) disclosures</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Code className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">2. Automated Scraping</h3>
                <p className="text-gray-700 mb-3">
                  Our scrapers use industry-standard tools to collect data:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Firecrawl API for web page content extraction</li>
                  <li>PDF parsing for budget documents and reports</li>
                  <li>API integration where available (e.g., QPS crime stats)</li>
                  <li>HTML parsing for structured data tables</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">3. Data Validation</h3>
                <p className="text-gray-700 mb-3">
                  Every data point goes through validation:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Cross-reference multiple sources when available</li>
                  <li>Flag anomalies for manual review</li>
                  <li>Maintain audit trail of all changes</li>
                  <li>Store original source documents</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 rounded-full p-3">
                <RefreshCw className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">4. Regular Updates</h3>
                <p className="text-gray-700 mb-3">
                  Data freshness is maintained through:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Weekly automated scraping runs</li>
                  <li>Real-time alerts for significant changes</li>
                  <li>Historical data preservation</li>
                  <li>Version tracking for all updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Assurance */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quality Assurance</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">Source Verification</h4>
                <p className="text-gray-700">Every source URL is documented and can be independently verified</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">Data Consistency</h4>
                <p className="text-gray-700">Automated checks ensure data consistency across time periods</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">Error Handling</h4>
                <p className="text-gray-700">Failed scrapes are logged and retried with manual oversight</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">Transparency Reports</h4>
                <p className="text-gray-700">Monthly reports on data collection success rates and issues</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Known Limitations</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="space-y-3">
              <p className="text-amber-900">
                While we strive for complete accuracy, some limitations exist:
              </p>
              <ul className="list-disc list-inside text-amber-800 space-y-2">
                <li>Government data is often published with 3-6 month delays</li>
                <li>Some data is only available annually, limiting real-time insights</li>
                <li>RTI requests may be partially redacted or refused</li>
                <li>Different agencies use different reporting periods and methodologies</li>
                <li>Historical data may be revised by agencies without notice</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mb-12">
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Everything</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            We encourage you to verify our data against the original sources. 
            Transparency and accountability work both ways.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sources"
              className="px-6 py-3 bg-qld-maroon text-white rounded-lg font-medium hover:bg-qld-maroon/90 transition"
            >
              View All Sources
            </Link>
            <Link
              href="/transparency/pipeline"
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Technical Details
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="text-center text-gray-600">
        <p>
          Questions about our methodology? Found an error? 
          <Link href="/transparency/contribute" className="text-qld-maroon hover:underline ml-1">
            Contact us
          </Link>
        </p>
      </section>
    </div>
  )
}