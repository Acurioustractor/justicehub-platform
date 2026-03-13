'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Settings, Trash2, X } from 'lucide-react';

interface ProjectStory {
  id: string;
  title: string;
  summary: string;
  story_image_url: string | null;
  story_category: string;
  themes: string[];
  is_featured: boolean;
  project_slugs: string[];
}

interface StoryEditorProps {
  currentStoryIds: string[];
  onUpdate: () => void;
}

export function StoryEditor({ currentStoryIds, onUpdate }: StoryEditorProps) {
  const [open, setOpen] = useState(false);
  const [allStories, setAllStories] = useState<ProjectStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open && allStories.length === 0) {
      setLoading(true);
      fetch('/api/admin/contained/stories?source=synced')
        .then(res => res.json())
        .then(data => setAllStories(data.stories || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, allStories.length]);

  const toggleStory = async (storyId: string, isCurrentlyIncluded: boolean) => {
    setUpdating(storyId);
    try {
      const res = await fetch('/api/projects/the-contained/stories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          action: isCurrentlyIncluded ? 'remove' : 'add',
        }),
      });
      if (res.ok) {
        setAllStories(prev =>
          prev.map(s => {
            if (s.id !== storyId) return s;
            const slugs = s.project_slugs || [];
            return {
              ...s,
              project_slugs: isCurrentlyIncluded
                ? slugs.filter(sl => sl !== 'the-contained')
                : [...slugs, 'the-contained'],
            };
          })
        );
        onUpdate();
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setUpdating(null);
    }
  };

  const included = allStories.filter(s => (s.project_slugs || []).includes('the-contained'));
  const available = allStories.filter(s => !(s.project_slugs || []).includes('the-contained'));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
      >
        <Settings className="w-3.5 h-3.5" /> Manage Stories
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Manage Stories
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-white/60 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm">Loading stories...</p>
        ) : (
          <>
            {/* Currently shown */}
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4">
                Showing on Page ({included.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {included.map(story => (
                  <div key={story.id} className="bg-white/5 border border-emerald-500/30 p-4 flex gap-4">
                    {story.story_image_url && (
                      <div className="w-20 h-20 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={story.story_image_url} alt={story.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{story.title}</h4>
                      <p className="text-white/50 text-xs mt-1 line-clamp-2">{story.summary}</p>
                      {story.themes && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {story.themes.slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleStory(story.id, true)}
                      disabled={updating === story.id}
                      className="flex-shrink-0 self-start bg-red-600/80 text-white p-1.5 hover:bg-red-500 transition-colors disabled:opacity-50"
                      title="Remove from page"
                    >
                      {updating === story.id ? '...' : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available to add */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4">
                Available Stories ({available.length})
              </h3>
              {available.length === 0 ? (
                <p className="text-white/40 text-sm">All stories are already included.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {available.map(story => (
                    <div key={story.id} className="bg-white/5 border border-white/10 p-4 flex gap-4">
                      {story.story_image_url && (
                        <div className="w-20 h-20 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={story.story_image_url} alt={story.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{story.title}</h4>
                        <p className="text-white/50 text-xs mt-1 line-clamp-2">{story.summary}</p>
                        {story.themes && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {story.themes.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleStory(story.id, false)}
                        disabled={updating === story.id}
                        className="flex-shrink-0 self-start bg-emerald-600/80 text-white p-1.5 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        title="Add to page"
                      >
                        {updating === story.id ? '...' : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
