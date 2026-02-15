'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Save, Eye, ArrowLeft, Upload, X, Clock, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

const NovelEditor = dynamic(() => import('@/components/NovelEditor'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">Loading editor...</div>
});

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sourceTable, setSourceTable] = useState<'articles' | 'blog_posts' | null>(null);

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
  const editorRef = useRef<any>(null);

  // Load story data
  useEffect(() => {
    async function loadStory() {
      const supabase = createClient();

      // Try articles first
      const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('id', storyId)
        .single();

      if (article) {
        setSourceTable('articles');
        setFormData({
          title: article.title || '',
          slug: article.slug || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          featured_image_url: article.featured_image_url || '',
          featured_image_caption: article.featured_image_caption || '',
          status: article.status || 'draft',
          tags: article.tags || [],
          categories: article.categories || [],
          category: article.category || '',
          seo_title: article.seo_title || '',
          seo_description: article.seo_description || '',
        });
        setLoading(false);
        return;
      }

      // Try blog_posts if not found in articles
      const { data: blog } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', storyId)
        .single();

      if (blog) {
        setSourceTable('blog_posts');
        setFormData({
          title: blog.title || '',
          slug: blog.slug || '',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          featured_image_url: blog.featured_image_url || '',
          featured_image_caption: blog.featured_image_caption || '',
          status: blog.status || 'draft',
          tags: blog.tags || [],
          categories: [],
          category: '',
          seo_title: blog.seo_title || '',
          seo_description: blog.seo_description || '',
        });
        setLoading(false);
        return;
      }

      // Story not found
      alert('Story not found');
      router.push('/admin/stories');
    }

    loadStory();
  }, [storyId, router]);

  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = formData.content.replace(/<[^>]*>/g, '').length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
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

  const handleImageUpload = async (file?: File) => {
    let selectedFile = file;
    if (!selectedFile) {
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
      uploadFormData.append('folder', 'stories');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      if (editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: data.url, alt: data.altText }).run();
      } else {
        const imageHtml = `<img src="${data.url}" alt="${data.altText}" />`;
        setFormData(prev => ({ ...prev, content: prev.content + imageHtml }));
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    console.log('💾 Starting save...', { status, formData, storyId, sourceTable });
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in');
        return;
      }

      const { data: profile } = await supabase
        .from('public_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        alert('Profile not found');
        return;
      }

      // Validate required fields
      if (!formData.title || !formData.slug) {
        alert('Title and slug are required');
        return;
      }

      if (!formData.category) {
        alert('Please select a primary category (Seeds, Growth, Harvest, or Roots)');
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
        category: formData.category,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
      };

      console.log('💾 Article data to save:', articleData);

      // If source was blog_posts, delete from there and create new in articles
      if (sourceTable === 'blog_posts') {
        console.log('💾 Migrating from blog_posts to articles...');
        // Create in articles table
        const { error: insertError } = await supabase
          .from('articles')
          .insert([articleData]);

        if (insertError) {
          console.error('💾 Insert error:', insertError);
          throw insertError;
        }

        // Delete from blog_posts
        const { error: deleteError } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', storyId);

        if (deleteError) console.warn('Could not delete from blog_posts:', deleteError);

        alert('Story migrated to unified system and saved!');
        router.push('/admin/stories');
      } else {
        console.log('💾 Updating existing article...');
        // Update existing article
        const { data, error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', storyId)
          .select();

        console.log('💾 Update result:', { data, error, rowCount: data?.length });

        if (error) {
          console.error('💾 Update error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }

        // Check if any rows were actually updated
        if (!data || data.length === 0) {
          console.error('💾 No rows updated - possible RLS policy issue');
          throw new Error(
            'Failed to update article. You may not have permission to edit this article. ' +
            'Please ensure you are the original author or contact an administrator.'
          );
        }

        console.log('💾 Update successful!', data[0]);
        alert(status === 'published' ? 'Story published!' : 'Draft saved!');
        router.push('/admin/stories');
      }
    } catch (error: any) {
      console.error('❌ Error saving story:', error);
      let errorMsg = error.message || 'Unknown error occurred';

      if (error.code === '23505') {
        errorMsg = 'A story with this slug already exists. Please try changing the URL slug.';
      } else if (error.code === '23514') {
        errorMsg = 'Invalid category. Please select one of: Seeds, Growth, Harvest, or Roots.';
      } else if (error.code === '42501') {
        errorMsg = 'Permission denied. Please ensure you are logged in as an admin.';
      }

      alert(`Error saving story: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${formData.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const tableName = sourceTable || 'articles';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      alert('Story deleted successfully!');
      router.push('/admin/stories');
    } catch (error: any) {
      console.error('Error deleting story:', error);
      alert(`Failed to delete story: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 page-content">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-6xl mx-auto px-4">
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
                <h1 className="text-4xl font-black text-black mb-2">Edit Story</h1>
                {sourceTable === 'blog_posts' && (
                  <p className="text-sm text-orange-600 font-bold">
                    ⚠️ This will be migrated from blog_posts to articles when you save
                  </p>
                )}
              </div>

              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div><strong>{wordCount}</strong> words</div>
                  <div><strong>{charCount}</strong> characters</div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <strong>{readingTime}</strong> min read
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black font-bold text-3xl focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter story title..."
                  required
                />
              </div>

              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Brief summary..."
                />
              </div>

              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-4">Content *</label>
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
                  onInsertImage={(editor) => {
                    editorRef.current = editor;
                    fileInputRef.current?.click();
                  }}
                  placeholder="Write your story here..."
                />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-24">
                <h3 className="text-sm font-bold text-black mb-4">ACTIONS</h3>
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
                    {saving ? 'Publishing...' : 'Publish'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full px-4 py-3 bg-red-600 text-white border-2 border-red-600 font-bold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : 'Delete Story'}
                  </button>
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">URL Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="url-slug"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">/stories/{formData.slug || 'url-slug'}</p>
              </div>

              {/* Featured Image */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Cover Image
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
                  {uploading ? 'Uploading...' : 'Upload Cover Image'}
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
                      placeholder="Caption for the cover image..."
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, featured_image_url: '', featured_image_caption: '' })}
                      className="mt-2 text-sm text-red-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remove cover image
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">Tags</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
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
    </div>
  );
}
