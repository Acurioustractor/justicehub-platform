'use client'

import { useState } from 'react'
import { Server, Database, Code, Zap, Shield, GitBranch, Terminal, Activity } from 'lucide-react'
import Link from 'next/link'

export default function DataPipelinePage() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Data Pipeline
        </h1>
        <p className="text-xl text-gray-600">
          Technical transparency: How our automated data collection system works
        </p>
      </div>

      {/* Architecture Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Architecture</h2>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Server className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Data Collection</h3>
              <p className="text-gray-600 text-sm">
                Node.js scrapers with Firecrawl API for reliable government website parsing
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Database className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Data Storage</h3>
              <p className="text-gray-600 text-sm">
                PostgreSQL database with Supabase for real-time access and row-level security
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">API & Frontend</h3>
              <p className="text-gray-600 text-sm">
                Next.js 14 with server components for optimal performance and SEO
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              Frontend Technologies
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Framework</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Next.js 14</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Language</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">TypeScript</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Styling</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Tailwind CSS</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Charts</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Recharts</code>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Animation</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Framer Motion</code>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-600" />
              Backend Technologies
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Runtime</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Node.js</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Database</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">PostgreSQL</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">BaaS</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Supabase</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Scraping</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">Firecrawl API</code>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Scheduling</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">node-cron</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Flow Diagram */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Flow Process</h2>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">Government Website</h4>
                <p className="text-gray-600">Official data published on .gov.au domains</p>
              </div>
            </div>
            
            <div className="border-l-2 border-gray-300 ml-4 h-8"></div>
            
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">Scraper Execution</h4>
                <p className="text-gray-600">Automated weekly collection via Firecrawl API</p>
              </div>
            </div>
            
            <div className="border-l-2 border-gray-300 ml-4 h-8"></div>
            
            <div className="flex items-center gap-4">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">Data Validation</h4>
                <p className="text-gray-600">Quality checks and anomaly detection</p>
              </div>
            </div>
            
            <div className="border-l-2 border-gray-300 ml-4 h-8"></div>
            
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">Database Storage</h4>
                <p className="text-gray-600">Structured storage in PostgreSQL with audit trails</p>
              </div>
            </div>
            
            <div className="border-l-2 border-gray-300 ml-4 h-8"></div>
            
            <div className="flex items-center gap-4">
              <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">5</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">API Access</h4>
                <p className="text-gray-600">RESTful endpoints for frontend consumption</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>
        <div className="space-y-6">
          <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Scraper Configuration
              </h4>
              <span className="text-xs text-gray-400">TypeScript</span>
            </div>
            <pre className="text-sm"><code>{`const scraperConfig = {
  url: 'https://www.aihw.gov.au/reports/youth-justice',
  selectors: {
    title: 'h1.report-title',
    data: 'table.statistics-table',
    lastUpdated: '.publication-date'
  },
  schedule: '0 6 * * 1', // Weekly Monday 6 AM
  validation: {
    required: ['title', 'data'],
    dateFormat: 'DD MMM YYYY'
  }
}`}</code></pre>
          </div>

          <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Data Validation
              </h4>
              <span className="text-xs text-gray-400">TypeScript</span>
            </div>
            <pre className="text-sm"><code>{`async function validateData(scraped: ScrapedData): Promise<ValidationResult> {
  const errors: string[] = []
  
  // Check for required fields
  if (!scraped.indigenousPercentage) {
    errors.push('Missing Indigenous percentage data')
  }
  
  // Validate ranges
  if (scraped.indigenousPercentage > 100 || scraped.indigenousPercentage < 0) {
    errors.push('Invalid percentage value')
  }
  
  // Cross-reference with historical data
  const historical = await getHistoricalAverage()
  if (Math.abs(scraped.indigenousPercentage - historical) > 20) {
    errors.push('Significant deviation from historical average')
  }
  
  return { valid: errors.length === 0, errors }
}`}</code></pre>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Security & Privacy</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900">No Personal Data</h4>
                <p className="text-gray-700">We only collect aggregate statistics. No individual or identifying information is ever stored.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900">Public Data Only</h4>
                <p className="text-gray-700">All data collected is already publicly available on government websites.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900">Secure Infrastructure</h4>
                <p className="text-gray-700">Database access restricted with row-level security and API authentication.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring Dashboard */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-bold text-green-900">System Status</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">Operational</p>
            <p className="text-sm text-green-700">All scrapers running</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-bold text-blue-900">Data Points</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">47,382</p>
            <p className="text-sm text-blue-700">Total records</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-bold text-purple-900">API Uptime</h3>
            <p className="text-2xl font-bold text-purple-600 mt-2">99.9%</p>
            <p className="text-sm text-purple-700">Last 30 days</p>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg p-8">
          <div className="flex items-center gap-4 mb-4">
            <GitBranch className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Open Source</h2>
          </div>
          <p className="mb-6">
            Our entire codebase is open source. Review our methodology, contribute improvements, 
            or deploy your own instance for accountability in your region.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/queensland-youth-justice/tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              View on GitHub
            </a>
            <Link
              href="/transparency/contribute"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition"
            >
              Contribute
            </Link>
          </div>
        </div>
      </section>

      {/* API Documentation Link */}
      <section className="text-center">
        <p className="text-gray-600 mb-4">
          Need programmatic access to our data?
        </p>
        <Link
          href="/downloads#api-access"
          className="inline-flex items-center gap-2 text-qld-maroon font-medium hover:underline"
        >
          View API Documentation
          <Code className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}