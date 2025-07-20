'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [recentStories, setRecentStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return
      
      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setUser(userData)
      
      // Get recent stories
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      setRecentStories(storiesData || [])
      setLoading(false)
    }
    
    fetchData()
  }, [])
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Your Dashboard</h1>
        <p className="text-gray-600">
          Welcome to JusticeHub. This is your personal dashboard where you can manage your stories, 
          connections, and opportunities.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Stories</h2>
          
          {recentStories.length > 0 ? (
            <div className="space-y-4">
              {recentStories.map((story) => (
                <div key={story.id} className="border-b pb-4">
                  <h3 className="font-medium">{story.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(story.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              
              <Link 
                href="/stories" 
                className="block mt-4 text-primary-600 hover:text-primary-800"
              >
                View all stories
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No stories yet</p>
              <Link 
                href="/stories/create" 
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Create your first story
              </Link>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <Link 
              href="/stories/create" 
              className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              Create a new story
            </Link>
            
            {user?.role === 'youth' && (
              <>
                <Link 
                  href="/opportunities" 
                  className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Browse opportunities
                </Link>
                <Link 
                  href="/mentors" 
                  className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Find a mentor
                </Link>
              </>
            )}
            
            {user?.role === 'mentor' && (
              <Link 
                href="/mentorship" 
                className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md"
              >
                View mentorship requests
              </Link>
            )}
            
            {user?.role === 'org_admin' && (
              <>
                <Link 
                  href="/organization/members" 
                  className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Manage members
                </Link>
                <Link 
                  href="/organization/opportunities" 
                  className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  Post new opportunity
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}