'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

export default function StoryDetail({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setCurrentUser(userData)
        }
        
        // Get story
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*, youth_profiles(users(display_name, avatar_url))')
          .eq('id', params.id)
          .single()
        
        if (storyError) {
          setError('Story not found')
          return
        }
        
        setStory(storyData)
        
        // Get media
        const { data: mediaData } = await supabase
          .from('story_media')
          .select('*')
          .eq('story_id', params.id)
        
        if (mediaData) {
          // Get URLs for each media item
          const mediaWithUrls = await Promise.all(
            mediaData.map(async (item) => {
              if (item.external_url) {
                return { ...item, url: item.storage_path }
              }
              
              const { data } = await supabase
                .storage
                .from('story-media')
                .getPublicUrl(item.storage_path)
              
              return { ...item, url: data.publicUrl }
            })
          )
          
          setMedia(mediaWithUrls)
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An error occurred while loading the story')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [params.id])
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return
    }
    
    try {
      // Delete media files first
      for (const item of media) {
        if (!item.external_url) {
          await supabase
            .storage
            .from('story-media')
            .remove([item.storage_path])
        }
      }
      
      // Delete story
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', params.id)
      
      if (error) {
        throw error
      }
      
      router.push('/stories')
    } catch (err) {
      console.error('Error deleting story:', err)
      alert('Failed to delete story')
    }
  }
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading story...</p>
      </div>
    )
  }
  
  if (error || !story) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-600 mb-6">{error || 'Story not found'}</p>
        <button
          onClick={() => router.push('/stories')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Stories
        </button>
      </div>
    )
  }
  
  const isOwner = currentUser && 
    story.youth_profiles?.users?.id === currentUser.id
  
  const canEdit = isOwner && story.source === 'local'
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
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
            
            <h1 className="text-3xl font-bold">{story.title}</h1>
            
            <div className="flex items-center mt-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden mr-2">
                {story.youth_profiles?.users?.avatar_url ? (
                  <Image 
                    src={story.youth_profiles.users.avatar_url} 
                    alt="Author" 
                    width={32} 
                    height={32} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white">
                    {story.youth_profiles?.users?.display_name?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-700">
                By {story.youth_profiles?.users?.display_name || 'Anonymous'}
              </span>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/stories/${story.id}/edit`)}
                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        
        {media.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {media.map((item) => (
                <div key={item.id} className="rounded-lg overflow-hidden">
                  {item.media_type.startsWith('image/') ? (
                    <img 
                      src={item.url} 
                      alt="Story media" 
                      className="w-full h-64 object-cover"
                    />
                  ) : item.media_type.startsWith('video/') ? (
                    <video 
                      src={item.url} 
                      controls 
                      className="w-full h-64 object-cover"
                    />
                  ) : item.media_type.startsWith('audio/') ? (
                    <audio 
                      src={item.url} 
                      controls 
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">Unsupported media type</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="prose max-w-none">
          {story.content.split('\n').map((paragraph: string, index: number) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        {story.tags && story.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {story.tags.map((tag: string, index: number) => (
                <span 
                  key={index}
                  className="text-sm px-3 py-1 bg-gray-100 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push('/stories')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Stories
        </button>
        
        {story.source === 'local' && (
          <button
            onClick={() => router.push('/stories/create')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create New Story
          </button>
        )}
      </div>
    </div>
  )
}