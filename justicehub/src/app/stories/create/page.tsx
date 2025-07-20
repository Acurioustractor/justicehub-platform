'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export default function CreateStory() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [storyType, setStoryType] = useState('personal')
  const [visibility, setVisibility] = useState('organization')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setFiles(fileArray)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('You must be logged in to create a story')
        return
      }
      
      // Get user's youth profile
      const { data: youthProfile } = await supabase
        .from('youth_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
      
      if (!youthProfile) {
        setError('Youth profile not found')
        return
      }
      
      // Create story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title,
          content,
          youth_profile_id: youthProfile.id,
          story_type: storyType,
          visibility,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          source: 'local'
        })
        .select()
        .single()
      
      if (storyError) {
        setError(storyError.message)
        return
      }
      
      // Upload media files
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${story.id}/${fileName}`
        
        const { error: uploadError } = await supabase
          .storage
          .from('story-media')
          .upload(filePath, file)
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError.message)
          continue
        }
        
        // Create media record
        await supabase
          .from('story_media')
          .insert({
            story_id: story.id,
            storage_path: filePath,
            media_type: file.type
          })
      }
      
      // Redirect to the story page
      router.push(`/stories/${story.id}`)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Create a New Story</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="storyType" className="block text-sm font-medium text-gray-700 mb-1">
              Story Type
            </label>
            <select
              id="storyType"
              value={storyType}
              onChange={(e) => setStoryType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="personal">Personal Experience</option>
              <option value="journey">Journey</option>
              <option value="achievement">Achievement</option>
              <option value="challenge">Challenge</option>
              <option value="reflection">Reflection</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="private">Private (Only Me)</option>
              <option value="organization">Organization (My Organization)</option>
              <option value="mentors">Mentors (My Mentors)</option>
              <option value="public">Public (Everyone)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. journey, education, growth"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="media" className="block text-sm font-medium text-gray-700 mb-1">
            Media Files (optional)
          </label>
          <input
            id="media"
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            You can upload images, videos, or audio files to enhance your story.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Story'}
          </button>
        </div>
      </form>
    </div>
  )
}