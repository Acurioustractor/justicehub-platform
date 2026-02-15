'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Search, Grid, List, Copy, Check, Image as ImageIcon, Video, Play, X, ExternalLink, Building2, Star, MapPin } from 'lucide-react';
import Link from 'next/link';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  media_type: string;
  organization_id?: string;
  organization_name?: string;
  organization_slug?: string;
  is_featured: boolean;
  created_at: string;
  photographer?: string;
  platform?: string;
}

// Format media type for display
const formatMediaType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'card_thumbnail': 'Card',
    'hero_banner': 'Hero',
    'hero': 'Hero',
    'gallery': 'Gallery',
    'team': 'Team',
    'location': 'Location',
    'program': 'Program',
    'profile': 'Profile',
    'event': 'Event',
    'site': 'Site',
    'general': 'General',
    'documentary': 'Documentary',
    'interview': 'Interview',
    'promotional': 'Promotional',
    'training': 'Training',
    'music_video': 'Music Video',
  };
  return typeMap[type] || type;
};

// Format platform for display
const formatPlatform = (platform: string): string => {
  const platformMap: Record<string, string> = {
    'descript': 'Descript',
    'youtube': 'YouTube',
    'vimeo': 'Vimeo',
    'wistia': 'Wistia',
    'other': 'Other',
  };
  return platformMap[platform] || platform;
};

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'photos' | 'videos'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ photos: 0, videos: 0 });
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Fetch media
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        type: filterType,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();
      setMedia(data.media);
      setTotalPages(data.pagination.pages);
      setCounts(data.counts);
    } catch (error) {
      console.error('Error fetching media:', error);
      alert('Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page, searchQuery, filterType]);

  // Handle URL copy
  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle featured status
  const toggleFeatured = async (item: MediaItem) => {
    try {
      const table = item.type === 'photo' ? 'partner_photos' : 'partner_videos';
      const response = await fetch(`/api/media/${item.id}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table,
          is_featured: !item.is_featured
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Update local state
      setMedia(prev => prev.map(m =>
        m.id === item.id ? { ...m, is_featured: !m.is_featured } : m
      ));
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...selectedItem, is_featured: !selectedItem.is_featured });
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  // Get thumbnail URL for display
  const getThumbnailUrl = (item: MediaItem) => {
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.type === 'photo') return item.url;
    // For videos without thumbnail, use placeholder
    return '/images/video-placeholder.png';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="page-content pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-black mb-2">Media Library</h1>
            <p className="text-lg text-gray-600">
              Browse partner photos and videos across all organizations
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

              {/* Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-3 border-2 border-black font-bold text-sm ${
                    filterType === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('photos')}
                  className={`px-4 py-3 border-2 border-black font-bold text-sm flex items-center gap-1 ${
                    filterType === 'photos' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Photos
                </button>
                <button
                  onClick={() => setFilterType('videos')}
                  className={`px-4 py-3 border-2 border-black font-bold text-sm flex items-center gap-1 ${
                    filterType === 'videos' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Videos
                </button>
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

              {/* Organizations Link */}
              <a
                href="/admin/organizations"
                className="px-6 py-3 bg-cyan-100 border-2 border-black font-bold hover:bg-cyan-200 flex items-center gap-2 whitespace-nowrap"
              >
                Manage Orgs
              </a>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span><strong>{counts.photos}</strong> photos</span>
                <span><strong>{counts.videos}</strong> videos</span>
                <span className="text-gray-400">|</span>
                <span>Showing <strong>{media.length}</strong> items</span>
              </div>
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
                  onClick={() => setSelectedItem(item)}
                  className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer"
                >
                  {/* Media Preview */}
                  <div className="aspect-square bg-gray-100 border-b-2 border-black relative overflow-hidden">
                    {item.type === 'photo' ? (
                      <img
                        src={getThumbnailUrl(item)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 relative">
                        {item.thumbnail_url ? (
                          <>
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-7 h-7 text-black ml-1" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Type Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold ${
                      item.type === 'photo' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                    } border border-black`}>
                      {item.type === 'photo' ? 'Photo' : formatPlatform(item.platform || 'video')}
                    </div>
                    {item.is_featured && (
                      <div className="absolute top-2 right-2 px-2 py-1 text-xs font-bold bg-yellow-300 text-black border border-black">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-bold truncate mb-1">{item.title}</p>
                    {item.organization_name && (
                      <p className="text-xs text-gray-600 mb-1 truncate">{item.organization_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {formatMediaType(item.media_type)} • {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyUrl(item.url, item.id)}
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
                    <th className="p-4 text-left text-sm font-bold">Title</th>
                    <th className="p-4 text-left text-sm font-bold">Type</th>
                    <th className="p-4 text-left text-sm font-bold">Organization</th>
                    <th className="p-4 text-left text-sm font-bold">Added</th>
                    <th className="p-4 text-left text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {media.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedItem(item)} className="border-b-2 border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <td className="p-4">
                        <div className="w-16 h-16 relative border-2 border-black overflow-hidden">
                          {item.type === 'photo' ? (
                            <img
                              src={getThumbnailUrl(item)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-sm">{item.title}</p>
                        <p className="text-xs text-gray-600 truncate max-w-xs">{item.description || '—'}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold ${
                          item.type === 'photo' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        } border border-black`}>
                          {item.type === 'photo' ? formatMediaType(item.media_type) : formatPlatform(item.platform || 'video')}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {item.organization_name || '—'}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => copyUrl(item.url, item.id)}
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
              <h3 className="text-xl font-bold text-black mb-2">No media found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Partner photos and videos will appear here'}
              </p>
              <a
                href="/admin/organizations"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-100 border-2 border-black font-bold hover:bg-cyan-200"
              >
                Manage Organizations
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

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div
            className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-black">
              <h2 className="text-xl font-black">{selectedItem.title}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 border-2 border-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Media Preview */}
              <div className="mb-6">
                {selectedItem.type === 'photo' ? (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    className="w-full max-h-96 object-contain border-2 border-black"
                  />
                ) : (
                  <div className="aspect-video bg-gray-900 flex items-center justify-center border-2 border-black">
                    {selectedItem.thumbnail_url ? (
                      <img
                        src={selectedItem.thumbnail_url}
                        alt={selectedItem.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Video className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                  <p className="text-sm font-bold">
                    {selectedItem.type === 'photo' ? 'Photo' : 'Video'}
                    {' • '}
                    {selectedItem.type === 'photo'
                      ? formatMediaType(selectedItem.media_type)
                      : formatPlatform(selectedItem.platform || 'video')
                    }
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Added</label>
                  <p className="text-sm font-bold">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                </div>
                {selectedItem.organization_name && (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Organization</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-bold">{selectedItem.organization_name}</span>
                    </div>
                  </div>
                )}
                {selectedItem.photographer && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Photographer</label>
                    <p className="text-sm font-bold">{selectedItem.photographer}</p>
                  </div>
                )}
                {selectedItem.is_featured && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                    <span className="inline-block px-2 py-1 text-xs font-bold bg-yellow-300 text-black border border-black">
                      Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedItem.description && (
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <p className="text-sm text-gray-700 mt-1">{selectedItem.description}</p>
                </div>
              )}

              {/* Where Used */}
              {selectedItem.organization_slug && (
                <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Where This Media Is Used</label>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/organizations/${selectedItem.organization_slug}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-sm hover:bg-gray-100"
                    >
                      <MapPin className="w-3 h-3" />
                      {selectedItem.organization_name} (Public Page)
                    </Link>
                    <Link
                      href={`/admin/organizations/${selectedItem.organization_slug}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-sm hover:bg-gray-100"
                    >
                      <Building2 className="w-3 h-3" />
                      {selectedItem.organization_name} (Admin)
                    </Link>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => toggleFeatured(selectedItem)}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-bold ${
                    selectedItem.is_featured
                      ? 'bg-yellow-300 hover:bg-yellow-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`w-4 h-4 ${selectedItem.is_featured ? 'fill-current' : ''}`} />
                  {selectedItem.is_featured ? 'Featured' : 'Set Featured'}
                </button>
                <button
                  onClick={() => copyUrl(selectedItem.url, selectedItem.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 border-2 border-black font-bold hover:bg-blue-200"
                >
                  {copiedId === selectedItem.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </>
                  )}
                </button>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-black font-bold hover:bg-gray-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
