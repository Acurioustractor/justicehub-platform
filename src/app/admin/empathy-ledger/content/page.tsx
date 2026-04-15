'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Image, FolderOpen, Users, ExternalLink, RefreshCw, Camera, BookOpen, Quote, MapPin } from 'lucide-react';

interface Gallery {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  photoCount: number;
  mediaAssetCount: number;
  culturalLevel: string;
  culturalTheme: string | null;
  storytellers: Array<{
    id: string;
    displayName: string;
    culturalBackground: string[];
    role: string;
    isPrimary: boolean;
  }>;
  projects: Array<{ id: string; name: string; projectCode: string }>;
  mediaUrl: string;
}

interface MediaAsset {
  id: string;
  title: string | null;
  url: string;
  thumbnailUrl: string | null;
  contentType: string;
  dimensions: { width: number; height: number } | null;
  altText: string | null;
  culturalLevel: string;
  location: string | null;
  galleryId: string;
  galleryCaption: string | null;
  createdAt: string;
}

interface Storyteller {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cultural_background: string[] | null;
  location: string | null;
  is_justicehub_featured: boolean;
  story_count?: number;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  story_image_url: string | null;
  story_type: string | null;
  story_category: string | null;
  themes: string[] | null;
  is_featured: boolean;
  justicehub_featured: boolean;
  cultural_sensitivity_level: string | null;
  published_at: string | null;
  storyteller_id: string | null;
  storyteller_name: string | null;
  excerpt: string;
}

interface Project {
  id: string;
  name: string;
  projectCode: string;
  storytellerCount: number;
  storyCount: number;
  galleries: Gallery[];
}

type TabType = 'overview' | 'galleries' | 'media' | 'storytellers' | 'stories';

