'use client';

// 🚀 STORIES EDITOR - Version 2025-11-05-NOCACHE
console.log('🚀🚀🚀 STORIES EDITOR LOADED - AUTO-SAVE DISABLED - Version 2025-11-05-NOCACHE 🚀🚀🚀');

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

export default function UnifiedStoriesEditor() {
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
    featured_image_caption: '',
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[],
    categories: [] as string[],
    category: '',
    seo_title: '',
    seo_description: '',
  });
  const [currentTag, setCurrentTag] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const editorRef = useRef<any>(null);

  // Calculate stats
  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = formData.content.replace(/<[^>]*>/g, '').length;
  const readingTime = Math.ceil(wordCount / 200);

  // Check if coming from transcript flow and load extracted data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'transcript') {
      const storedData = localStorage.getItem('extracted_story_data');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);

          // Organize content with storyteller background and quotes by theme
          let content = `<h2>Story Background</h2>
<p><strong>Storyteller:</strong> ${data.storytellerName}</p>

<h2>Key Quotes</h2>`;

          // Group quotes by theme
          const quotesByTheme: Record<string, any[]> = {};
          data.quotes?.forEach((quote: any) => {
            if (!quotesByTheme[quote.theme]) {
              quotesByTheme[quote.theme] = [];
            }
            quotesByTheme[quote.theme].push(quote);
          });

          // Add quotes organized by theme
          Object.entries(quotesByTheme).forEach(([theme, quotes]) => {
            content += `\n<h3>${theme}</h3>\n`;
            // Add top 5 quotes for each theme
            quotes.slice(0, 5).forEach((quote: any) => {
              content += `<blockquote>"${quote.text}"</blockquote>\n`;
            });
          });

          // Pre-fill the form
          setFormData(prev => ({
            ...prev,
            title: `${data.storytellerName}'s Story`,
            content: content,
          }));

          // Clean up localStorage
          localStorage.removeItem('extracted_story_data');
        } catch (error) {
          console.error('Failed to load transcript data:', error);
        }
      }
    }
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const uniqueSlug = baseSlug ? `${baseSlug}-${timestamp}` : `story-${timestamp}`;

    setFormData({
      ...formData,
      title,
      slug: uniqueSlug,
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

  // Handle additional tags management (not the primary category)
  const handleAddCategory = () => {
    if (currentCategory && !formData.categories.includes(currentCategory)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, currentCategory],
      });
      setCurrentCategory('');
    }
  };

  // Remove additional tag (doesn't affect primary category)
  const handleRemoveCategory = (cat: string) => {
    const newCategories = formData.categories.filter(c => c !== cat);
    setFormData({
      ...formData,
      categories: newCategories,
    });
  };

  // Handle image upload
  const handleImageUpload = async (file?: File) => {
    console.log('📤 handleImageUpload called with file:', file);
    let selectedFile = file;

    if (!selectedFile) {
      console.log('📤 No file, opening file picker...');
      fileInputRef.current?.click();
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    console.log('📤 Starting upload for file:', selectedFile.name);
    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('folder', 'stories');

      console.log('📤 Sending fetch request to /api/upload-image...');
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });
      console.log('📤 Got response from server:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('📤 Server returned error:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('📤 Upload successful!', { url: data.url, editorRef: editorRef.current });

      // Insert image at cursor position using the editor
      if (editorRef.current) {
        console.log('🎯 Inserting image with editor.setImage()...');
        editorRef.current.chain().focus().setImage({ src: data.url, alt: data.altText }).run();
        console.log('✅ Image inserted at cursor position - you can now drag it to reposition');
      } else {
        console.error('❌ No editorRef - using fallback HTML append');
        // Fallback: append to content if editor ref not available
        const imageHtml = `<img src="${data.url}" alt="${data.altText}" />`;
        setFormData(prev => ({
          ...prev,
          content: prev.content + imageHtml,
        }));
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      console.error('❌ Error details:', { name: error.name, message: error.message, stack: error.stack });
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      console.log('📤 Upload process complete, setUploading(false)');
      setUploading(false);
    }
  };

  // DISABLED auto-save functionality - was causing duplicate slug errors
  // const autoSave = async () => {
  //   if (!formData.title && !formData.content) return;
  //   setAutoSaving(true);
  //   try {
  //     await handleSave('draft', true);
  //     setLastSaved(new Date());
  //   } catch (error) {
  //     console.error('Auto-save failed:', error);
  //   } finally {
  //     setAutoSaving(false);
  //   }
  // };

  // DISABLED auto-save timer
  // useEffect(() => {
  //   if (autoSaveTimerRef.current) {
  //     clearTimeout(autoSaveTimerRef.current);
  //   }
  //   autoSaveTimerRef.current = setTimeout(() => {
  //     autoSave();
  //   }, 5000);
  //   return () => {
  //     if (autoSaveTimerRef.current) {
  //       clearTimeout(autoSaveTimerRef.current);
  //     }
  //   };
  // }, [formData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave('draft');
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        handleSave('published');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, isFullscreen]);

  // Save story to articles table
  const handleSave = async (status: 'draft' | 'published', silent = false) => {
    if (!silent) setSaving(true);

    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!silent) alert('You must be logged in to create a story');
        return;
      }

      // Get user's profile ID
      const { data: profile } = await supabase
        .from('public_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        if (!silent) alert('Profile not found. Please contact an administrator.');
        return;
      }

      const articleData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image_url: formData.featured_image_url,
        featured_image_caption: formData.featured_image_caption,
        author_id: profile.id,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        reading_time_minutes: readingTime,
        tags: formData.tags.length > 0 ? formData.tags : null,
        categories: formData.categories.length > 0 ? formData.categories : null,
        category: formData.category || null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        view_count: 0,
        share_count: 0,
        is_trending: false,
        location_tags: null,
        metadata: {},
      };

      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        console.error('Article data being inserted:', articleData);
        throw error;
      }

      if (!silent) {
        alert(status === 'published' ? 'Story published!' : 'Draft saved!');
        router.push('/admin/stories');
      }
    } catch (error: any) {
      console.error('Error saving story:', error);
      if (!silent) {
        let errorMsg = 'Error saving story. Please try again.';

        if (error.code === '23505') {
          errorMsg = 'A story with this slug already exists. Please try changing the title.';
        } else if (error.code === '42501') {
          errorMsg = 'Permission denied. Please ensure you are logged in as an admin.';
        } else if (error.message) {
          errorMsg = error.message;
        }

        alert(errorMsg);
      }
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
              href="/admin/stories"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Stories
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
                    console.log('📁 File input onChange triggered!', { files: e.target.files });
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('📁 File selected:', file.name);
                      handleImageUpload(file);
                    }
                    e.target.value = '';
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <NovelEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onImageUpload={() => fileInputRef.current?.click()}
                  onInsertImage={(editor) => {
                    console.log('🖼️ Image button clicked!', { editor, fileInputRef: fileInputRef.current });
                    editorRef.current = editor;
                    if (fileInputRef.current) {
                      console.log('🎯 Triggering file input click...');
                      fileInputRef.current.click();
                      console.log('✅ File input click triggered');
                    } else {
                      console.error('❌ No file input ref!');
                    }
                  }}
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
                  /stories/{formData.slug || 'url-slug'}
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
                        uploadFormData.append('folder', 'stories/featured');

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
                    <label className="block text-sm font-bold text-black mt-3 mb-2">
                      Image Caption
                    </label>
                    <input
                      type="text"
                      value={formData.featured_image_caption}
                      onChange={(e) => setFormData({ ...formData, featured_image_caption: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Caption for the featured image..."
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

              {/* Primary Category */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Primary Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">-- Select a category --</option>
                  <option value="seeds">Seeds (New beginnings, initiatives)</option>
                  <option value="growth">Growth (Development, progress)</option>
                  <option value="harvest">Harvest (Success, outcomes)</option>
                  <option value="roots">Roots (Foundation, heritage)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Required for the articles section. Choose the category that best fits your story.
                </p>
              </div>

              {/* Additional Tags */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Additional Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentCategory}
                    onChange={(e) => setCurrentCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    className="flex-1 px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Add custom tag..."
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 border-2 border-black text-sm font-bold"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Optional custom tags for filtering and organization.
                </p>
              </div>

              {/* SEO Fields */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black mb-4"
                  placeholder="Custom title for search engines..."
                />

                <label className="block text-sm font-bold text-black mb-2">
                  SEO Description
                </label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Custom description for search results..."
                  rows={3}
                />
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
                onInsertImage={(editor) => {
                  editorRef.current = editor;
                  fileInputRef.current?.click();
                }}
                placeholder="Start writing your story... Press Escape to exit fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
