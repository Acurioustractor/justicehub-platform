'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from "@/lib/supabase/client"


export default function RawDataPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      const response = await fetch('/api/raw-data')
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const allData = await response.json()
      setData(allData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadJSON = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qld-youth-justice-raw-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadText = () => {
    if (!data?.scraped_content) return
    
    let content = 'QUEENSLAND YOUTH JUSTICE TRACKER - RAW SCRAPED CONTENT\n'
    content += '='.repeat(60) + '\n\n'
    
    if (data.scraped_content.length === 0) {
      content += 'NO SCRAPED CONTENT FOUND\n'
    } else {
      data.scraped_content.forEach((item: any, i: number) => {
        content += `RECORD ${i + 1}\n`
        content += '-'.repeat(20) + '\n'
        content += `Source: ${item.source}\n`
        content += `URL: ${item.source_url}\n`
        content += `Type: ${item.type}\n`
        content += `Mentions: ${item.mentions}\n`
        content += `Scraped: ${item.scraped_at}\n`
        content += `Content:\n${item.content}\n\n`
        content += '='.repeat(60) + '\n\n'
      })
    }
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qld-youth-justice-scraped-content-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading raw data...</p>
        </div>
      </div>
    )
  }

  const scrapedCount = data?.scraped_content?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Brutal Honesty Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-red-800 mb-4">
            ⚠️ BRUTAL HONESTY: Raw Data Reality Check
          </h1>
          <p className="text-xl text-red-700 mb-4">
            Here's exactly what data we're actually collecting. Spoiler: It's pretty basic website content, 
            not the deep government statistics you want.
          </p>
          <div className="bg-red-100 rounded-lg p-4">
            <h2 className="text-lg font-bold text-red-800 mb-2">What We DON'T Have:</h2>
            <ul className="text-red-700 space-y-1">
              <li>❌ Actual detention rates or statistics</li>
              <li>❌ Indigenous overrepresentation data</li>
              <li>❌ Cost per youth detained</li>
              <li>❌ Reoffending/recidivism rates</li>
              <li>❌ Program effectiveness metrics</li>
              <li>❌ Real budget breakdowns</li>
              <li>❌ Meaningful youth justice reform data</li>
            </ul>
          </div>
        </div>

        {/* Current Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 What We Actually Have</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Scraped Content Records</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">{scrapedCount}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Budget Records</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded">{data?.budget_allocations?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Parliament Records</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded">{data?.parliamentary_documents?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Scraper Health Records</span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded">{data?.scraper_health?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📥 Download Raw Data</h2>
            <p className="text-gray-600 mb-4">
              Download the actual data we've collected so you can see for yourself what we have.
            </p>
            <div className="space-y-3">
              <button 
                onClick={downloadJSON}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                📄 Download JSON (All Data)
              </button>
              <button 
                onClick={downloadText}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                📝 Download Text (Scraped Content)
              </button>
            </div>
          </div>
        </div>

        {/* Actual Scraped Content Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📄 Actual Scraped Content ({scrapedCount} records)
          </h2>
          
          {scrapedCount === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤷‍♂️</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Data Collected Yet</h3>
              <p className="text-gray-600">The scrapers haven't collected any meaningful data.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.scraped_content.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{item.source}</h3>
                      <p className="text-sm text-gray-600">{item.source_url}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                        {item.mentions} keywords
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.scraped_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">What we actually scraped:</h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.content?.substring(0, 800)}
                      {item.content && item.content.length > 800 && '\n\n... (truncated)'}
                    </pre>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Reality:</strong> This is just basic website navigation content, 
                      not the detailed youth justice statistics needed for meaningful analysis.
                    </p>
                  </div>
                </div>
              ))}
              
              {scrapedCount > 3 && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    ... and {scrapedCount - 3} more similar records. 
                    Download the full data to see everything.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* What We Need To Do */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">🎯 What We Need To Do Next</h2>
          <p className="text-blue-700 mb-4">
            To get meaningful youth justice data, we need to target specific reports and datasets:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-blue-800 mb-2">🎯 Target Specific Reports:</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• Queensland Courts Annual Reports (PDFs)</li>
                <li>• Youth Justice Department annual data</li>
                <li>• Queensland Police crime statistics datasets</li>
                <li>• Budget papers with detailed breakdowns</li>
                <li>• Parliamentary committee reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-2">🔧 Technical Improvements:</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• PDF extraction capabilities</li>
                <li>• CSV/Excel data parsing</li>
                <li>• Better content filtering</li>
                <li>• Statistical data extraction</li>
                <li>• Time series data collection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}