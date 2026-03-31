'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Loader2,
  X,
  Eye,
  Trash2,
  Check,
  AlertCircle,
  Link2,
  Play,
  Star,
  Database,
  Camera,
  Film,
  Edit3,
} from 'lucide-react';

interface UnifiedMediaItem {
  id: string;
  source: 'media_items' | 'partner_photos' | 'partner_videos';
  type: 'photo' | 'video';
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  photographer: string | null;
  platform: string | null;
  is_featured: boolean;
  consent_verified: boolean;
  community_approved: boolean;
  tags: string[] | null;
  created_at: string;
}

interface MediaCounts {
  media_items: number;
  partner_photos: number;
  partner_videos: number;
  total: number;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  media_items: { label: 'Hub', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  partner_photos: { label: 'Partner', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  partner_videos: { label: 'Partner', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  empathy_ledger: { label: 'EL', color: 'bg-amber-100 text-amber-800 border-amber-300' },
};

export function MediaTab({ orgId }: { orgId: string }) {
  const [media, setMedia] = useState<UnifiedMediaItem[]>([]);
  const [counts, setCounts] = useState<MediaCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [selected, setSelected] = useState<UnifiedMediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [uploadingToEL, setUploadingToEL] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media`);
      if (!res.ok) throw new Error('Failed to fetch media');
      const json = await res.json();
      setMedia(json.data || []);
      setCounts(json.counts || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('organization_id', orgId);

        const res = await fetch(`/api/org-hub/${orgId}/media`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to upload ${file.name}`);
        }
      }
      await fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return;
    setAddingVideo(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl.trim(), title: videoTitle.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add video');
      }
      setVideoUrl('');
      setVideoTitle('');
      setShowVideoInput(false);
      await fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDelete = async (item: UnifiedMediaItem) => {
    if (!confirm('Delete this media item?')) return;
    try {
      const res = await fetch(
        `/api/org-hub/${orgId}/media?id=${item.id}&source=${item.source}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Delete failed');
      setMedia(prev => prev.filter(m => m.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleToggleFeatured = async (item: UnifiedMediaItem) => {
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          source: item.source,
          is_featured: !item.is_featured,
          community_approved: item.source === 'media_items' ? !item.community_approved : undefined,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setMedia(prev =>
        prev.map(m =>
          m.id === item.id ? { ...m, is_featured: !m.is_featured, community_approved: item.source === 'media_items' ? !m.community_approved : m.community_approved } : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleSaveTitle = async (item: UnifiedMediaItem) => {
    if (!editTitle.trim() || editTitle === item.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, source: item.source, title: editTitle.trim() }),
      });
      if (!res.ok) throw new Error('Update failed');
      setMedia(prev => prev.map(m => m.id === item.id ? { ...m, title: editTitle.trim() } : m));
      if (selected) setSelected({ ...selected, title: editTitle.trim() });
      setEditingTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleUploadToEL = async (files: FileList) => {
    setUploadingToEL(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('organizationId', orgId);

        const res = await fetch('/api/empathy-ledger/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to upload ${file.name} to EL`);
        }
      }
      await fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'EL upload failed');
    } finally {
      setUploadingToEL(false);
    }
  };

  const filtered = media.filter(m => filter === 'all' || m.type === filter);
  const photoCount = media.filter(m => m.type === 'photo').length;
  const videoCount = media.filter(m => m.type === 'video').length;

  const getEmbedUrl = (item: UnifiedMediaItem) => {
    if (item.platform === 'youtube') {
      let videoId: string | undefined;
      if (item.url.includes('v=')) videoId = item.url.split('v=')[1]?.split('&')[0];
      else if (item.url.includes('youtu.be/')) videoId = item.url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (item.platform === 'vimeo') {
      const match = item.url.match(/vimeo\.com\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          <h2 className="text-xl font-black">Media Library</h2>
          <span className="text-sm text-gray-500 font-medium ml-2">
            {photoCount} photos, {videoCount} videos
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowVideoInput(!showVideoInput)}
            className="px-4 py-2 font-bold border-2 border-black bg-white text-black hover:bg-gray-100 inline-flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Paste Video URL
          </button>
          <label className="px-4 py-2 font-bold bg-black text-white hover:bg-gray-800 cursor-pointer inline-flex items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </label>
          <label className="px-4 py-2 font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer inline-flex items-center gap-2">
            {uploadingToEL ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pushing to EL...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload to EL
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={uploadingToEL}
              onChange={(e) => e.target.files && handleUploadToEL(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Video URL Input */}
      {showVideoInput && (
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4" />
            <span className="font-bold text-sm">Add Video from URL</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
              onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="sm:w-48 px-3 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
              onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
            />
            <button
              onClick={handleAddVideo}
              disabled={addingVideo || !videoUrl.trim()}
              className="px-4 py-2 font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap"
            >
              {addingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Add Video
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            YouTube and Vimeo URLs supported. Thumbnails are auto-generated for YouTube.
          </p>
        </div>
      )}

      {/* Source Breakdown */}
      {counts && counts.total > 0 && (
        <div className="flex gap-3 flex-wrap">
          {counts.media_items > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1.5">
              <Database className="w-3 h-3" /> Hub: {counts.media_items}
            </span>
          )}
          {counts.partner_photos > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Partner Photos: {counts.partner_photos}
            </span>
          )}
          {counts.partner_videos > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1.5">
              <Film className="w-3 h-3" /> Partner Videos: {counts.partner_videos}
            </span>
          )}
          {(counts as any).empathy_ledger > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" /> Empathy Ledger: {(counts as any).empathy_ledger}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-300 text-sm font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'photo', 'video'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-bold border-2 border-black transition-colors ${
              filter === f ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? `All (${media.length})` : f === 'photo' ? `Photos (${photoCount})` : `Videos (${videoCount})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-black mb-2">No media yet</h3>
          <p className="text-sm text-gray-600 font-medium mb-4">
            Upload photos, paste video URLs, or sync from Empathy Ledger.
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div
              key={`${item.source}-${item.id}`}
              className="group relative bg-white border-2 border-black overflow-hidden cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              onClick={() => setSelected(item)}
            >
              <div className="aspect-square relative">
                {item.type === 'video' ? (
                  item.thumbnail_url ? (
                    <div className="w-full h-full relative">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-black/70 rounded-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-2">
                      <Video className="w-8 h-8 text-white" />
                      {item.platform && (
                        <span className="text-[10px] text-white/60 font-bold uppercase">{item.platform}</span>
                      )}
                    </div>
                  )
                ) : (
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Badges */}
                <div className="absolute top-1 left-1 flex gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${SOURCE_LABELS[item.source]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {SOURCE_LABELS[item.source]?.label || item.source}
                  </span>
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  {item.is_featured && (
                    <span className="bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5">
                      <Star className="w-3 h-3 inline" />
                    </span>
                  )}
                  {!item.consent_verified && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">!</span>
                  )}
                </div>
              </div>

              <div className="p-2">
                <p className="text-xs font-bold truncate">{item.title}</p>
                {item.photographer && (
                  <p className="text-[10px] text-gray-500 truncate">{item.photographer}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setEditingTitle(false); }}>
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b-2 border-black">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border flex-shrink-0 ${SOURCE_LABELS[selected.source]?.color}`}>
                  {SOURCE_LABELS[selected.source]?.label}
                </span>
                {editingTitle ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle(selected);
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    onBlur={() => handleSaveTitle(selected)}
                    className="text-lg font-black flex-1 border-b-2 border-black focus:outline-none px-1"
                  />
                ) : (
                  <h3
                    className="text-lg font-black truncate flex-1 cursor-pointer hover:underline inline-flex items-center gap-1"
                    onClick={() => { setEditingTitle(true); setEditTitle(selected.title); }}
                  >
                    {selected.title}
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  </h3>
                )}
              </div>
              <button onClick={() => { setSelected(null); setEditingTitle(false); }} className="p-1 hover:bg-gray-100 ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              {selected.type === 'video' ? (
                (() => {
                  const embedUrl = getEmbedUrl(selected);
                  return embedUrl ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center gap-3">
                      <Video className="w-12 h-12 text-white/50" />
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/70 hover:text-white underline font-medium"
                      >
                        Open in new tab
                      </a>
                    </div>
                  );
                })()
              ) : (
                <img
                  src={selected.url}
                  alt={selected.title}
                  className="w-full max-h-[50vh] object-contain bg-gray-50"
                />
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-bold block text-gray-500">Type</span>
                  <span className="capitalize">{selected.type}</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-500">Source</span>
                  <span>{selected.source.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-500">Date</span>
                  <span>{selected.created_at?.split('T')[0]}</span>
                </div>
                {selected.platform && (
                  <div>
                    <span className="font-bold block text-gray-500">Platform</span>
                    <span className="capitalize">{selected.platform}</span>
                  </div>
                )}
                {selected.photographer && (
                  <div>
                    <span className="font-bold block text-gray-500">Photographer</span>
                    <span>{selected.photographer}</span>
                  </div>
                )}
                {selected.source === 'media_items' && (
                  <>
                    <div>
                      <span className="font-bold block text-gray-500">Consent</span>
                      <span className={selected.consent_verified ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {selected.consent_verified ? 'Verified' : 'Not verified'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold block text-gray-500">Approved</span>
                      <span className={selected.community_approved ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                        {selected.community_approved ? 'Yes' : 'Pending'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {selected.description && (
                <div>
                  <span className="font-bold block text-gray-500 text-sm">Description</span>
                  <p className="text-sm">{selected.description}</p>
                </div>
              )}

              {selected.tags && selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* URL for videos */}
              {selected.type === 'video' && selected.url && (
                <div>
                  <span className="font-bold block text-gray-500 text-sm">URL</span>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    {selected.url}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between p-5 border-t-2 border-black">
              <button
                onClick={() => handleDelete(selected)}
                className="px-4 py-2 font-bold text-red-600 border-2 border-red-600 hover:bg-red-50 inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleFeatured(selected)}
                  className={`px-4 py-2 font-bold border-2 border-black inline-flex items-center gap-2 ${
                    selected.is_featured ? 'bg-amber-100 hover:bg-amber-200' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  {selected.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => { setSelected(null); setEditingTitle(false); }}
                  className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