export default function ELContentManager() {
  const [tab, setTab] = useState<TabType>('overview');
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [storytellers, setStorytellers] = useState<Storyteller[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaHasMore, setMediaHasMore] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch('/api/empathy-ledger/projects');
      const data = await res.json();
      if (data.projects?.length > 0) setProject(data.projects[0]);
    } catch (e) {
      console.error('Failed to fetch project:', e);
    }
  }, []);

  const fetchGalleries = useCallback(async () => {
    try {
      const res = await fetch('/api/empathy-ledger/galleries');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch (e) {
      setError('Failed to load galleries');
    }
  }, []);

  const fetchMedia = useCallback(async (galleryId?: string, page = 1) => {
    try {
      const params = new URLSearchParams({ type: 'image', limit: '20', page: String(page) });
      if (galleryId) params.set('galleryId', galleryId);
      const res = await fetch(`/api/empathy-ledger/media?${params}`);
      const data = await res.json();
      setMedia(data.media || []);
      setMediaTotal(data.pagination?.total || 0);
      setMediaHasMore(data.pagination?.hasMore || false);
      setMediaPage(page);
    } catch (e) {
      setError('Failed to load media');
    }
  }, []);

  const fetchStorytellers = useCallback(async () => {
    try {
      const res = await fetch('/api/empathy-ledger/profiles?limit=100&include_stories=true');
      const data = await res.json();
      setStorytellers(data.profiles || []);
    } catch (e) {
      console.error('Failed to fetch storytellers:', e);
    }
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/empathy-ledger/stories?limit=50');
      const data = await res.json();
      setStories(data.stories || []);
    } catch (e) {
      console.error('Failed to fetch stories:', e);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchGalleries(), fetchMedia(), fetchStorytellers(), fetchStories()]);
      setLoading(false);
    };
    load();
  }, [fetchProject, fetchGalleries, fetchMedia, fetchStorytellers, fetchStories]);

  const handleGalleryFilter = (galleryId: string) => {
    setSelectedGallery(galleryId);
    fetchMedia(galleryId, 1);
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchProject(), fetchGalleries(), fetchMedia(selectedGallery), fetchStorytellers(), fetchStories()]);
    setLoading(false);
  };

  const totalPhotos = galleries.reduce((sum, g) => sum + g.photoCount, 0);
  const totalStorytellers = storytellers.length || project?.storytellerCount || 0;
  const totalStories = stories.length || project?.storyCount || 0;

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Header */}
      <section className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-10 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href="/admin/empathy-ledger"
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 mb-4 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to EL Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Camera className="h-7 w-7 text-violet-600" />
                <h1 className="text-3xl md:text-4xl font-black">Campaign Content</h1>
              </div>
              <p className="text-earth-700">
                Galleries, storytellers, stories, and media from Empathy Ledger — consent-verified, culturally safe, sovereignty-tracked.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/empathy-ledger/postcards"
                className="flex items-center gap-2 px-4 py-2 bg-white text-earth-900 border-2 border-black font-bold hover:bg-earth-50"
              >
                <Quote className="h-4 w-4" />
                Postcard Editor
              </Link>
              <button
                onClick={refreshAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white border-2 border-black font-bold hover:bg-violet-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-justice py-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 p-4 mb-6 text-red-800 font-medium">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button onClick={() => setTab('galleries')} className="border-2 border-black p-5 bg-violet-50 text-left hover:bg-violet-100 transition-colors">
            <div className="text-3xl font-black text-violet-600">{galleries.length}</div>
            <div className="font-bold text-earth-900 text-sm">Galleries</div>
          </button>
          <button onClick={() => setTab('media')} className="border-2 border-black p-5 bg-purple-50 text-left hover:bg-purple-100 transition-colors">
            <div className="text-3xl font-black text-purple-600">{totalPhotos}</div>
            <div className="font-bold text-earth-900 text-sm">Photos</div>
          </button>
          <button onClick={() => setTab('storytellers')} className="border-2 border-black p-5 bg-indigo-50 text-left hover:bg-indigo-100 transition-colors">
            <div className="text-3xl font-black text-indigo-600">{totalStorytellers}</div>
            <div className="font-bold text-earth-900 text-sm">Storytellers</div>
          </button>
          <button onClick={() => setTab('stories')} className="border-2 border-black p-5 bg-green-50 text-left hover:bg-green-100 transition-colors">
            <div className="text-3xl font-black text-green-600">{totalStories}</div>
            <div className="font-bold text-earth-900 text-sm">Stories</div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-black pb-2 flex-wrap">
          {([
            { key: 'overview', icon: FolderOpen, label: 'Overview' },
            { key: 'galleries', icon: Image, label: 'Galleries' },
            { key: 'media', icon: Camera, label: 'Media' },
            { key: 'storytellers', icon: Users, label: 'Storytellers' },
            { key: 'stories', icon: BookOpen, label: 'Stories' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 font-bold text-sm uppercase tracking-wide transition-colors flex items-center gap-2 ${
                tab === t.key
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-earth-700 hover:bg-gray-200'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ Overview Tab ═══ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="border-2 border-black p-6 bg-blue-50">
              <h2 className="text-xl font-black mb-3">Campaign Workflow</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-black p-4">
                  <div className="text-lg font-black mb-1">1. Upload</div>
                  <p className="text-sm text-earth-700 mb-3">
                    Upload photos to Empathy Ledger during the tour. Drag & drop in admin.
                  </p>
                  <a
                    href="https://empathyledger.com/admin/galleries"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-bold text-violet-600 hover:text-violet-800"
                  >
                    Open EL Admin <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="bg-white border-2 border-black p-4">
                  <div className="text-lg font-black mb-1">2. Tag</div>
                  <p className="text-sm text-earth-700 mb-3">
                    Tag storytellers, approve syndication. Content flows to JH automatically.
                  </p>
                  <span className="text-sm text-earth-500 font-medium">Consent auto-tracked</span>
                </div>
                <div className="bg-white border-2 border-black p-4">
                  <div className="text-lg font-black mb-1">3. Compose</div>
                  <p className="text-sm text-earth-700 mb-3">
                    Build social tiles with the composer. Stats + real photos = campaign gold.
                  </p>
                  <button onClick={() => setTab('media')} className="text-sm font-bold text-violet-600">
                    Browse media below
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Storytellers preview */}
            {storytellers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Storytellers ({totalStorytellers})
                  </h2>
                  <button onClick={() => setTab('storytellers')} className="text-sm font-bold text-violet-600 hover:text-violet-800">
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {storytellers.slice(0, 12).map(s => (
                    <div key={s.id} className="border-2 border-black p-3 bg-white text-center hover:bg-indigo-50 transition-colors">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt={s.display_name} className="w-16 h-16 rounded-full object-cover border-2 border-black mx-auto mb-2" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-black mx-auto mb-2 flex items-center justify-center text-indigo-600 font-black text-lg">
                          {s.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="font-bold text-sm truncate">{s.display_name}</div>
                      {s.location && (
                        <div className="text-xs text-earth-500 truncate flex items-center gap-1 justify-center">
                          <MapPin className="h-3 w-3" />{s.location}
                        </div>
                      )}
                      {s.cultural_background && s.cultural_background.length > 0 && (
                        <div className="text-xs text-indigo-600 font-medium mt-1 truncate">{s.cultural_background.join(', ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tour Stop Galleries */}
            <div>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-violet-600" />
                Tour Stop Galleries
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {galleries.map(g => (
                  <div key={g.id} className="border-2 border-black bg-white hover:bg-violet-50 transition-colors">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-black text-lg">{g.title}</h3>
                        <span className={`text-xs font-bold px-2 py-1 border ${
                          g.photoCount > 0
                            ? 'bg-green-100 border-green-600 text-green-800'
                            : 'bg-gray-100 border-gray-400 text-gray-600'
                        }`}>
                          {g.photoCount > 0 ? `${g.photoCount} photos` : 'Empty'}
                        </span>
                      </div>
                      <p className="text-sm text-earth-600 mb-3">{g.description}</p>
                      {g.storytellers?.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-earth-500" />
                          <span className="text-sm text-earth-600">
                            {g.storytellers.map(s => s.displayName).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-earth-500">
                        <span>Cultural level: <strong>{g.culturalLevel}</strong></span>
                        {g.culturalTheme && <span>Theme: <strong>{g.culturalTheme}</strong></span>}
                      </div>
                    </div>
                    {g.photoCount > 0 && (
                      <div className="border-t-2 border-black p-3 bg-violet-50">
                        <button
                          onClick={() => { setTab('media'); handleGalleryFilter(g.id); }}
                          className="text-sm font-bold text-violet-600 hover:text-violet-800"
                        >
                          Browse {g.photoCount} photos →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stories preview */}
            {stories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Stories ({totalStories})
                  </h2>
                  <button onClick={() => setTab('stories')} className="text-sm font-bold text-violet-600 hover:text-violet-800">
                    View all →
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {stories.slice(0, 4).map(s => (
                    <div key={s.id} className="border-2 border-black p-5 bg-white hover:bg-green-50 transition-colors">
                      <div className="flex gap-4">
                        {s.story_image_url && (
                          <img src={s.story_image_url} alt={s.title} className="w-20 h-20 object-cover border-2 border-black flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-base mb-1 truncate">{s.title}</h3>
                          {s.story_category && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-green-100 border border-green-300 text-green-800">{s.story_category}</span>
                          )}
                          <p className="text-sm text-earth-600 mt-2 line-clamp-2">{s.excerpt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Galleries Tab ═══ */}
        {tab === 'galleries' && (
          <div className="space-y-4">
            {galleries.map(g => (
              <div key={g.id} className="border-2 border-black p-5 bg-white hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-black text-lg mb-1">{g.title}</h3>
                    <p className="text-sm text-earth-600 mb-2">{g.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-2 py-1 bg-violet-100 border border-violet-300 font-bold">
                        {g.photoCount} photos
                      </span>
                      <span className="px-2 py-1 bg-gray-100 border border-gray-300">
                        {g.slug}
                      </span>
                      <span className="px-2 py-1 bg-amber-50 border border-amber-300">
                        cultural: {g.culturalLevel}
                      </span>
                      {g.projects?.map(p => (
                        <span key={p.id} className="px-2 py-1 bg-green-50 border border-green-300">
                          {p.projectCode || p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {g.photoCount > 0 && (
                    <button
                      onClick={() => { setTab('media'); handleGalleryFilter(g.id); }}
                      className="px-4 py-2 bg-violet-600 text-white border-2 border-black font-bold hover:bg-violet-700 text-sm"
                    >
                      View Media
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ Media Tab ═══ */}
        {tab === 'media' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <label className="font-bold text-sm">Filter by gallery:</label>
              <select
                value={selectedGallery}
                onChange={e => handleGalleryFilter(e.target.value)}
                className="border-2 border-black px-3 py-2 font-medium bg-white"
              >
                <option value="">All galleries</option>
                {galleries.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.photoCount})
                  </option>
                ))}
              </select>
              <span className="text-sm text-earth-600 ml-auto">
                {mediaTotal} total · Page {mediaPage}
              </span>
            </div>

            {media.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map(m => (
                    <div key={m.id} className="border-2 border-black bg-white group hover:border-violet-600 transition-colors">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={m.thumbnailUrl || m.url}
                          alt={m.altText || m.title || 'Media asset'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-bold truncate">{m.title || m.altText || 'Untitled'}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-earth-500">
                          <span>{m.contentType}</span>
                          {m.location && <span>· {m.location}</span>}
                        </div>
                        {m.galleryCaption && (
                          <div className="text-xs text-earth-600 mt-1 italic truncate">{m.galleryCaption}</div>
                        )}
                        <div className="mt-2">
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1">
                            Full size <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button onClick={() => fetchMedia(selectedGallery, mediaPage - 1)} disabled={mediaPage <= 1}
                    className="px-4 py-2 border-2 border-black font-bold disabled:opacity-30 hover:bg-gray-100">Previous</button>
                  <span className="font-bold">Page {mediaPage} · {mediaTotal} photos</span>
                  <button onClick={() => fetchMedia(selectedGallery, mediaPage + 1)} disabled={!mediaHasMore}
                    className="px-4 py-2 border-2 border-black font-bold disabled:opacity-30 hover:bg-gray-100">Next</button>
                </div>
              </>
            ) : (
              <div className="border-2 border-black p-12 bg-gray-50 text-center">
                <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <div className="text-lg font-bold text-gray-500 mb-2">No media yet</div>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Upload photos to Empathy Ledger and tag them to a JusticeHub gallery.
                  They&apos;ll appear here automatically once consent is approved.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Storytellers Tab ═══ */}
        {tab === 'storytellers' && (
          <div>
            <p className="text-sm text-earth-600 mb-6">
              {totalStorytellers} people have opted in to share their voice through JusticeHub. Every profile shown here has explicit consent.
            </p>
            {storytellers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storytellers.map(s => (
                  <div key={s.id} className={`border-2 border-black p-5 bg-white hover:bg-indigo-50 transition-colors ${s.is_justicehub_featured ? 'ring-2 ring-indigo-400' : ''}`}>
                    <div className="flex items-start gap-4">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt={s.display_name} className="w-16 h-16 rounded-full object-cover border-2 border-black flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-black flex-shrink-0 flex items-center justify-center text-indigo-600 font-black text-xl">
                          {s.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-base truncate">{s.display_name}</h3>
                          {s.is_justicehub_featured && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-700 flex-shrink-0">Featured</span>
                          )}
                        </div>

                        {s.cultural_background && s.cultural_background.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {s.cultural_background.map((bg, i) => (
                              <span key={i} className="text-xs font-medium px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800">{bg}</span>
                            ))}
                          </div>
                        )}

                        {s.location && (
                          <div className="text-sm text-earth-600 flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />{s.location}
                          </div>
                        )}

                        {s.bio && (
                          <p className="text-sm text-earth-600 line-clamp-3">{s.bio}</p>
                        )}

                        {(s.story_count ?? 0) > 0 && (
                          <div className="mt-2 text-xs font-bold text-green-700">
                            {s.story_count} {s.story_count === 1 ? 'story' : 'stories'} published
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-black p-12 bg-gray-50 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <div className="text-lg font-bold text-gray-500 mb-2">No storytellers yet</div>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Storytellers opt in from Empathy Ledger. When they enable JusticeHub sharing, they&apos;ll appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Stories Tab ═══ */}
        {tab === 'stories' && (
          <div>
            <p className="text-sm text-earth-600 mb-6">
              Published stories with full consent — personal narratives, impact stories, healing journeys, and community voices.
            </p>
            {stories.length > 0 ? (
              <div className="space-y-4">
                {stories.map(s => (
                  <div key={s.id} className={`border-2 border-black bg-white hover:bg-green-50 transition-colors ${s.justicehub_featured ? 'ring-2 ring-green-400' : ''}`}>
                    <div className="flex">
                      {s.story_image_url && (
                        <div className="w-48 flex-shrink-0">
                          <img src={s.story_image_url} alt={s.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-black text-lg mb-1">{s.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {s.story_category && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-green-100 border border-green-300 text-green-800">{s.story_category}</span>
                              )}
                              {s.justicehub_featured && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-700">JH Featured</span>
                              )}
                              {s.cultural_sensitivity_level && s.cultural_sensitivity_level !== 'low' && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800">
                                  Cultural: {s.cultural_sensitivity_level}
                                </span>
                              )}
                            </div>
                          </div>
                          {s.published_at && (
                            <span className="text-xs text-earth-500 flex-shrink-0">
                              {new Date(s.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-earth-700 mb-3">{s.excerpt}</p>

                        {s.themes && s.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {s.themes.map((theme, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 border border-gray-200 text-earth-600">{theme}</span>
                            ))}
                          </div>
                        )}

                        {s.storyteller_name && (
                          <div className="text-sm text-earth-600 flex items-center gap-1">
                            <Quote className="h-3 w-3" /> {s.storyteller_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-black p-12 bg-gray-50 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <div className="text-lg font-bold text-gray-500 mb-2">No stories yet</div>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Stories are published through Empathy Ledger with full consent controls.
                  When a storyteller publishes and enables JusticeHub sharing, their story appears here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
