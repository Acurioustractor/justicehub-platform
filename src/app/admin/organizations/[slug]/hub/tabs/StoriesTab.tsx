'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ExternalLink,
  Loader2,
  X,
  Sparkles,
  Copy,
  Check,
  Plus,
  Eye,
  Edit3,
  Tag,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Link2,
  Unlink,
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string | null;
  reading_time_minutes: number | null;
  featured_image_url: string | null;
  linkedPrograms?: { id: string; name: string }[];
}

interface Program {
  id: string;
  name: string;
}

interface SocialDraftResult {
  success: boolean;
  draft: string;
  sourceType: string;
  error?: string;
}

type Tone = 'warm' | 'formal' | 'youth';

export function StoriesTab({ orgId }: { orgId: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [linkingStory, setLinkingStory] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  // Social post generator state
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialStoryId, setSocialStoryId] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>('warm');
  const [customContent, setCustomContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<SocialDraftResult | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      const [storiesRes, programsRes] = await Promise.all([
        fetch(`/api/org-hub/${orgId}/stories`),
        fetch(`/api/org-hub/${orgId}/programs`),
      ]);
      if (storiesRes.ok) {
        const json = await storiesRes.json();
        setStories(json.data || []);
      }
      if (programsRes.ok) {
        const json = await programsRes.json();
        setPrograms(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleLinkProgram = async (storyId: string, programId: string) => {
    try {
      const res = await fetch(`/api/org-hub/${orgId}/programs/${programId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'story', targetId: storyId }),
      });
      if (res.ok) {
        setLinkingStory(null);
        await fetchStories();
      }
    } catch (err) {
      console.error('Failed to link program:', err);
    }
  };

  const handleUnlinkProgram = async (storyId: string, programId: string) => {
    setUnlinking(`${storyId}-${programId}`);
    try {
      const res = await fetch(`/api/org-hub/${orgId}/stories/${storyId}/unlink-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });
      if (res.ok) {
        await fetchStories();
      }
    } catch (err) {
      console.error('Failed to unlink program:', err);
    } finally {
      setUnlinking(null);
    }
  };

  // Social post generator
  const handleGenerate = async () => {
    setGenerating(true);
    setSocialError(null);
    setDraft(null);
    try {
      const body: Record<string, string> = { tone, sourceType: socialStoryId ? 'story' : 'custom' };
      if (socialStoryId) {
        body.storyId = socialStoryId;
      } else {
        body.customContent = customContent;
      }
      const res = await fetch(`/api/org-hub/${orgId}/social-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate draft');
      }
      const json = await res.json();
      setDraft(json);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCloseSocialModal = () => {
    setShowSocialModal(false);
    setDraft(null);
    setSocialError(null);
    setCustomContent('');
    setSocialStoryId(null);
    setTone('warm');
  };

  const parseDraftSections = (text: string) => {
    const sections: { label: string; content: string }[] = [];
    const patterns = [
      { label: 'Instagram', regex: /\*\*Instagram\*\*[^\n]*\n([\s\S]*?)(?=\*\*Facebook\*\*|$)/i },
      { label: 'Facebook', regex: /\*\*Facebook\*\*[^\n]*\n([\s\S]*?)(?=\*\*WhatsApp\*\*|$)/i },
      { label: 'WhatsApp', regex: /\*\*WhatsApp\*\*[^\n]*\n([\s\S]*?)$/i },
    ];
    for (const p of patterns) {
      const match = text.match(p.regex);
      if (match) sections.push({ label: p.label, content: match[1].trim() });
    }
    if (sections.length === 0 && text) sections.push({ label: 'Draft', content: text });
    return sections;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const categoryLabel = (cat: string | null) => {
    switch (cat) {
      case 'harvest': return 'Harvest';
      case 'growth': return 'Growth';
      case 'seeds': return 'Seeds';
      case 'roots': return 'Roots';
      default: return cat || 'Uncategorised';
    }
  };

  const publishedCount = stories.filter(s => s.status === 'published').length;
  const draftCount = stories.filter(s => s.status === 'draft').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-xl font-black">Stories & Content</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {stories.length} stories — {publishedCount} published, {draftCount} drafts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSocialModal(true)}
            className="px-3 py-2 text-sm font-bold border-2 border-black hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Social Post
          </button>
          <Link
            href={`/admin/stories/new?org=${orgId}`}
            className="px-3 py-2 text-sm font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Write Story
          </Link>
        </div>
      </div>

      {/* Stories list */}
      {stories.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-600">No stories yet</p>
          <p className="text-sm text-gray-500 mt-1">Write your first impact story or case study.</p>
          <Link
            href={`/admin/stories/new?org=${orgId}`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700"
          >
            <Plus className="w-4 h-4" />
            Write Story
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => {
            const isExpanded = expandedStory === story.id;
            const isLinking = linkingStory === story.id;
            const linkedProgramIds = (story.linkedPrograms || []).map(p => p.id);
            const availablePrograms = programs.filter(p => !linkedProgramIds.includes(p.id));

            return (
              <div key={story.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {/* Story header row */}
                <button
                  onClick={() => setExpandedStory(isExpanded ? null : story.id)}
                  className="w-full text-left p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  {story.featured_image_url ? (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 border border-gray-200 overflow-hidden">
                      <img src={story.featured_image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{story.title}</h3>
                        {story.excerpt && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{story.excerpt}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${statusColor(story.status)}`}>
                        {story.status}
                      </span>
                      {story.category && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-earth-100 text-earth-700 border border-earth-300">
                          {categoryLabel(story.category)}
                        </span>
                      )}
                      {story.published_at && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(story.published_at).toLocaleDateString()}
                        </span>
                      )}
                      {(story.linkedPrograms || []).length > 0 && (
                        <span className="text-[10px] text-ochre-600 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {story.linkedPrograms!.length} program{story.linkedPrograms!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {(story.tags || []).length > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {story.tags!.length}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t-2 border-black p-4 space-y-4">
                    {/* Tags */}
                    {(story.tags || []).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {story.tags!.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600">
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Programs */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Linked Programs</p>
                        {availablePrograms.length > 0 && (
                          <button
                            onClick={() => setLinkingStory(isLinking ? null : story.id)}
                            className="text-xs font-bold text-ochre-600 hover:text-ochre-800 flex items-center gap-1"
                          >
                            <Link2 className="w-3 h-3" />
                            {isLinking ? 'Cancel' : 'Link Program'}
                          </button>
                        )}
                      </div>

                      {(story.linkedPrograms || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {story.linkedPrograms!.map(prog => (
                            <span key={prog.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-ochre-50 border border-ochre-200 text-ochre-700 font-medium">
                              <Layers className="w-3 h-3" />
                              {prog.name}
                              <button
                                onClick={() => handleUnlinkProgram(story.id, prog.id)}
                                className="ml-1 hover:text-red-600"
                                title="Unlink program"
                              >
                                {unlinking === `${story.id}-${prog.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No programs linked yet</p>
                      )}

                      {/* Program picker */}
                      {isLinking && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 space-y-1">
                          <p className="text-xs font-bold text-gray-500 mb-2">Select a program to link:</p>
                          {availablePrograms.map(prog => (
                            <button
                              key={prog.id}
                              onClick={() => handleLinkProgram(story.id, prog.id)}
                              className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-ochre-50 hover:text-ochre-700 border border-transparent hover:border-ochre-200 transition-colors"
                            >
                              {prog.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Link
                        href={`/admin/stories/${story.id}`}
                        className="px-3 py-1.5 text-xs font-bold border border-black hover:bg-gray-100 inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </Link>
                      <Link
                        href={`/stories/${story.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 text-xs font-bold border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-1 text-gray-600"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Link>
                      <button
                        onClick={() => {
                          setSocialStoryId(story.id);
                          setShowSocialModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-1 text-gray-600"
                      >
                        <Sparkles className="w-3 h-3" />
                        Social Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Social Post Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b-2 border-black">
              <h3 className="text-lg font-black">Generate Social Post</h3>
              <button onClick={handleCloseSocialModal} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Source selection */}
              {socialStoryId ? (
                <div className="p-3 bg-ochre-50 border border-ochre-200">
                  <p className="text-xs font-bold text-ochre-600 uppercase tracking-wide mb-1">Generating from story</p>
                  <p className="text-sm font-bold">{stories.find(s => s.id === socialStoryId)?.title}</p>
                  <button
                    onClick={() => setSocialStoryId(null)}
                    className="text-xs text-ochre-600 hover:text-ochre-800 mt-1 font-bold"
                  >
                    Switch to custom content
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold mb-1">Custom Content</label>
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    rows={5}
                    className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none resize-none"
                    placeholder="Describe the achievement, event, or story you want to share..."
                  />
                </div>
              )}

              {/* Tone */}
              <div>
                <label className="block text-sm font-bold mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full border-2 border-black p-3 focus:ring-2 focus:ring-ochre-600 focus:outline-none"
                >
                  <option value="warm">Warm & Community-focused</option>
                  <option value="formal">Professional & Formal</option>
                  <option value="youth">Energetic & Youth-friendly</option>
                </select>
              </div>

              {/* Error */}
              {socialError && (
                <div className="p-3 bg-red-50 border-2 border-red-300 text-sm font-bold text-red-800">
                  {socialError}
                </div>
              )}

              {/* Draft Result */}
              {draft && draft.success && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700">Drafts generated</span>
                  </div>
                  {parseDraftSections(draft.draft).map((section) => (
                    <div key={section.label} className="border-2 border-black p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-black">{section.label}</h4>
                        <button
                          onClick={() => handleCopy(section.content, section.label)}
                          className="px-3 py-1 text-xs font-bold border border-black hover:bg-gray-100 inline-flex items-center gap-1"
                        >
                          {copied === section.label ? (
                            <><Check className="w-3 h-3" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {section.content}
                      </pre>
                    </div>
                  ))}
                  <button
                    onClick={() => handleCopy(draft.draft, 'all')}
                    className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100 inline-flex items-center gap-2"
                  >
                    {copied === 'all' ? (
                      <><Check className="w-4 h-4" /> Copied All</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy All Drafts</>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t-2 border-black">
              <button
                onClick={handleCloseSocialModal}
                className="px-4 py-2 font-bold border-2 border-black hover:bg-gray-100"
              >
                Close
              </button>
              {!draft && (
                <button
                  onClick={handleGenerate}
                  disabled={generating || (!socialStoryId && !customContent.trim())}
                  className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Drafts</>
                  )}
                </button>
              )}
              {draft && (
                <button
                  onClick={() => { setDraft(null); setSocialError(null); }}
                  className="px-4 py-2 font-bold bg-ochre-600 text-white hover:bg-ochre-700 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
