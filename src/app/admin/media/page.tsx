'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Search, Upload, Grid, List, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  id: string;
  file_path: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width: number;
  height: number;
  alt_text: string;
  caption: string | null;
  tags: string[];
  folder: string;
  versions: Record<string, string>;
  blurhash: string | null;
  created_at: string;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch media
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();
      setMedia(data.media);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching media:', error);
      alert('Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page, searchQuery]);

  // Handle URL copy
  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get thumbnail URL
  const getThumbnailUrl = (item: MediaItem) => {
    if (item.versions?.thumbnail) return item.versions.thumbnail;
    // Fallback to original with Supabase transform
    const url = new URL(item.file_path, process.env.NEXT_PUBLIC_SUPABASE_URL);
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/story-images/${item.file_path}?width=400&quality=80`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-black mb-2">Media Library</h1>
            <p className="text-lg text-gray-600">
              Browse, search, and manage your uploaded images
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by filename, alt text, or caption..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 border-2 border-black font-bold ${
                    viewMode === 'grid' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 border-2 border-black font-bold ${
                    viewMode === 'list' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Button */}
              <a
                href="/admin/blog/new"
                className="px-6 py-3 bg-green-100 border-2 border-black font-bold hover:bg-green-200 flex items-center gap-2 whitespace-nowrap"
              >
                <Upload className="w-5 h-5" />
                Upload New
              </a>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <div>
                <strong>{media.length}</strong> of <strong>{totalPages * 20}</strong> images shown
              </div>
              {selectedMedia.size > 0 && (
                <div className="flex items-center gap-2">
                  <span><strong>{selectedMedia.size}</strong> selected</span>
                  <button className="px-3 py-1 bg-red-100 border-2 border-red-600 text-red-900 font-bold hover:bg-red-200 text-xs flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading media...</p>
            </div>
          )}

          {/* Grid View */}
          {!loading && viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 border-b-2 border-black relative overflow-hidden">
                    <img
                      src={getThumbnailUrl(item)}
                      alt={item.alt_text}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {item.blurhash && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 -z-10" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-bold truncate mb-1">{item.original_name}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      {item.width} × {item.height} • {formatFileSize(item.file_size)}
                    </p>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-medium">
                            +{item.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyUrl(getThumbnailUrl(item), item.id)}
                        className="flex-1 px-3 py-2 bg-blue-100 border-2 border-black text-xs font-bold hover:bg-blue-200 flex items-center justify-center gap-1"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy URL
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {!loading && viewMode === 'list' && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead className="border-b-2 border-black">
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left text-sm font-bold">Preview</th>
                    <th className="p-4 text-left text-sm font-bold">Filename</th>
                    <th className="p-4 text-left text-sm font-bold">Dimensions</th>
                    <th className="p-4 text-left text-sm font-bold">Size</th>
                    <th className="p-4 text-left text-sm font-bold">Uploaded</th>
                    <th className="p-4 text-left text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {media.map((item) => (
                    <tr key={item.id} className="border-b-2 border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <img
                          src={getThumbnailUrl(item)}
                          alt={item.alt_text}
                          className="w-16 h-16 object-cover border-2 border-black"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-sm">{item.original_name}</p>
                        <p className="text-xs text-gray-600">{item.alt_text}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {item.width} × {item.height}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatFileSize(item.file_size)}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => copyUrl(getThumbnailUrl(item), item.id)}
                          className="px-3 py-1.5 bg-blue-100 border-2 border-black text-xs font-bold hover:bg-blue-200 flex items-center gap-1"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy URL
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && media.length === 0 && (
            <div className="text-center py-16 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">No images found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try a different search term or upload new images'
                  : 'Upload your first image to get started'}
              </p>
              <a
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 border-2 border-black font-bold hover:bg-green-200"
              >
                <Upload className="w-5 h-5" />
                Upload Images
              </a>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border-2 border-black font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
