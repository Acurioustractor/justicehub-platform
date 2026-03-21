'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/ui/navigation';
import {
  Search, Grid, List, Image as ImageIcon, Tag, Star,
  AlertTriangle, Check, X, Filter, Download,
} from 'lucide-react';

interface PhotoAsset {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  tags: string[];
  uploaded_at: string;
  metadata: {
    title?: string;
    cdn_url?: string;
    is_ai_generated?: boolean;
    campaign_status?: string;
    campaign_use?: string;
    source?: string;
    relative_path?: string;
    privacy_level?: string;
  };
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  hero: { label: 'Hero', color: 'bg-red-900/30 text-red-300 border-red-700' },
  people: { label: 'People', color: 'bg-blue-900/30 text-blue-300 border-blue-700' },
  places: { label: 'Places', color: 'bg-emerald-900/30 text-emerald-300 border-emerald-700' },
  programs: { label: 'Programs', color: 'bg-amber-900/30 text-amber-300 border-amber-700' },
  spain: { label: 'Spain', color: 'bg-pink-900/30 text-pink-300 border-pink-700' },
  community: { label: 'Community', color: 'bg-purple-900/30 text-purple-300 border-purple-700' },
  data: { label: 'Data', color: 'bg-violet-900/30 text-violet-300 border-violet-700' },
  contained: { label: 'Campaign', color: 'bg-orange-900/30 text-orange-300 border-orange-700' },
  goods: { label: 'Goods', color: 'bg-stone-900/30 text-stone-300 border-stone-700' },
};

const CAMPAIGN_STATUSES = [
  { value: 'available', label: 'Available', icon: '○' },
  { value: 'nominated', label: 'Nominated', icon: '★' },
  { value: 'approved', label: 'Approved', icon: '✓' },
  { value: 'flagged-replace', label: 'Replace', icon: '⚠' },
];

