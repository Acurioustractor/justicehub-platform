'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Save, Eye, ArrowLeft, Upload, X, Clock, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

// Dynamically import the editor to avoid SSR issues
const NovelEditor = dynamic(() => import('@/components/NovelEditor'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">Loading editor...</div>
});

// Content Templates
const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Document',
    content: '',
  },
  {
    id: 'story',
    name: 'Story Template',
    content: `<h1>Story Title Here</h1>

<h2>Background</h2>
<p>Provide context about the situation, community, or individual...</p>

<h2>What Happened</h2>
<p>Tell the story of what occurred, focusing on the human impact...</p>

<h2>Impact & Outcomes</h2>
<p>Describe the results, changes, or lessons learned...</p>

<h2>Call to Action</h2>
<p>What can readers do? How can they get involved or learn more?</p>`,
  },
  {
    id: 'case-study',
    name: 'Case Study',
    content: `<h1>[Organization Name]: [Key Achievement]</h1>

<h2>The Challenge</h2>
<p>Describe the problem or situation that needed addressing...</p>

<h2>The Approach</h2>
<p>Explain the strategy, methods, or innovations used...</p>

<h2>Results & Impact</h2>
<p>Share measurable outcomes and community impact...</p>

<h2>Lessons Learned</h2>
<p>What insights can others take away from this experience?</p>`,
  },
  {
    id: 'news',
    name: 'News Update',
    content: `<h1>Headline Goes Here</h1>

<p><strong>Lead paragraph summarizing the who, what, when, where, why...</strong></p>

<h2>Key Details</h2>
<p>Expand on the main points...</p>

<h2>Context & Background</h2>
<p>Provide relevant context for understanding this news...</p>

<h2>What's Next</h2>
<p>Future developments, upcoming events, or next steps...</p>`,
  },
];

export default function EnhancedBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    status: 'draft' as 'draft' | 'review' | 'published',
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // Calculate stats
  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = formData.content.replace(/<[^>]*>/g, '').length;
  const readingTime = Math.ceil(wordCount / 200);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
  };

  // Handle tag management
  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag],
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  // Handle image upload
  const handleImageUpload = async (file?: File) => {
    let selectedFile = file;

    if (!selectedFile) {
      // Trigger file input
      fileInputRef.current?.click();
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('folder', 'blog');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Insert image into editor
      const imageHtml = `<img src="${data.url}" alt="${data.altText}" />`;
      setFormData(prev => ({
        ...prev,
        content: prev.content + imageHtml,
      }));

      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Auto-save functionality
  const autoSave = async () => {
    if (!formData.title && !formData.content) return;

    setAutoSaving(true);
    try {
      // Save draft silently
      await handleSave('draft', true);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Set up auto-save timer
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 5000); // Auto-save every 5 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave('draft');
      }
      // Cmd/Ctrl + Shift + P to publish
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        handleSave('published');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, isFullscreen]);

  // Save post
  const handleSave = async (status: 'draft' | 'review' | 'published', silent = false) => {
    if (!silent) setSaving(true);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!silent) alert('You must be logged in to create a blog post');
        return;
      }

      // Get user's profile ID
      const { data: profile } = await supabase
        .from('public_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        if (!silent) alert('Profile not found');
        return;
      }

      const postData = {
        ...formData,
        status,
        author_id: profile.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
        reading_time_minutes: readingTime,
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      if (!silent) {
        alert(status === 'published' ? 'Blog post published!' : 'Draft saved!');
        router.push('/admin/blog');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      if (!silent) alert('Error saving blog post. Please try again.');
    } finally {
      if (!silent) setSaving(false);
    }
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        content: template.content,
      }));
      setShowTemplates(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog Posts
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-black mb-2">Write New Story</h1>
                <p className="text-lg text-gray-600">
                  Professional editor with auto-save and rich formatting
                </p>
              </div>

              {/* Stats */}
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div>
                    <strong>{wordCount}</strong> words
                  </div>
                  <div>
                    <strong>{charCount}</strong> characters
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <strong>{readingTime}</strong> min read
                  </div>
                </div>
                {lastSaved && (
                  <div className="text-xs text-gray-500 mt-1">
                    {autoSaving ? 'Saving...' : `Last saved ${lastSaved.toLocaleTimeString()}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - Left Side (3 columns) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Title */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black font-bold text-3xl focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter story title..."
                  required
                />
              </div>

              {/* Excerpt */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Excerpt (Brief Summary)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Brief summary for previews and search results..."
                />
              </div>

              {/* Rich Text Editor */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-black">
                    Content *
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      Use Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="text-sm font-bold text-black hover:text-blue-600 flex items-center gap-1 transition-colors"
                      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </button>
                  </div>
                </div>

                {/* Template Selector */}
                {showTemplates && (
                  <div className="mb-4 p-4 bg-gray-50 border-2 border-gray-300">
                    <p className="text-sm font-bold mb-2">Choose a template:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => applyTemplate(template.id)}
                          className="px-4 py-2 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 text-left"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden file input for image uploads */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <NovelEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onImageUpload={() => fileInputRef.current?.click()}
                  placeholder="Write your story here... Use the toolbar for formatting or drag & drop images!"
                />
              </div>
            </div>

            {/* Sidebar - Right Side (1 column) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Publish Actions */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-24">
                <h3 className="text-sm font-bold text-black mb-4">PUBLISH</h3>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave('published')}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                    {saving ? 'Publishing...' : 'Publish Now'}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300 text-xs">
                  <p className="font-bold text-blue-900 mb-1">⌨️ Keyboard Shortcuts:</p>
                  <ul className="text-blue-800 space-y-1">
                    <li>• Cmd/Ctrl + S = Save draft</li>
                    <li>• Cmd/Ctrl + Shift + P = Publish</li>
                    <li>• Cmd/Ctrl + B = Bold</li>
                    <li>• Cmd/Ctrl + I = Italic</li>
                  </ul>
                </div>
              </div>

              {/* URL Slug */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="url-slug"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  /blog/{formData.slug || 'url-slug'}
                </p>
              </div>

              {/* Featured Image */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Featured Image
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e: any) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setUploading(true);
                      try {
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        uploadFormData.append('folder', 'blog/featured');

                        const response = await fetch('/api/upload-image', {
                          method: 'POST',
                          body: uploadFormData,
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Upload failed');
                        }

                        const data = await response.json();
                        setFormData({ ...formData, featured_image_url: data.url });
                      } catch (error) {
                        console.error('Error uploading featured image:', error);
                        alert('Failed to upload image');
                      } finally {
                        setUploading(false);
                      }
                    };
                    input.click();
                  }}
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-green-100 border-2 border-black font-bold hover:bg-green-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                {formData.featured_image_url && (
                  <div className="mt-3">
                    <img
                      src={formData.featured_image_url}
                      alt="Featured"
                      className="w-full h-auto border-2 border-black"
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border-2 border-black text-sm font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Editor Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-black bg-gray-50">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 flex items-center gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </button>
              <div className="text-sm text-gray-600">
                {autoSaving && <span className="text-blue-600">Saving...</span>}
                {lastSaved && !autoSaving && (
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
              <span>{readingTime} min read</span>
            </div>
          </div>

          {/* Fullscreen Editor */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
              <NovelEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                onImageUpload={() => fileInputRef.current?.click()}
                placeholder="Start writing your story... Press Escape to exit fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
