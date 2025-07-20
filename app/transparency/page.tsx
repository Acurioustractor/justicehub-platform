'use client'

import { useEffect, useState } from 'react'
import TransparencyScore from '@/components/TransparencyScore'
import RecentActivity from '@/components/RecentActivity'

interface TransparencyData {
  transparency: {
    overall_score: number
    grade: string
    categories: {
      [key: string]: {
        weight: number
        score: number
        status: string
      }
    }
  }
  documents: {
    total: number
    recent: Array<{
      title: string
      date: string
      type: string
    }>
  }
}

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/transparency')
        if (!response.ok) throw new Error('Failed to fetch transparency data')
        const data = await response.json()
        setData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-qld-maroon"></div></div>
    )
  }

  if (error || !data) {
    return <div className="p-8 text-red-600">Error: {error || 'No data available'}</div>
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold">Transparency Hub</h1>
      <p className="text-gray-600 mt-2 mb-8">Accountability-related information, such as the parliamentary document tracker, media citations, and RTI requests.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TransparencyScore data={data.transparency} />
          <RecentActivity documents={data.documents} />
      </div>
    </div>
  )
}
