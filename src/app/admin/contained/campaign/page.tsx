'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowRight,
  Camera,
  Film,
  FileText,
  BarChart3,
  Plus,
  Star,
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  Search,
  X,
  Eye,
  Globe,
} from 'lucide-react';

const SUPABASE_MEDIA = 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/media/contained';
const PROJECT_SLUG = 'the-contained';

type Tab = 'media' | 'stories' | 'stats' | 'links';

interface Photo {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  thumbnail_url: string;
  photo_type: string;
  is_featured: boolean;
  display_order: number;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  platform: string;
  is_featured: boolean;
}

interface Story {
  id: string;
  title: string;
  summary: string;
  story_image_url: string;
  themes: string[];
  story_category: string;
  is_featured: boolean;
}

interface OrgSearchResult {
  id: string;
  name: string;
  state: string;
  is_indigenous_org: boolean;
  slug: string;
}

interface InterventionSearchResult {
  id: string;
  name: string;
  evidence_level: string;
  operating_organization: string;
}

interface CampaignStats {
  total_funding: number;
  total_orgs: number;
  indigenous_orgs: number;
  total_interventions: number;
  evidence_backed: number;
  states: Array<{
    state: string;
    total: number;
    orgs: number;
    programs: number;
  }>;
}

export default function CampaignCommandCentre() {
  const [tab, setTab] = useState<Tab>('media');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const fileRef = useRef<HTMLInputElement>(null);

  // Add URL state
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'video' | 'photo'>('video');
  const [saving, setSaving] = useState(false);

  // Story creation
  const [showNewStory, setShowNewStory] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storySummary, setStorySummary] = useState('');
  const [storyCategory, setStoryCategory] = useState('community_voice');
  const [storyThemes, setStoryThemes] = useState('');
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [savingStory, setSavingStory] = useState(false);

  // Link search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'org' | 'intervention'>('org');
  const [searchResults, setSearchResults] = useState<(OrgSearchResult | InterventionSearchResult)[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchMedia();
    fetchStories();
    fetchStats();
  }, []);

  async function fetchMedia() {
    setLoading(true);
    try {
      const [videosRes, photosRes] = await Promise.all([
        fetch(`/api/projects/${PROJECT_SLUG}/media?type=video`),
        fetch(`/api/projects/${PROJECT_SLUG}/media?type=photo`),
      ]);
      const vData = await videosRes.json();
      const pData = await photosRes.json();
      setVideos(vData.videos || []);
      setPhotos(pData.photos || []);
    } catch (e) {
      console.error('Failed to fetch media:', e);
    }
    setLoading(false);
  }

  async function fetchStories() {
    try {
      const res = await fetch(`/api/projects/${PROJECT_SLUG}/stories`);
      const data = await res.json();
      setStories(data.stories || []);
    } catch (e) {
      console.error('Failed to fetch stories:', e);
    }
  }

  async function fetchStats() {
    try {
      const [statsRes, fundingRes] = await Promise.all([
        fetch('/api/homepage-stats'),
        fetch('/api/justice-spending'),
      ]);
      const statsData = await statsRes.json();
      const fundingData = await fundingRes.json();

      setStats({
        total_funding: statsData.stats?.rogs_total_punitive_billions || 0,
        total_orgs: statsData.stats?.orgs_linked || 0,
        indigenous_orgs: statsData.stats?.indigenous_orgs || 1853,
        total_interventions: statsData.stats?.programs_documented || 0,
        evidence_backed: statsData.stats?.total_evidence || 0,
        states: (fundingData.states || []).map((s: Record<string, unknown>) => ({
          state: s.state,
          total: (s as Record<string, Record<string, number>>).youth_justice?.detention_millions || 0,
          orgs: 0,
          programs: 0,
        })),
      });
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'contained');

      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      // Add to project media
      const isVideo = file.type.startsWith('video/');
      await fetch(`/api/projects/${PROJECT_SLUG}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isVideo ? 'video' : 'photo',
          url,
          title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        }),
      });

      fetchMedia();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Check console for details.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function addMediaUrl() {
    if (!addUrl) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${PROJECT_SLUG}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: addType,
          url: addUrl,
          title: addTitle || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      setShowAddUrl(false);
      setAddUrl('');
      setAddTitle('');
      fetchMedia();
    } catch (err) {
      console.error('Add failed:', err);
    }
    setSaving(false);
  }

  async function toggleFeatured(id: string, type: 'video' | 'photo', current: boolean) {
    await fetch(`/api/projects/${PROJECT_SLUG}/media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, is_featured: !current }),
    });
    fetchMedia();
  }

  async function deleteMedia(id: string, type: 'video' | 'photo') {
    if (!confirm('Delete this media?')) return;
    await fetch(`/api/projects/${PROJECT_SLUG}/media`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type }),
    });
    fetchMedia();
  }

  async function createStory() {
    if (!storyTitle || !storySummary) return;
    setSavingStory(true);
    try {
      const res = await fetch(`/api/projects/${PROJECT_SLUG}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyTitle,
          summary: storySummary,
          story_category: storyCategory,
          themes: storyThemes.split(',').map(t => t.trim()).filter(Boolean),
          story_image_url: storyImageUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create story');
      setShowNewStory(false);
      setStoryTitle('');
      setStorySummary('');
      setStoryThemes('');
      setStoryImageUrl('');
      fetchStories();
    } catch (err) {
      console.error('Story creation failed:', err);
    }
    setSavingStory(false);
  }

  async function searchLinks() {
    if (!searchQuery || searchQuery.length < 2) return;
    setSearching(true);
    try {
      const endpoint = searchType === 'org'
        ? `/api/org/search?q=${encodeURIComponent(searchQuery)}&limit=10`
        : `/api/intelligence/interventions?search=${encodeURIComponent(searchQuery)}&limit=10`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setSearchResults(
        searchType === 'org'
          ? (data.organizations || data || [])
          : (data.interventions || data || [])
      );
    } catch (e) {
      console.error('Search failed:', e);
    }
    setSearching(false);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'media', label: 'Media Gallery', icon: <Camera className="w-4 h-4" />, count: photos.length + videos.length },
    { key: 'stories', label: 'Stories & Articles', icon: <FileText className="w-4 h-4" />, count: stories.length },
    { key: 'stats', label: 'Campaign Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'links', label: 'Cross-Link Finder', icon: <LinkIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin/contained" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
                ← Back to Contained Admin
              </Link>
              <h1 className="text-4xl font-black text-black mb-2">Campaign Command Centre</h1>
              <p className="text-lg text-gray-600">
                Media, stories, stats, and cross-links — everything for the Contained campaign
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/contained"
                target="_blank"
                className="px-4 py-2 text-sm font-bold border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Live
              </Link>
              <Link
                href="/admin/contained"
                className="px-4 py-2 text-sm font-bold bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors"
              >
                Campaign Dashboard
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b-2 border-black">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px] ${
                  tab === t.key
                    ? 'border-red-600 text-black bg-white'
                    : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                {t.icon}
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════
              MEDIA TAB
              ═══════════════════════════════════════════ */}
          {tab === 'media' && (
            <div>
              {/* Actions bar */}
              <div className="flex items-center gap-3 mb-6">
                <label className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <button
                  onClick={() => setShowAddUrl(true)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black text-sm font-bold hover:bg-black hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add URL
                </button>
                <span className="text-sm text-gray-500 ml-auto">
                  {photos.length} photos, {videos.length} videos in Supabase
                </span>
              </div>

              {/* Add URL modal */}
              {showAddUrl && (
                <div className="bg-white border-2 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg">Add Media URL</h3>
                    <button onClick={() => setShowAddUrl(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">URL</label>
                      <input
                        type="url"
                        value={addUrl}
                        onChange={e => setAddUrl(e.target.value)}
                        placeholder="https://... (YouTube, Vimeo, Supabase storage, or any image URL)"
                        className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Type</label>
                      <select
                        value={addType}
                        onChange={e => setAddType(e.target.value as 'video' | 'photo')}
                        className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                      >
                        <option value="video">Video</option>
                        <option value="photo">Photo</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Title (optional)</label>
                    <input
                      type="text"
                      value={addTitle}
                      onChange={e => setAddTitle(e.target.value)}
                      placeholder="Title for this media"
                      className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <button
                    onClick={addMediaUrl}
                    disabled={saving || !addUrl}
                    className="mt-4 px-6 py-3 bg-black text-white font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add Media'}
                  </button>
                </div>
              )}

              {/* Videos section */}
              {videos.length > 0 && (
                <div className="mb-8">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                    <Film className="w-4 h-4" /> Videos ({videos.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map(v => (
                      <div key={v.id} className="bg-white border-2 border-black overflow-hidden">
                        {v.thumbnail_url ? (
                          <div className="aspect-video bg-gray-900 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                            {v.is_featured && (
                              <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-0.5 text-xs font-bold uppercase">
                                Featured
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-900 flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-bold text-sm mb-1 truncate">{v.title}</h4>
                          <p className="text-xs text-gray-500 mb-3 truncate">{v.platform} — {v.video_url.substring(0, 50)}...</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleFeatured(v.id, 'video', v.is_featured)}
                              className={`p-1.5 border ${v.is_featured ? 'border-yellow-400 text-yellow-600' : 'border-gray-300 text-gray-400'} hover:border-black`}
                              title={v.is_featured ? 'Remove featured' : 'Set as featured'}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <a
                              href={v.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 border border-gray-300 text-gray-400 hover:border-black hover:text-black"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => deleteMedia(v.id, 'video')}
                              className="p-1.5 border border-gray-300 text-gray-400 hover:border-red-600 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos section */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                  <Camera className="w-4 h-4" /> Photos ({photos.length})
                </h3>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map(p => (
                      <div key={p.id} className="bg-white border-2 border-black overflow-hidden group">
                        <div className="aspect-square relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.photo_url} alt={p.title || ''} className="w-full h-full object-cover" />
                          {p.is_featured && (
                            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-0.5 text-xs font-bold uppercase">
                              Featured
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 text-xs">
                            {p.photo_type}
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-xs mb-2 truncate">{p.title || 'Untitled'}</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleFeatured(p.id, 'photo', p.is_featured)}
                              className={`p-1 border ${p.is_featured ? 'border-yellow-400 text-yellow-600' : 'border-gray-300 text-gray-400'} hover:border-black`}
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <a
                              href={p.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 border border-gray-300 text-gray-400 hover:border-black hover:text-black"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => deleteMedia(p.id, 'photo')}
                              className="p-1 border border-gray-300 text-gray-400 hover:border-red-600 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center">
                    <Camera className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 mb-4">No photos yet. Upload or add a URL to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              STORIES TAB
              ═══════════════════════════════════════════ */}
          {tab === 'stories' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setShowNewStory(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Story
                </button>
                <Link
                  href="/admin/contained/stories"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black text-sm font-bold hover:bg-black hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" /> Moderate Stories
                </Link>
                <Link
                  href="/admin/blog/new"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-black text-sm font-bold hover:bg-black hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" /> Write Article (Blog)
                </Link>
              </div>

              {/* New story form */}
              {showNewStory && (
                <div className="bg-white border-2 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg">Create Campaign Story</h3>
                    <button onClick={() => setShowNewStory(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Title</label>
                      <input
                        type="text"
                        value={storyTitle}
                        onChange={e => setStoryTitle(e.target.value)}
                        placeholder="Story title"
                        className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Summary</label>
                      <textarea
                        value={storySummary}
                        onChange={e => setStorySummary(e.target.value)}
                        placeholder="Tell the story. This will appear on the campaign page and can be linked to any org, intervention, or funding record."
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Category</label>
                        <select
                          value={storyCategory}
                          onChange={e => setStoryCategory(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                        >
                          <option value="community_voice">Community Voice</option>
                          <option value="case_study">Case Study</option>
                          <option value="data_story">Data Story</option>
                          <option value="campaign_update">Campaign Update</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Themes (comma-separated)</label>
                        <input
                          type="text"
                          value={storyThemes}
                          onChange={e => setStoryThemes(e.target.value)}
                          placeholder="youth justice, Indigenous, community"
                          className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Image URL</label>
                        <input
                          type="url"
                          value={storyImageUrl}
                          onChange={e => setStoryImageUrl(e.target.value)}
                          placeholder="https://... or pick from Media tab"
                          className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>
                    {/* Quick pick from existing photos */}
                    {photos.length > 0 && (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Or pick from gallery:</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {photos.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setStoryImageUrl(p.photo_url)}
                              className={`flex-shrink-0 w-16 h-16 border-2 overflow-hidden ${
                                storyImageUrl === p.photo_url ? 'border-red-600' : 'border-gray-300'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.thumbnail_url || p.photo_url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={createStory}
                      disabled={savingStory || !storyTitle || !storySummary}
                      className="px-6 py-3 bg-black text-white font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      {savingStory ? 'Creating...' : 'Create Story'}
                    </button>
                  </div>
                </div>
              )}

              {/* Existing stories */}
              {stories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stories.map(s => (
                    <div key={s.id} className="bg-white border-2 border-black overflow-hidden flex">
                      {s.story_image_url && (
                        <div className="w-32 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.story_image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <h4 className="font-bold mb-1">{s.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{s.summary}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 font-bold">{s.story_category}</span>
                          {s.themes?.slice(0, 2).map(t => (
                            <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-4">No stories yet. Create your first campaign story.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════
              STATS TAB
              ═══════════════════════════════════════════ */}
          {tab === 'stats' && (
            <div>
              <p className="text-sm text-gray-500 mb-6">
                Live data from JusticeHub + CivicGraph. Use these stats in campaign copy — they update daily.
              </p>

              {stats ? (
                <div className="space-y-6">
                  {/* Hero stats for campaign copy */}
                  <div className="bg-black text-white p-8 border-2 border-black">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-6">Campaign Copy Stats (live)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-3xl font-black text-red-400">${stats.total_funding}B</div>
                        <div className="text-xs text-gray-400 uppercase mt-1">Total Punitive System / Year</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black">{stats.total_interventions.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 uppercase mt-1">Programs Documented</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-emerald-400">{stats.evidence_backed.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 uppercase mt-1">Evidence Items</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-amber-400">{stats.indigenous_orgs.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 uppercase mt-1">Indigenous Organisations</div>
                      </div>
                    </div>
                  </div>

                  {/* Key talking points */}
                  <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-lg mb-4">Key Talking Points</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200">
                        <span className="text-red-600 font-bold shrink-0">COST</span>
                        <p>Australia spends <strong>$1.55M per child per year</strong> on youth detention. Community alternatives cost <strong>$75/day</strong>. That&apos;s 56x cheaper.</p>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200">
                        <span className="text-red-600 font-bold shrink-0">FAILURE</span>
                        <p><strong>84%</strong> of detained youth reoffend within 2 years. Therapeutic models like Spain&apos;s Diagrama achieve <strong>73% success</strong> with <strong>13.6% recidivism</strong>.</p>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200">
                        <span className="text-amber-600 font-bold shrink-0">INDIGENOUS</span>
                        <p>Indigenous youth are <strong>23x overrepresented</strong> in detention. {stats.indigenous_orgs.toLocaleString()} Indigenous organisations are documented across Australia.</p>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200">
                        <span className="text-emerald-600 font-bold shrink-0">EVIDENCE</span>
                        <p>{stats.total_interventions.toLocaleString()} programs catalogued, {stats.evidence_backed.toLocaleString()} evidence items collected. The solutions exist — they&apos;re underfunded.</p>
                      </div>
                    </div>
                  </div>

                  {/* State breakdown */}
                  {stats.states.length > 0 && (
                    <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="font-black text-lg mb-4">State-by-State Youth Justice Spending</h3>
                      <p className="text-sm text-gray-500 mb-4">Use for per-state AG emails and local campaign copy.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stats.states.map(s => (
                          <div key={s.state} className="flex items-center justify-between p-3 border border-gray-200">
                            <span className="font-bold">{s.state}</span>
                            <span className="text-red-600 font-mono font-bold">
                              {s.total > 0 ? `$${s.total}M detention` : 'Data pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/justice-funding"
                        className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-emerald-600 hover:underline"
                      >
                        Full funding data <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════
              CROSS-LINK FINDER TAB
              ═══════════════════════════════════════════ */}
          {tab === 'links' && (
            <div>
              <p className="text-sm text-gray-500 mb-6">
                Find organisations, interventions, and funding records to link in campaign stories and social posts.
              </p>

              <div className="flex gap-3 mb-6">
                <div className="flex border-2 border-black">
                  <button
                    onClick={() => setSearchType('org')}
                    className={`px-4 py-2 text-sm font-bold ${searchType === 'org' ? 'bg-black text-white' : 'bg-white text-black'}`}
                  >
                    Organisations
                  </button>
                  <button
                    onClick={() => setSearchType('intervention')}
                    className={`px-4 py-2 text-sm font-bold ${searchType === 'intervention' ? 'bg-black text-white' : 'bg-white text-black'}`}
                  >
                    Interventions
                  </button>
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchLinks()}
                      placeholder={searchType === 'org' ? 'Search organisations...' : 'Search interventions...'}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <button
                    onClick={searchLinks}
                    disabled={searching}
                    className="px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((r) => {
                    if (searchType === 'org') {
                      const org = r as OrgSearchResult;
                      return (
                        <div key={org.id} className="bg-white border-2 border-black p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold">{org.name}</h4>
                            <div className="flex gap-2 mt-1">
                              {org.state && <span className="text-xs bg-gray-100 px-2 py-0.5">{org.state}</span>}
                              {org.is_indigenous_org && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 font-bold">Indigenous-led</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/organizations/${org.slug}`}
                              target="_blank"
                              className="p-2 border border-gray-300 hover:border-black text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`/organizations/${org.slug}`);
                              }}
                              className="p-2 border border-gray-300 hover:border-black text-sm"
                              title="Copy link"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    const int = r as InterventionSearchResult;
                    return (
                      <div key={int.id} className="bg-white border-2 border-black p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold">{int.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5">{int.evidence_level}</span>
                            {int.operating_organization && (
                              <span className="text-xs text-gray-500">{int.operating_organization}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href="/intelligence/interventions"
                            target="_blank"
                            className="p-2 border border-gray-300 hover:border-black text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick links */}
              <div className="mt-8 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-lg mb-4">Quick Links for Campaign</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Oonchiumpa', href: '/organizations/oonchiumpa', desc: 'Aboriginal-led cultural healing, Alice Springs NT' },
                    { label: 'BG Fit', href: '/organizations/bg-fit', desc: 'Youth fitness & mentoring, Mount Isa QLD' },
                    { label: 'Mounty Yarns', href: '/organizations/mounty-yarns', desc: 'Youth-led storytelling, Mount Druitt NSW' },
                    { label: 'PICC Townsville', href: '/organizations/picc-townsville', desc: 'Pasifika family support, Townsville QLD' },
                    { label: 'ALMA Interventions', href: '/intelligence/interventions', desc: 'Evidence intelligence engine' },
                    { label: 'Justice Funding', href: '/justice-funding', desc: 'National funding tracker' },
                    { label: 'Contained Tour', href: '/contained', desc: 'Public campaign page' },
                    { label: 'For Funders', href: '/for-funders', desc: 'Foundation outreach' },
                  ].map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      className="flex items-center justify-between p-3 border border-gray-200 hover:border-black transition-colors group"
                    >
                      <div>
                        <span className="font-bold text-sm">{link.label}</span>
                        <span className="text-xs text-gray-500 ml-2">{link.desc}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
