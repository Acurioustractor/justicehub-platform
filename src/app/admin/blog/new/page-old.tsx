'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Save, Eye, ArrowLeft, Image as ImageIcon, Link2, Tag, Video, FileText, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    featured_image_caption: '',
    status: 'draft' as 'draft' | 'review' | 'published',
    tags: [] as string[],
    categories: [] as string[],
    meta_title: '',
    meta_description: '',
  });
  const [currentTag, setCurrentTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = formData.content;
    const newContent = content.substring(0, start) + text + content.substring(end);

    setFormData({ ...formData, content: newContent });

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'blog');

      // Upload via API route
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Insert markdown image at cursor
      const imageMarkdown = `\n![${data.altText}](${data.url})\n`;
      insertAtCursor(imageMarkdown);

      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle slash commands
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;

    // Check for slash command at cursor
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex >= 0) {
      const commandText = textBeforeCursor.substring(lastSlashIndex + 1);
      const isStartOfLine = lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === '\n';

      if (isStartOfLine && commandText.length > 0 && commandText.indexOf(' ') === -1) {
        // Check for image command
        if ('image'.startsWith(commandText.toLowerCase()) && commandText.length >= 2) {
          if (e.nativeEvent instanceof InputEvent && e.nativeEvent.data === ' ') {
            e.preventDefault();
            const beforeSlash = newContent.substring(0, lastSlashIndex);
            const afterCommand = newContent.substring(cursorPos);
            const imageTemplate = '![Alt text](paste-image-url-here)';
            setFormData({ ...formData, content: beforeSlash + imageTemplate + afterCommand });
            setTimeout(() => {
              textarea.focus();
              const newPos = beforeSlash.length + 2; // Position at "Alt text"
              textarea.setSelectionRange(newPos, newPos + 8); // Select "Alt text"
            }, 0);
            return;
          }
        }

        // Check for video command
        if ('video'.startsWith(commandText.toLowerCase()) && commandText.length >= 2) {
          if (e.nativeEvent instanceof InputEvent && e.nativeEvent.data === ' ') {
            e.preventDefault();
            const beforeSlash = newContent.substring(0, lastSlashIndex);
            const afterCommand = newContent.substring(cursorPos);
            const videoTemplate = '\n\n**Video:** Paste YouTube or Vimeo link here\n\n';
            setFormData({ ...formData, content: beforeSlash + videoTemplate + afterCommand });
            setTimeout(() => {
              textarea.focus();
              const newPos = beforeSlash.length + videoTemplate.length - 2;
              textarea.setSelectionRange(newPos, newPos);
            }, 0);
            return;
          }
        }
      }
    }

    // Auto-convert video URLs to embeds
    const youtubeRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    const vimeoRegex = /https?:\/\/(www\.)?vimeo\.com\/(\d+)/g;

    let convertedContent = newContent;

    // Convert YouTube links
    convertedContent = convertedContent.replace(youtubeRegex, (match, _, __, videoId) => {
      return `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>\n\n`;
    });

    // Convert Vimeo links
    convertedContent = convertedContent.replace(vimeoRegex, (match, _, videoId) => {
      return `\n\n<iframe src="https://player.vimeo.com/video/${videoId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>\n\n`;
    });

    setFormData({ ...formData, content: convertedContent });
  };

  const handleSave = async (status: 'draft' | 'review' | 'published') => {
    setSaving(true);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create a blog post');
        return;
      }

      // Get user's profile ID
      const { data: profile } = await supabase
        .from('public_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        alert('Profile not found');
        return;
      }

      const postData = {
        ...formData,
        status,
        author_id: profile.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      alert(status === 'published' ? 'Blog post published!' : 'Draft saved!');
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving blog post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog Posts
            </Link>
            <h1 className="text-4xl font-black text-black mb-2">Write New Story</h1>
            <p className="text-lg text-gray-600">
              Share stories from the movement - use /image or /video for quick media inserts
            </p>
          </div>

          {/* Main Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter story title..."
                  required
                />
              </div>

              {/* Slug */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">justicehub.au/blog/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 px-4 py-2 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="url-slug"
                    required
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Brief summary for previews..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  This appears in blog listings and search results
                </p>
              </div>

              {/* Main Content - Enhanced Markdown Editor */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-black">
                    Content * (Markdown + slash commands)
                  </label>
                  <a
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Markdown Guide
                  </a>
                </div>

                {/* Quick Insert Toolbar */}
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 border-2 border-gray-300">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 bg-green-100 border-2 border-black text-sm font-bold hover:bg-green-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? `Uploading ${uploadProgress}%` : 'Upload Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('\n\n**Video:** Paste YouTube or Vimeo link here\n\n')}
                    className="px-3 py-1.5 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Add Video
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('**bold text**')}
                    className="px-3 py-1.5 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('*italic text*')}
                    className="px-3 py-1.5 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 italic"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('[Link text](url)')}
                    className="px-3 py-1.5 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Link
                  </button>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="relative"
                >
                  <textarea
                    ref={contentTextareaRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    rows={20}
                    placeholder="# Write your story here...

Drag and drop images anywhere in this editor!

Or click 'Upload Image' button above to select from your computer.

Type / at the start of a line for quick commands:
  /image - Insert image
  /video - Insert video placeholder

Or paste YouTube/Vimeo links and they'll auto-convert to embeds!

## Use markdown formatting

- **Bold text**
- *Italic text*
- [Links](https://example.com)

### Code blocks
```
Code goes here
```

> Blockquotes for emphasis"
                    required
                  />
                </div>
                <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-600">
                  <p className="text-xs font-bold text-blue-900 mb-2">✨ Magic Features:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Drag & drop images</strong> directly into the editor!</li>
                    <li>• Click <code className="bg-blue-100 px-1">Upload Image</code> to browse your computer</li>
                    <li>• Type <code className="bg-blue-100 px-1">/image</code> then space to insert image template</li>
                    <li>• Type <code className="bg-blue-100 px-1">/video</code> then space for video</li>
                    <li>• Paste YouTube/Vimeo links - they auto-convert to embeds!</li>
                    <li>• Use toolbar buttons for quick formatting</li>
                  </ul>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Featured Image
                </label>

                {/* Featured Image Upload Button */}
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
                  className="w-full px-4 py-3 bg-green-100 border-2 border-black font-bold hover:bg-green-200 mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Featured Image'}
                </button>

                <div className="text-center text-xs text-gray-500 mb-3">or paste URL below</div>

                <input
                  type="url"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black mb-3"
                  placeholder="https://..."
                />
                {formData.featured_image_url && (
                  <div className="mb-3">
                    <img
                      src={formData.featured_image_url}
                      alt="Featured preview"
                      className="w-full h-48 object-cover border-2 border-black"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={formData.featured_image_caption}
                  onChange={(e) => setFormData({ ...formData, featured_image_caption: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Image caption..."
                />
              </div>
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              {/* Publish Actions */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-24">
                <h3 className="font-bold text-black mb-4">Publish</h3>

                <div className="space-y-3">
                  <button
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-gray-100 text-black border-2 border-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Draft
                  </button>

                  <button
                    onClick={() => handleSave('review')}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-yellow-100 text-black border-2 border-black font-bold hover:bg-yellow-200 transition-colors disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 inline mr-2" />
                    Submit for Review
                  </button>

                  <button
                    onClick={() => handleSave('published')}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Publish Now
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <label className="block text-sm font-bold text-black mb-3">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Tags
                </label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 py-2 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Add tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-gray-800"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 border-2 border-black text-sm font-bold flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <p className="font-bold mb-1">Quick add:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Youth Story', 'Editorial', 'Update', 'Research', 'YouthJustice', 'SystemsChange'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!formData.tags.includes(tag)) {
                            setFormData({ ...formData, tags: [...formData.tags, tag] });
                          }
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="font-bold text-black mb-3">SEO</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-black font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder={formData.title || 'Page title for search engines'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_title.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-black font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      rows={3}
                      placeholder={formData.excerpt || 'Description for search results'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_description.length}/160 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
