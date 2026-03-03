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
} from 'lucide-react';

interface MediaItem {
  id: string;
  file_url: string;
  file_type: string;
  title: string;
  description: string | null;
  alt_text: string | null;
  thumbnail_url: string | null;
  consent_verified: boolean;
  community_approved: boolean;
  manual_tags: string[] | null;
  capture_date: string | null;
  created_at: string;
}

export function MediaTab({ orgId }: { orgId: string }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media`);
      if (!res.ok) throw new Error('Failed to fetch media');
      const json = await res.json();
      setMedia(json.data || []);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return;
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setMedia(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleToggleApproval = async (item: MediaItem) => {
    try {
      const res = await fetch(`/api/org-hub/${orgId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          community_approved: !item.community_approved,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setMedia(prev =>
        prev.map(m =>
          m.id === item.id ? { ...m, community_approved: !m.community_approved } : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filtered = media.filter(m => filter === 'all' || m.file_type === filter);
  const photoCount = media.filter(m => m.file_type === 'photo').length;
  const videoCount = media.filter(m => m.file_type === 'video').length;

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

        <label className="px-4 py-2 font-bold bg-black text-white hover:bg-gray-800 cursor-pointer inline-flex items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Media
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
      </div>

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
            Upload photos and videos to build this organisation&apos;s media library.
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className="group relative bg-white border-2 border-black overflow-hidden cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              onClick={() => setSelected(item)}
            >
              <div className="aspect-square relative">
                {item.file_type === 'video' ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.thumbnail_url || item.file_url}
                    alt={item.alt_text || item.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Badges */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {item.community_approved && (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      <Check className="w-3 h-3 inline" />
                    </span>
                  )}
                  {!item.consent_verified && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      !
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2">
                <p className="text-xs font-bold truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b-2 border-black">
              <h3 className="text-lg font-black truncate">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              {selected.file_type === 'video' ? (
                <video src={selected.file_url} controls className="w-full max-h-[50vh] bg-black" />
              ) : (
                <img
                  src={selected.file_url}
                  alt={selected.alt_text || selected.title}
                  className="w-full max-h-[50vh] object-contain bg-gray-50"
                />
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold block text-gray-500">Type</span>
                  <span className="capitalize">{selected.file_type}</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-500">Date</span>
                  <span>{selected.capture_date || selected.created_at?.split('T')[0]}</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-500">Consent Verified</span>
                  <span className={selected.consent_verified ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {selected.consent_verified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-bold block text-gray-500">Community Approved</span>
                  <span className={selected.community_approved ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                    {selected.community_approved ? 'Yes' : 'Pending'}
                  </span>
                </div>
              </div>

              {selected.description && (
                <div>
                  <span className="font-bold block text-gray-500 text-sm">Description</span>
                  <p className="text-sm">{selected.description}</p>
                </div>
              )}

              {selected.manual_tags && selected.manual_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.manual_tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between p-5 border-t-2 border-black">
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-4 py-2 font-bold text-red-600 border-2 border-red-600 hover:bg-red-50 inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleApproval(selected)}
                  className={`px-4 py-2 font-bold border-2 border-black inline-flex items-center gap-2 ${
                    selected.community_approved ? 'bg-orange-100 hover:bg-orange-200' : 'bg-green-100 hover:bg-green-200'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {selected.community_approved ? 'Revoke Approval' : 'Approve'}
                </button>
                <button
                  onClick={() => setSelected(null)}
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
