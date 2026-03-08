'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import {
  ArrowLeft,
  Film,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Star,
  Trash2,
  Loader2,
  ExternalLink,
  X,
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_id: string;
  thumbnail_url: string;
  platform: string;
  is_featured: boolean;
  created_at: string;
}

interface Photo {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  thumbnail_url: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

interface Story {
  id: string;
  empathy_ledger_id: string;
  title: string;
  summary: string;
  story_image_url: string;
  themes: string[];
  is_featured: boolean;
  project_slugs: string[];
}

type Tab = 'videos' | 'photos' | 'stories';

export default function AdminProjectMediaPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('videos');
  const [project, setProject] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStoryBrowser, setShowStoryBrowser] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'video' | 'photo'>('video');
  const [saving, setSaving] = useState(false);

  // Fetch project info by ID, then fetch media by slug
  useEffect(() => {
    async function fetchProject() {
      const res = await fetch(`/api/admin/art-innovation/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setProject(data);
    }
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (!project?.slug) return;

    async function fetchMedia() {
      setLoading(true);
      try {
        const [mediaRes, storiesRes] = await Promise.all([
          fetch(`/api/projects/${project!.slug}/media`),
          fetch(`/api/projects/${project!.slug}/stories`),
        ]);

        if (mediaRes.ok) {
          const data = await mediaRes.json();
          setVideos(data.videos || []);
          setPhotos(data.photos || []);
        }
        if (storiesRes.ok) {
          const data = await storiesRes.json();
          setStories(data.stories || []);
        }
      } catch (err) {
        console.error('Failed to fetch media:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [project?.slug]);

  const handleAdd = async () => {
    if (!addUrl || !project?.slug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.slug}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addType, url: addUrl, title: addTitle || undefined }),
      });
      if (res.ok) {
        const item = await res.json();
        if (addType === 'video') setVideos((prev) => [item, ...prev]);
        else setPhotos((prev) => [item, ...prev]);
        setAddUrl('');
        setAddTitle('');
        setShowAddModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSetFeatured = async (itemId: string, type: 'video' | 'photo') => {
    if (!project?.slug) return;
    const res = await fetch(`/api/projects/${project.slug}/media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, type, is_featured: true }),
    });
    if (res.ok) {
      if (type === 'video') {
        setVideos((prev) =>
          prev.map((v) => ({ ...v, is_featured: v.id === itemId }))
        );
      } else {
        setPhotos((prev) =>
          prev.map((p) => ({ ...p, is_featured: p.id === itemId }))
        );
      }
    }
  };

  const handleDelete = async (itemId: string, type: 'video' | 'photo') => {
    if (!project?.slug || !confirm('Delete this media item?')) return;
    const res = await fetch(`/api/projects/${project.slug}/media`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, type }),
    });
    if (res.ok) {
      if (type === 'video') setVideos((prev) => prev.filter((v) => v.id !== itemId));
      else setPhotos((prev) => prev.filter((p) => p.id !== itemId));
    }
  };

  const handleToggleStoryTag = async (storyId: string, isTagged: boolean) => {
    if (!project?.slug) return;
    const res = await fetch(`/api/projects/${project.slug}/stories`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, action: isTagged ? 'remove' : 'add' }),
    });
    if (res.ok) {
      if (!isTagged) {
        // Re-fetch tagged stories
        const storiesRes = await fetch(`/api/projects/${project.slug}/stories`);
        if (storiesRes.ok) {
          const data = await storiesRes.json();
          setStories(data.stories || []);
        }
      } else {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      }
      // Update allStories state
      setAllStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? {
                ...s,
                project_slugs: isTagged
                  ? s.project_slugs.filter((slug) => slug !== project.slug)
                  : [...(s.project_slugs || []), project.slug],
              }
            : s
        )
      );
    }
  };

  const fetchAllStories = async () => {
    setShowStoryBrowser(true);
    if (allStories.length > 0) return;
    const res = await fetch('/api/synced-stories?limit=100');
    if (res.ok) {
      const data = await res.json();
      setAllStories(data.stories || data || []);
    }
  };

  const heroVideo = videos.find((v) => v.is_featured);

  const platformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      youtube: 'bg-red-100 text-red-700 border-red-300',
      vimeo: 'bg-blue-100 text-blue-700 border-blue-300',
      descript: 'bg-purple-100 text-purple-700 border-purple-300',
      other: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return (
      <span className={`text-xs font-bold px-2 py-0.5 border ${colors[platform] || colors.other}`}>
        {platform.toUpperCase()}
      </span>
    );
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 page-content">
        <Navigation />
        <div className="pt-8 pb-16 container-justice">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/art-innovation"
              className="text-sm text-gray-600 hover:text-black mb-2 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Art & Innovation
            </Link>
            <h1 className="text-4xl font-black text-black mb-2">
              Media — {project.title}
            </h1>
            <p className="text-lg text-gray-600">
              Manage videos, photos, and tagged stories
            </p>
          </div>

          {/* Hero Video Preview */}
          {heroVideo && (
            <div className="mb-8 bg-black text-white border-2 border-black p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                Hero Video
              </div>
              <div className="flex items-start gap-4">
                {heroVideo.thumbnail_url && (
                  <img
                    src={heroVideo.thumbnail_url}
                    alt={heroVideo.title || 'Hero video'}
                    className="w-48 h-28 object-cover border border-white/20"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg">{heroVideo.title || 'Untitled'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {platformBadge(heroVideo.platform)}
                    <a
                      href={heroVideo.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 border-b-2 border-black mb-6">
            {([
              { key: 'videos' as Tab, label: 'Videos', icon: Film, count: videos.length },
              { key: 'photos' as Tab, label: 'Photos', icon: ImageIcon, count: photos.length },
              { key: 'stories' as Tab, label: 'Tagged Stories', icon: BookOpen, count: stories.length },
            ]).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-widest border-2 border-b-0 -mb-[2px] transition-colors ${
                  tab === key
                    ? 'bg-white text-black border-black'
                    : 'bg-gray-100 text-gray-500 border-transparent hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Videos Tab */}
              {tab === 'videos' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => {
                        setAddType('video');
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4" /> Add Video
                    </button>
                  </div>

                  {videos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No videos yet. Add one to get started.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos.map((video) => (
                        <div key={video.id} className="bg-white border-2 border-black">
                          <div className="aspect-video bg-gray-100 relative">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Film className="w-12 h-12" />
                              </div>
                            )}
                            {video.is_featured && (
                              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 flex items-center gap-1">
                                <Star className="w-3 h-3" /> HERO
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold truncate">{video.title || 'Untitled'}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              {platformBadge(video.platform)}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              {!video.is_featured && (
                                <button
                                  onClick={() => handleSetFeatured(video.id, 'video')}
                                  className="text-xs font-bold text-yellow-600 hover:text-yellow-800 flex items-center gap-1"
                                >
                                  <Star className="w-3 h-3" /> Set as Hero
                                </button>
                              )}
                              <a
                                href={video.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> Open
                              </a>
                              <button
                                onClick={() => handleDelete(video.id, 'video')}
                                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 ml-auto"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {tab === 'photos' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => {
                        setAddType('photo');
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4" /> Add Photo
                    </button>
                  </div>

                  {photos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No photos yet. Add one to get started.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="bg-white border-2 border-black">
                          <div className="aspect-square bg-gray-100 relative">
                            <img
                              src={photo.thumbnail_url || photo.photo_url}
                              alt={photo.title || ''}
                              className="w-full h-full object-cover"
                            />
                            {photo.is_featured && (
                              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1">
                                FEATURED
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-bold text-sm truncate">
                              {photo.title || 'Untitled'}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleDelete(photo.id, 'photo')}
                                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stories Tab */}
              {tab === 'stories' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={fetchAllStories}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4" /> Tag Stories
                    </button>
                  </div>

                  {stories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No stories tagged yet. Browse synced stories to tag them.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stories.map((story) => (
                        <div
                          key={story.id}
                          className="bg-white border-2 border-black p-4 flex items-start gap-4"
                        >
                          {story.story_image_url && (
                            <img
                              src={story.story_image_url}
                              alt={story.title}
                              className="w-20 h-20 object-cover border border-gray-200 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold">{story.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {story.summary}
                            </p>
                            {story.themes && story.themes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {story.themes.slice(0, 5).map((theme) => (
                                  <span
                                    key={theme}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 border border-gray-200"
                                  >
                                    {theme}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggleStoryTag(story.id, true)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Add Media Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b-2 border-black">
                  <h3 className="font-black text-lg">
                    Add {addType === 'video' ? 'Video' : 'Photo'}
                  </h3>
                  <button onClick={() => setShowAddModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">URL</label>
                    <input
                      type="url"
                      value={addUrl}
                      onChange={(e) => setAddUrl(e.target.value)}
                      placeholder={
                        addType === 'video'
                          ? 'YouTube, Vimeo, or Descript URL'
                          : 'Image URL'
                      }
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!addUrl || saving}
                    className="w-full px-4 py-3 bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : `Add ${addType === 'video' ? 'Video' : 'Photo'}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Story Browser Modal */}
          {showStoryBrowser && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b-2 border-black">
                  <h3 className="font-black text-lg">Tag Stories</h3>
                  <button onClick={() => setShowStoryBrowser(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {allStories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading stories...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allStories.map((story) => {
                        const isTagged = (story.project_slugs || []).includes(
                          project?.slug || ''
                        );
                        return (
                          <div
                            key={story.id}
                            className={`p-3 border-2 flex items-center gap-3 ${
                              isTagged ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate">
                                {story.title}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">
                                {story.summary}
                              </p>
                            </div>
                            <button
                              onClick={() => handleToggleStoryTag(story.id, isTagged)}
                              className={`text-xs font-bold px-3 py-1 border-2 ${
                                isTagged
                                  ? 'border-red-500 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {isTagged ? 'Remove' : 'Tag'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
