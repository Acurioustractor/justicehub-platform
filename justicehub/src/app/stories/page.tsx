'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function Stories() {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    fetchStories()
  }, [filter])
  
  const fetchStories = async () => {
    setLoading(true)
    
    try {
      let query = supabase
        .from('stories')
        .select('*, youth_profiles(users(display_name))')
        .order('created_at', { ascending: false })
      
      if (filter !== 'all') {
        query = query.eq('source', filter)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching stories:', error)
        return
      }
      
      setStories(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchTerm.trim()) {
      fetchStories()
      return
    }
    
    const filteredStories = stories.filter(story => 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.tags && story.tags.some((tag: string) => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    )
    
    setStories(filteredStories)
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stories</h1>
        
        <Link 
          href="/stories/create" 
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Create Story
        </Link>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('local')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'local' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Platform
              </button>
              <button 
                onClick={() => setFilter('airtable')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'airtable' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Airtable
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stories..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stories...</p>
        </div>
      ) : stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    story.source === 'local' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {story.source === 'local' ? 'Platform' : 'Airtable'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold mb-2">{story.title}</h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {story.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    By {story.youth_profiles?.users?.display_name || 'Anonymous'}
                  </div>
                  
                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {story.tags.slice(0, 2).map((tag: string, index: number) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {story.tags.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          +{story.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 mb-4">No stories found</p>
          <Link 
            href="/stories/create" 
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create your first story
          </Link>
        </div>
      )}
    </div>
  )
}