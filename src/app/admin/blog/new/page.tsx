'use client';

// 🚀 NEW CODE VERSION - 2025-11-05-NOCACHE
console.log('🚀🚀🚀 NEW CODE LOADED - AUTO-SAVE DISABLED - Version 2025-11-05-NOCACHE 🚀🚀🚀');

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Save, Eye, ArrowLeft, Upload, X, Clock, FileText, Maximize2, Minimize2, Users, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import RoleSelector, { RoleBadge } from '@/components/admin/RoleSelector';

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
  const [savedArticleId, setSavedArticleId] = useState<string | null>(null); // Track article ID after first save

  // Contributors state
  const [availableProfiles, setAvailableProfiles] = useState<{ id: string; full_name: string; photo_url: string | null }[]>([]);
  const [contributors, setContributors] = useState<{ profile_id: string; profile_name: string; role: string; role_description: string }[]>([]);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [selectedContributorId, setSelectedContributorId] = useState('');
  const [contributorRole, setContributorRole] = useState('');
  const [contributorRoleDesc, setContributorRoleDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const editorRef = useRef<any>(null);
  const placeholderIdRef = useRef<string | null>(null);

  // Calculate stats
  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = formData.content.replace(/<[^>]*>/g, '').length;
  const readingTime = Math.ceil(wordCount / 200);

  // Load available profiles for contributors
  useEffect(() => {
    async function loadProfiles() {
      const supabase = createClient();
      const { data } = await supabase
        .from('public_profiles')
        .select('id, full_name, photo_url')
        .order('full_name');
      if (data) setAvailableProfiles(data);
    }
    loadProfiles();
  }, []);

  // Add contributor handler
  const handleAddContributor = () => {
    if (!selectedContributorId || !contributorRole) return;
    const profile = availableProfiles.find(p => p.id === selectedContributorId);
    if (!profile) return;

    setContributors([...contributors, {
      profile_id: selectedContributorId,
      profile_name: profile.full_name,
      role: contributorRole,
      role_description: contributorRoleDesc,
    }]);
    setSelectedContributorId('');
    setContributorRole('');
    setContributorRoleDesc('');
    setShowContributorModal(false);
  };

  // Remove contributor handler
  const handleRemoveContributor = (profileId: string) => {
    setContributors(contributors.filter(c => c.profile_id !== profileId));
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits for brevity
    const uniqueSlug = baseSlug ? `${baseSlug}-${timestamp}` : `post-${timestamp}`;

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

      // Just insert the image - TipTap supports dragging images to reposition
      if (editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: data.url, alt: data.altText }).run();
        console.log('✅ Image inserted - you can now drag it to reposition');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // DELETED auto-save functionality - was causing duplicate slug errors
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

  // DISABLED auto-save - was causing duplicate slug errors
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

      let data, error;

      if (savedArticleId) {
        // Update existing article
        console.log('📝 Updating existing article:', savedArticleId);
        const result = await supabase
          .from('articles')
          .update(postData)
          .eq('id', savedArticleId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new article
        console.log('✨ Creating new article');
        const result = await supabase
          .from('articles')
          .insert([postData])
          .select()
          .single();
        data = result.data;
        error = result.error;

        // Store the article ID for future updates
        if (result.data) {
          setSavedArticleId(result.data.id);
          console.log('💾 Saved article ID:', result.data.id);
        }
      }

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        console.error('Post data being saved:', postData);
        throw error;
      }

      // Save contributors if we have an article ID
      const articleId = data?.id || savedArticleId;
      if (articleId && contributors.length > 0) {
        // First delete existing contributors
        await supabase.from('blog_posts_profiles').delete().eq('blog_post_id', articleId);

        // Then insert new ones
        const contributorInserts = contributors.map((c, index) => ({
          blog_post_id: articleId,
          public_profile_id: c.profile_id,
          role: c.role,
          role_description: c.role_description || null,
          is_featured: index === 0, // First contributor is featured
        }));

        const { error: contribError } = await supabase.from('blog_posts_profiles').insert(contributorInserts);
        if (contribError) console.error('Error saving contributors:', contribError);
      }

      if (!silent) {
        alert(status === 'published' ? 'Blog post published!' : 'Draft saved!');
        router.push('/admin/blog');
      }
    } catch (error: any) {
      console.error('Error saving post:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      if (!silent) {
        let errorMsg = 'Error saving blog post. Please try again.';

        // Provide specific error messages
        if (error.code === '23505') {
          errorMsg = 'A post with this slug already exists. Please try changing the title.';
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
                  onInsertImage={(editor) => {
                    // Store editor reference so we can insert image after upload
                    editorRef.current = editor;
                    // Trigger file input
                    fileInputRef.current?.click();
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

              {/* Contributors */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-black flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Contributors
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowContributorModal(true)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>

                {contributors.length > 0 ? (
                  <div className="space-y-2">
                    {contributors.map((contributor, index) => (
                      <div key={contributor.profile_id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                        <div className="flex-1">
                          <div className="font-bold text-sm">{contributor.profile_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <RoleBadge role={contributor.role} size="sm" />
                            {contributor.role_description && (
                              <span className="text-xs text-gray-500">— {contributor.role_description}</span>
                            )}
                          </div>
                          {index === 0 && (
                            <span className="text-xs text-green-600 font-bold">PRIMARY</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveContributor(contributor.profile_id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No contributors added yet. The logged-in user will be the author.
                  </p>
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
                onInsertImage={(editor) => {
                  // Store editor reference so we can insert image after upload
                  editorRef.current = editor;
                  // Trigger file input
                  fileInputRef.current?.click();
                }}
                placeholder="Start writing your story... Press Escape to exit fullscreen"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Contributor Modal */}
      {showContributorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full">
            <div className="p-4 border-b-2 border-black flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Contributor
              </h2>
              <button onClick={() => setShowContributorModal(false)} className="p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Person Selection */}
              <div>
                <label className="block text-sm font-bold mb-2">Select Person *</label>
                <select
                  value={selectedContributorId}
                  onChange={(e) => setSelectedContributorId(e.target.value)}
                  className="w-full p-3 border-2 border-black"
                >
                  <option value="">Choose a person...</option>
                  {availableProfiles
                    .filter(p => !contributors.find(c => c.profile_id === p.id))
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Role Selection */}
              <RoleSelector
                value={contributorRole}
                onChange={setContributorRole}
                label="Role"
                required
                allowCustom
                filterCategories={['content', 'testimonial']}
                helperText="e.g., Author, Subject, Interviewer, Mentioned"
              />

              {/* Role Description */}
              <div>
                <label className="block text-sm font-bold mb-2">Role Description (optional)</label>
                <input
                  type="text"
                  value={contributorRoleDesc}
                  onChange={(e) => setContributorRoleDesc(e.target.value)}
                  className="w-full p-3 border-2 border-black"
                  placeholder="e.g., Co-wrote the introduction"
                />
              </div>
            </div>

            <div className="p-4 border-t-2 border-black flex justify-end gap-4">
              <button
                onClick={() => setShowContributorModal(false)}
                className="px-6 py-2 border-2 border-black font-bold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContributor}
                disabled={!selectedContributorId || !contributorRole}
                className="px-6 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                Add Contributor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
