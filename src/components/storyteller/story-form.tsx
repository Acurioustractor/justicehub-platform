/**
 * Story Creation Form
 * 
 * Allows storytellers to create and edit their stories in the Empathy Ledger.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Save, Eye, EyeOff, FileText, Tag, Image, Globe, Users, Lock } from 'lucide-react';

interface StoryFormProps {
  storytellerId: string;
  projectId: string;
  organizationId: string;
  initialStory?: any;
  onSuccess?: (story: any) => void;
  onError?: (error: string) => void;
}

const STORY_TYPES = [
  { value: 'personal', label: 'Personal Experience', description: 'Share a personal story or experience' },
  { value: 'journey', label: 'Journey', description: 'Tell about your journey or transformation' },
  { value: 'challenge', label: 'Challenge', description: 'Describe a challenge you faced' },
  { value: 'success', label: 'Success', description: 'Share a success or achievement' },
  { value: 'reflection', label: 'Reflection', description: 'Reflect on experiences or lessons learned' },
  { value: 'community', label: 'Community Impact', description: 'Share how community programs helped you' }
];

const VISIBILITY_OPTIONS = [
  { 
    value: 'public', 
    label: 'Public', 
    description: 'Anyone can see this story',
    icon: Globe
  },
  { 
    value: 'organization', 
    label: 'Organization Only', 
    description: 'Only people in your organization can see this',
    icon: Users
  },
  { 
    value: 'private', 
    label: 'Private', 
    description: 'Only you can see this story',
    icon: Lock
  }
];

export function StoryForm({ 
  storytellerId, 
  projectId, 
  organizationId, 
  initialStory, 
  onSuccess, 
  onError 
}: StoryFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contentHtml: '',
    storyType: 'personal',
    visibility: 'public',
    tags: [] as string[],
    mediaUrls: [] as string[],
    featuredImageUrl: '',
    consentVerified: false
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (initialStory) {
      setFormData({
        title: initialStory.title || '',
        content: initialStory.content || '',
        contentHtml: initialStory.content_html || '',
        storyType: initialStory.story_type || 'personal',
        visibility: initialStory.visibility || 'public',
        tags: initialStory.tags || [],
        mediaUrls: initialStory.media_urls || [],
        featuredImageUrl: initialStory.featured_image_url || '',
        consentVerified: initialStory.consent_verified || false
      });
    }
  }, [initialStory]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAutoSave = async (content: string) => {
    if (!content.trim() || !formData.title.trim()) return;

    try {
      // Only auto-save if we have an existing story (editing mode)
      if (initialStory) {
        const response = await fetch(`/api/stories/${initialStory.id}/draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            contentHtml: formData.contentHtml,
            title: formData.title,
          }),
        });

        if (!response.ok) {
          console.warn('Auto-save failed');
        }
      }
    } catch (error) {
      console.warn('Auto-save error:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Story content is required');
      return false;
    }
    if (!formData.consentVerified) {
      setError('Please confirm consent to share your story');
      return false;
    }
    return true;
  };

  const handleSave = async (publish: boolean = false) => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const url = initialStory ? `/api/stories/${initialStory.id}` : '/api/stories';
      const method = initialStory ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        content: formData.content,
        contentHtml: formData.contentHtml,
        storytellerId,
        projectId,
        organizationId,
        storyType: formData.storyType,
        visibility: formData.visibility,
        tags: formData.tags,
        mediaUrls: formData.mediaUrls,
        featuredImageUrl: formData.featuredImageUrl,
        consentVerified: formData.consentVerified,
        status: publish ? 'published' : 'draft'
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save story');
      }

      // If publishing a draft, make additional publish call
      if (publish && !initialStory) {
        const publishResponse = await fetch(`/api/stories/${data.story.id}/publish`, {
          method: 'POST'
        });

        if (!publishResponse.ok) {
          const publishData = await publishResponse.json();
          throw new Error(publishData.error || 'Failed to publish story');
        }
      }

      if (onSuccess) {
        onSuccess(data.story);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save story';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedStoryType = STORY_TYPES.find(type => type.value === formData.storyType);
  const selectedVisibility = VISIBILITY_OPTIONS.find(opt => opt.value === formData.visibility);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {initialStory ? 'Edit Your Story' : 'Share Your Story'}
          </CardTitle>
          <p className="text-gray-600">
            Your story matters. Share your experience to help others and create positive change.
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Story Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Give your story a compelling title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Story *
                </label>
                <RichTextEditor
                  initialContent={formData.content}
                  onContentChange={(text, html) => {
                    handleInputChange('content', text);
                    handleInputChange('contentHtml', html);
                  }}
                  onAutoSave={handleAutoSave}
                  placeholder="Share your story here. Be authentic and speak from your heart. Your experience can inspire and help others..."
                  maxCharacters={10000}
                  className="min-h-[300px]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add tags (e.g., journey, community, growth)"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    className="rounded-l-none"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Consent */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Consent Confirmation</h4>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.consentVerified}
                    onChange={(e) => handleInputChange('consentVerified', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm">
                    I confirm that I have the right to share this story and consent to it being published 
                    on the Empathy Ledger platform according to the visibility settings I've chosen.
                  </span>
                </label>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Story Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Story Type
                </label>
                <select
                  value={formData.storyType}
                  onChange={(e) => handleInputChange('storyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {STORY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {selectedStoryType && (
                  <p className="text-sm text-gray-600 mt-1">{selectedStoryType.description}</p>
                )}
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can see this story?
                </label>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={formData.visibility === option.value}
                          onChange={(e) => handleInputChange('visibility', e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-1" />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Preview Toggle */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreview(!preview)}
                  className="w-full"
                >
                  {preview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Draft'}
                </Button>
                
                <Button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={loading || !formData.consentVerified}
                  className="w-full"
                >
                  {loading ? 'Publishing...' : 'Publish Story'}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Story Preview</h3>
              <Card variant="story">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                        {selectedStoryType?.label}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full flex items-center">
                        {selectedVisibility && <selectedVisibility.icon className="h-3 w-3 mr-1" />}
                        {selectedVisibility?.label}
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-3">{formData.title || 'Your Story Title'}</h2>
                  
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formData.contentHtml || formData.content.split('\n').map(p => `<p>${p || '&nbsp;'}</p>`).join('') 
                    }}
                  />
                  
                  {formData.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}