export default function CampaignPhotosPage() {
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selection + lightbox
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '200' });
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('campaign_status', selectedStatus);
    if (searchQuery) params.set('search', searchQuery);

    try {
      const res = await fetch(`/api/photos?${params}`);
      const data = await res.json();
      setPhotos(data.photos || []);
      setCategories(data.categories || {});
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const updatePhoto = async (id: string, updates: { campaign_status?: string; campaign_use?: string; tags?: string[] }) => {
    await fetch('/api/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    // Optimistic update
    setPhotos(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        tags: updates.tags ?? p.tags,
        metadata: {
          ...p.metadata,
          ...(updates.campaign_status && { campaign_status: updates.campaign_status }),
          ...(updates.campaign_use && { campaign_use: updates.campaign_use }),
        },
      };
    }));
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(prev => prev ? {
        ...prev,
        tags: updates.tags ?? prev.tags,
        metadata: {
          ...prev.metadata,
          ...(updates.campaign_status && { campaign_status: updates.campaign_status }),
          ...(updates.campaign_use && { campaign_use: updates.campaign_use }),
        },
      } : null);
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    for (const id of selectedIds) {
      await updatePhoto(id, { campaign_status: status });
    }
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      <Navigation />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Campaign Photo Library
            </h1>
            <p className="text-sm text-[#F5F0E8]/40 mt-1 font-mono">
              {total} photos cataloged — tag, nominate, and manage campaign assets
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-white/5 rounded px-3 py-1.5 border border-white/10">
                <span className="text-xs font-mono text-[#F5F0E8]/60">{selectedIds.size} selected</span>
                <button onClick={() => bulkUpdateStatus('nominated')} className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded hover:bg-amber-900/60">
                  Nominate
                </button>
                <button onClick={() => bulkUpdateStatus('approved')} className="text-xs px-2 py-0.5 bg-emerald-900/40 text-emerald-300 rounded hover:bg-emerald-900/60">
                  Approve
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60">
                  <X size={14} />
                </button>
              </div>
            )}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10"
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F0E8]/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search photos..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-[#F5F0E8] placeholder:text-[#F5F0E8]/20 focus:outline-none focus:border-red-700"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-xs font-mono rounded border transition ${
                !selectedCategory
                  ? 'bg-red-900/30 border-red-700 text-red-300'
                  : 'bg-white/5 border-white/10 text-[#F5F0E8]/40 hover:text-[#F5F0E8]/60'
              }`}
            >
              All ({total})
            </button>
            {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
              const cfg = CATEGORY_LABELS[cat] || { label: cat, color: 'bg-white/5 text-[#F5F0E8]/40 border-white/10' };
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 text-xs font-mono rounded border transition ${
                    selectedCategory === cat ? cfg.color : 'bg-white/5 border-white/10 text-[#F5F0E8]/40 hover:text-[#F5F0E8]/60'
                  }`}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {CAMPAIGN_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(selectedStatus === s.value ? null : s.value)}
                className={`px-2.5 py-1.5 text-xs font-mono rounded border transition ${
                  selectedStatus === s.value
                    ? 'bg-white/15 border-white/30 text-[#F5F0E8]'
                    : 'bg-white/5 border-white/10 text-[#F5F0E8]/30 hover:text-[#F5F0E8]/50'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-[#F5F0E8]/30 font-mono text-sm">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 text-[#F5F0E8]/30 font-mono text-sm">No photos found. Run the import script first.</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {photos.map(photo => {
              const isSelected = selectedIds.has(photo.id);
              const isAI = photo.metadata?.is_ai_generated;
              const status = photo.metadata?.campaign_status || 'available';
              return (
                <div
                  key={photo.id}
                  className={`group relative rounded overflow-hidden border transition cursor-pointer ${
                    isSelected
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : isAI
                      ? 'border-red-800/50 bg-red-950/20'
                      : 'border-white/6 hover:border-white/20'
                  }`}
                >
                  {/* Select checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(photo.id); }}
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-red-600 border-red-600'
                        : 'bg-black/50 border-white/30 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </button>

                  {/* Status badge */}
                  {status !== 'available' && (
                    <div className={`absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                      status === 'nominated' ? 'bg-amber-900/80 text-amber-300'
                        : status === 'approved' ? 'bg-emerald-900/80 text-emerald-300'
                        : status === 'flagged-replace' ? 'bg-red-900/80 text-red-300'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {status === 'flagged-replace' ? 'REPLACE' : status.toUpperCase()}
                    </div>
                  )}

                  {isAI && (
                    <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-red-700 text-white text-[9px] font-mono">
                      AI — REPLACE
                    </div>
                  )}

                  {/* Image */}
                  <div onClick={() => setSelectedPhoto(photo)}>
                    <img
                      src={photo.file_path}
                      alt={photo.metadata?.title || photo.filename}
                      loading="lazy"
                      className="w-full h-[140px] object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-2 bg-[#0A0A0A]">
                    <div className="text-[11px] font-medium truncate">
                      {photo.metadata?.title || photo.filename}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        CATEGORY_LABELS[photo.category]?.color || 'bg-white/5 text-white/30 border-white/10'
                      }`}>
                        {CATEGORY_LABELS[photo.category]?.label || photo.category}
                      </span>
                      <span className="text-[9px] text-[#F5F0E8]/20 font-mono">
                        {formatSize(photo.file_size)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-1">
            {photos.map(photo => {
              const isAI = photo.metadata?.is_ai_generated;
              const status = photo.metadata?.campaign_status || 'available';
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`flex items-center gap-4 px-3 py-2 rounded border cursor-pointer transition ${
                    isAI ? 'border-red-800/30 bg-red-950/10' : 'border-white/6 hover:border-white/15 hover:bg-white/3'
                  }`}
                >
                  <img src={photo.file_path} alt="" className="w-16 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{photo.metadata?.title || photo.filename}</div>
                    <div className="text-[10px] text-[#F5F0E8]/30 font-mono">{photo.filename}</div>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    CATEGORY_LABELS[photo.category]?.color || 'bg-white/5 text-white/30 border-white/10'
                  }`}>
                    {CATEGORY_LABELS[photo.category]?.label || photo.category}
                  </span>
                  <span className="text-[10px] text-[#F5F0E8]/20 font-mono w-16 text-right">{formatSize(photo.file_size)}</span>
                  {isAI && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                  {status === 'nominated' && <Star size={14} className="text-amber-400 shrink-0" />}
                  {status === 'approved' && <Check size={14} className="text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox / Detail panel */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex" onClick={() => setSelectedPhoto(null)}>
          <div className="flex-1 flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.file_path}
              alt={selectedPhoto.metadata?.title || selectedPhoto.filename}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Side panel */}
          <div
            className="w-80 bg-[#111] border-l border-white/10 p-5 overflow-y-auto shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Photo Details</h3>
              <button onClick={() => setSelectedPhoto(null)} className="text-[#F5F0E8]/30 hover:text-[#F5F0E8]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">Title</div>
                <div className="text-sm">{selectedPhoto.metadata?.title || selectedPhoto.filename}</div>
              </div>

              {/* Filename */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">Filename</div>
                <div className="font-mono text-[10px] text-[#F5F0E8]/50 break-all">{selectedPhoto.filename}</div>
              </div>

              {/* Category */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">Category</div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  CATEGORY_LABELS[selectedPhoto.category]?.color || 'bg-white/5 text-white/30 border-white/10'
                }`}>
                  {CATEGORY_LABELS[selectedPhoto.category]?.label || selectedPhoto.category}
                </span>
              </div>

              {/* Tags */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {selectedPhoto.tags?.map(tag => (
                    <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#F5F0E8]/40 border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* File info */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">File</div>
                <div className="text-[#F5F0E8]/50 font-mono">
                  {formatSize(selectedPhoto.file_size)} — {selectedPhoto.mime_type}
                </div>
              </div>

              {/* Local path */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">Path</div>
                <div className="text-[10px] font-mono text-[#F5F0E8]/30 break-all">{selectedPhoto.file_path}</div>
              </div>

              {/* CDN URL */}
              {selectedPhoto.metadata?.cdn_url && (
                <div>
                  <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-1">CDN URL</div>
                  <div className="text-[10px] font-mono text-blue-400 break-all">{selectedPhoto.metadata.cdn_url}</div>
                </div>
              )}

              <hr className="border-white/10" />

              {/* Campaign Status */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-2">Campaign Status</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {CAMPAIGN_STATUSES.map(s => {
                    const isActive = (selectedPhoto.metadata?.campaign_status || 'available') === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => updatePhoto(selectedPhoto.id, { campaign_status: s.value })}
                        className={`px-2 py-1.5 text-[10px] font-mono rounded border transition ${
                          isActive
                            ? s.value === 'approved' ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300'
                            : s.value === 'nominated' ? 'bg-amber-900/40 border-amber-600 text-amber-300'
                            : s.value === 'flagged-replace' ? 'bg-red-900/40 border-red-600 text-red-300'
                            : 'bg-white/10 border-white/20 text-[#F5F0E8]/60'
                            : 'bg-white/3 border-white/8 text-[#F5F0E8]/30 hover:bg-white/5'
                        }`}
                      >
                        {s.icon} {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Use */}
              <div>
                <div className="text-[#F5F0E8]/30 font-mono uppercase tracking-wider mb-2">Campaign Use</div>
                <div className="flex flex-wrap gap-1.5">
                  {['hero', 'social', 'email-banner', 'website', 'print', 'video-thumb'].map(use => {
                    const isActive = selectedPhoto.metadata?.campaign_use === use;
                    return (
                      <button
                        key={use}
                        onClick={() => updatePhoto(selectedPhoto.id, { campaign_use: isActive ? '' : use })}
                        className={`px-2 py-1 text-[9px] font-mono rounded border transition ${
                          isActive
                            ? 'bg-red-900/40 border-red-600 text-red-300'
                            : 'bg-white/3 border-white/8 text-[#F5F0E8]/30 hover:bg-white/5'
                        }`}
                      >
                        {use}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Warning */}
              {selectedPhoto.metadata?.is_ai_generated && (
                <div className="bg-red-950/40 border border-red-800/50 rounded p-3">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1">
                    <AlertTriangle size={14} />
                    AI-Generated — Must Replace
                  </div>
                  <p className="text-[10px] text-red-300/60">
                    This photo violates the brand rule. Replace with a real photo from the library.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
