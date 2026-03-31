'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Loader2,
  Image as ImageIcon,
  Video,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  MapPin,
  AlertCircle,
  ExternalLink,
  Play,
} from 'lucide-react';

interface Storyteller {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  role: string | null;
  culturalBackground: string[] | null;
  storyCount: number;
  isActive: boolean;
}

interface StorytellerMedia {
  id: string;
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  contentType: string | null;
  createdAt: string;
}

interface StorytellerStory {
  id: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  storyType: string | null;
  themes: string[] | null;
  publishedAt: string | null;
}

interface StorytellerTranscript {
  id: string;
  title: string | null;
  status: string | null;
  wordCount: number | null;
  hasVideo: boolean;
  videoUrl: string | null;
  videoPlatform: string | null;
  videoThumbnail: string | null;
  createdAt: string;
}

interface ExpandedContent {
  media: StorytellerMedia[];
  stories: StorytellerStory[];
  transcripts: StorytellerTranscript[];
  loaded: boolean;
}

export function StorytellerContentTab({ orgId }: { orgId: string }) {
  const [storytellers, setStorytellers] = useState<Storyteller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, ExpandedContent>>({});
  const [loadingContent, setLoadingContent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchStorytellers();
  }, []);

  const fetchStorytellers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/empathy-ledger/profiles?limit=100');
      if (!res.ok) throw new Error('Failed to fetch storytellers');
      const json = await res.json();

      if (json.unavailable_reason) {
        setError(`Empathy Ledger not available: ${json.unavailable_reason}`);
        return;
      }

      const mapped: Storyteller[] = (json.profiles || []).map((p: any) => ({
        id: p.id,
        displayName: p.display_name,
        bio: p.bio,
        avatarUrl: p.avatar_url || p.public_avatar_url,
        location: p.location,
        role: null,
        culturalBackground: p.cultural_background,
        storyCount: p.story_count || 0,
        isActive: p.is_active,
      }));

      setStorytellers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = useCallback(async (storytellerId: string) => {
    // Collapse if already expanded
    if (expanded[storytellerId]?.loaded) {
      setExpanded(prev => {
        const next = { ...prev };
        delete next[storytellerId];
        return next;
      });
      return;
    }

    // Load content
    setLoadingContent(prev => ({ ...prev, [storytellerId]: true }));
    try {
      const [mediaRes, storiesRes, transcriptsRes] = await Promise.all([
        fetch(`/api/empathy-ledger/media-browser?type=media&storytellerId=${storytellerId}&limit=50`),
        fetch(`/api/empathy-ledger/media-browser?type=stories&storytellerId=${storytellerId}&limit=50`),
        fetch(`/api/empathy-ledger/transcripts?storytellerId=${storytellerId}&limit=50`).catch(() => null),
      ]);

      const mediaJson = mediaRes.ok ? await mediaRes.json() : { data: [] };
      const storiesJson = storiesRes.ok ? await storiesRes.json() : { data: [] };
      let transcriptsData: any[] = [];
      if (transcriptsRes?.ok) {
        const tj = await transcriptsRes.json();
        transcriptsData = tj.transcripts || tj.data || [];
      }

      const media: StorytellerMedia[] = (mediaJson.data || []).map((m: any) => ({
        id: m.id,
        title: m.title || m.filename,
        url: m.url || m.cdn_url,
        thumbnailUrl: m.thumbnail_url || m.medium_url || m.url,
        contentType: m.content_type || m.mime_type,
        createdAt: m.created_at,
      }));

      const stories: StorytellerStory[] = (storiesJson.data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        excerpt: s.excerpt || s.summary,
        imageUrl: s.imageUrl || s.story_image_url,
        storyType: s.storyType || s.story_type,
        themes: s.themes,
        publishedAt: s.publishedAt || s.published_at,
      }));

      const transcripts: StorytellerTranscript[] = transcriptsData.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        wordCount: t.wordCount || t.word_count,
        hasVideo: t.hasVideo || Boolean(t.video_url),
        videoUrl: t.videoUrl || t.video_url,
        videoPlatform: t.videoPlatform || t.video_platform,
        videoThumbnail: t.videoThumbnail || t.video_thumbnail,
        createdAt: t.createdAt || t.created_at,
      }));

      setExpanded(prev => ({
        ...prev,
        [storytellerId]: { media, stories, transcripts, loaded: true },
      }));
    } catch (err) {
      console.error('Failed to load storyteller content:', err);
    } finally {
      setLoadingContent(prev => ({ ...prev, [storytellerId]: false }));
    }
  }, [expanded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-2 border-red-300 text-sm font-bold text-red-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (storytellers.length === 0) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-black mb-2">No storytellers found</h3>
        <p className="text-sm text-gray-600 font-medium">
          Storytellers are sourced from Empathy Ledger. Make sure the EL v2 API is configured.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5" />
        <h2 className="text-xl font-black">Storyteller Content</h2>
        <span className="text-sm text-gray-500 font-medium ml-2">
          {storytellers.length} storytellers from Empathy Ledger
        </span>
      </div>

      {storytellers.map(st => {
        const isExpanded = expanded[st.id]?.loaded;
        const isLoading = loadingContent[st.id];
        const content = expanded[st.id];

        return (
          <div key={st.id} className="bg-white border-2 border-black overflow-hidden">
            {/* Storyteller header */}
            <button
              onClick={() => toggleExpand(st.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Avatar */}
              {st.avatarUrl ? (
                <img
                  src={st.avatarUrl}
                  alt={st.displayName}
                  className="w-12 h-12 object-cover border-2 border-black flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-gray-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base truncate">{st.displayName}</h3>
                  {!st.isActive && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-600">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  {st.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {st.location}
                    </span>
                  )}
                  {st.storyCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {st.storyCount} stories
                    </span>
                  )}
                  {st.culturalBackground && st.culturalBackground.length > 0 && (
                    <span>{st.culturalBackground.join(', ')}</span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && content && (
              <div className="border-t-2 border-black p-4 bg-gray-50 space-y-4">
                {/* Bio */}
                {st.bio && (
                  <p className="text-sm text-gray-700 italic">{st.bio}</p>
                )}

                {/* Media */}
                {content.media.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black mb-2 inline-flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> Photos & Media ({content.media.length})
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {content.media.map(m => (
                        <a
                          key={m.id}
                          href={m.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square border-2 border-black overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                        >
                          {m.contentType?.startsWith('video/') ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                              {m.thumbnailUrl ? (
                                <img src={m.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : null}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={m.thumbnailUrl || m.url || ''}
                              alt={m.title || ''}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stories */}
                {content.stories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black mb-2 inline-flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Stories ({content.stories.length})
                    </h4>
                    <div className="space-y-2">
                      {content.stories.map(s => (
                        <div key={s.id} className="bg-white border border-gray-200 p-3 flex gap-3">
                          {s.imageUrl && (
                            <img src={s.imageUrl} alt="" className="w-16 h-16 object-cover border border-black flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm truncate">{s.title}</h5>
                            {s.excerpt && (
                              <p className="text-xs text-gray-600 line-clamp-2">{s.excerpt}</p>
                            )}
                            <div className="flex gap-2 mt-1">
                              {s.storyType && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 border border-gray-300">{s.storyType}</span>
                              )}
                              {s.themes?.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcripts */}
                {content.transcripts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black mb-2 inline-flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Transcripts ({content.transcripts.length})
                    </h4>
                    <div className="space-y-2">
                      {content.transcripts.map(t => (
                        <div key={t.id} className="bg-white border border-gray-200 p-3 flex items-center gap-3">
                          {t.videoThumbnail ? (
                            <img src={t.videoThumbnail} alt="" className="w-12 h-12 object-cover border border-black flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 border border-black flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-sm truncate">{t.title || 'Untitled Transcript'}</h5>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {t.wordCount && <span>{t.wordCount.toLocaleString()} words</span>}
                              {t.status && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                  t.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  {t.status}
                                </span>
                              )}
                              {t.hasVideo && t.videoPlatform && (
                                <span className="capitalize">{t.videoPlatform}</span>
                              )}
                            </div>
                          </div>
                          {t.videoUrl && (
                            <a
                              href={t.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {content.media.length === 0 && content.stories.length === 0 && content.transcripts.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No content found for this storyteller.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
