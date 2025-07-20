'use client'

import { useState, useEffect } from 'react'

export default function DebugDataPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Fetching data from API...')
      const response = await fetch('/api/raw-data')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result)
      setData(result)
      
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">🔍 Debug Data Viewer</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">🔍 Debug Data Viewer</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">❌ Error</h2>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🔍 Debug Data Viewer</h1>
        
        {/* Summary */}
        {data?.summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📊 Data Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-2xl font-bold text-blue-600">{data.summary.total_scraped_records}</div>
                <div className="text-sm text-blue-800">Scraped Records</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-2xl font-bold text-green-600">{data.summary.total_budget_records}</div>
                <div className="text-sm text-green-800">Budget Records</div>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-2xl font-bold text-purple-600">{data.summary.total_parliament_records}</div>
                <div className="text-sm text-purple-800">Parliament Records</div>
              </div>
              <div className="bg-orange-50 p-4 rounded">
                <div className="text-2xl font-bold text-orange-600">{data.summary.total_health_records}</div>
                <div className="text-sm text-orange-800">Health Records</div>
              </div>
            </div>
            
            {data.summary.data_sources && data.summary.data_sources.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">🌐 Data Sources:</h3>
                <div className="flex flex-wrap gap-2">
                  {data.summary.data_sources.map((source: string, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scraped Content */}
        {data?.scraped_content && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              📄 Scraped Content ({data.scraped_content.length} records)
            </h2>
            
            {data.scraped_content.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🤷‍♂️</div>
                <p className="text-gray-600">No scraped content found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.scraped_content.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{item.source}</h3>
                      <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                        {item.mentions} mentions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.source_url}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      Type: {item.type} | Scraped: {new Date(item.scraped_at).toLocaleString()}
                    </p>
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium mb-1">Content:</h4>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {item.content?.substring(0, 500)}
                        {item.content && item.content.length > 500 && '\n\n... (truncated)'}
                      </pre>
                    </div>
                  </div>
                ))}
                
                {data.scraped_content.length > 5 && (
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-gray-600">
                      ... and {data.scraped_content.length - 5} more records
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Raw JSON */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔧 Raw JSON Data</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}