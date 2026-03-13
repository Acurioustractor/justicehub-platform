'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Plus, X, ChevronRight } from 'lucide-react';
import type { UnifiedStory } from '@/app/api/admin/stories/unified/route';

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  articles: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-600', label: 'Article' },
  synced_stories: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-600', label: 'EL Synced' },
  partner_stories: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-600', label: 'Partner' },
  stories: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-600', label: 'Interview' },
  tour_stories: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-600', label: 'Community' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  published: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-600' },
  draft: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-600' },
  synced: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-600' },
  linked: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-600' },
  pending: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-400' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-600' },
};

const COMMON_TAGS = [
  'contained', 'featured', 'youth-justice', 'first-nations',
  'healing', 'community', 'reform', 'incarceration',
  'family', 'education', 'mental-health', 'housing',
];

interface Props {
  stories: UnifiedStory[];
  onSelect: (story: UnifiedStory) => void;
  onRefresh: () => void;
}

function InlineTagEditor({ story, onRefresh }: { story: UnifiedStory; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentTags = [...story.themes];

  const patchTags = async (newTags: string[]) => {
    setSaving(true);
    try {
      await fetch('/api/admin/stories/unified', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tags',
          story_id: story.id,
          source_table: story.source_table,
          tags: newTags,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to update tags:', err);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || currentTags.includes(t)) return;
    patchTags([...currentTags, t]);
    setCustomTag('');
  };

  const removeTag = (tag: string) => {
    patchTags(currentTags.filter(t => t !== tag));
  };

  const availableTags = COMMON_TAGS.filter(t => !currentTags.includes(t));

  return (
    <div ref={ref} className="relative flex gap-1 flex-wrap items-center" onClick={(e) => e.stopPropagation()}>
      {currentTags.map(tag => (
        <span
          key={tag}
          className="group text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 inline-flex items-center gap-0.5 cursor-pointer hover:border-red-400 hover:bg-red-50 hover:text-red-700"
          onClick={() => removeTag(tag)}
          title={`Remove "${tag}"`}
        >
          {tag}
          <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
        </span>
      ))}
      {story.is_featured && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-500">
          featured
        </span>
      )}
      {story.el_sync_id && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-400">
          EL
        </span>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] px-1 py-0.5 border border-dashed border-gray-300 text-gray-400 hover:border-black hover:text-black"
        title="Add tag"
      >
        <Plus className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 min-w-[200px]">
          <div className="flex gap-1 mb-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTag(customTag); }}
              placeholder="Custom tag..."
              className="flex-1 text-xs px-2 py-1 border border-gray-200 focus:border-black focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => addTag(customTag)}
              disabled={!customTag.trim() || saving}
              className="text-xs font-bold px-2 py-1 bg-black text-white disabled:opacity-30"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                disabled={saving}
                className="text-[10px] font-bold px-2 py-0.5 border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black disabled:opacity-30 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StoriesTable({ stories, onSelect, onRefresh }: Props) {
  if (stories.length === 0) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
        <p className="text-xl font-bold text-gray-600 mb-4">No stories in this view</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-black bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Title</th>
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Source</th>
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Org</th>
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Author</th>
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Tags</th>
            <th className="px-4 py-3 text-left text-xs font-black text-black uppercase">Date</th>
            <th className="px-4 py-3 text-right text-xs font-black text-black uppercase w-20"></th>
          </tr>
        </thead>
        <tbody>
          {stories.map((story) => {
            const source = SOURCE_COLORS[story.source_table] || SOURCE_COLORS.articles;
            const statusStyle = STATUS_COLORS[story.status] || STATUS_COLORS.draft;

            return (
              <tr
                key={`${story.source_table}-${story.id}`}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(story)}
              >
                <td className="px-4 py-3 max-w-[280px]">
                  <div className="font-medium text-sm truncate">{story.title}</div>
                  {story.excerpt && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">{story.excerpt.substring(0, 80)}</div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${source.bg} ${source.text} ${source.border}`}>
                    {source.label.toUpperCase()}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {story.status.toUpperCase()}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">
                  {story.organization_name || <span className="text-gray-300">—</span>}
                </td>

                <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate">
                  {story.author_name || <span className="text-gray-300">—</span>}
                </td>

                <td className="px-4 py-3 max-w-[220px]">
                  <InlineTagEditor story={story} onRefresh={onRefresh} />
                </td>

                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(story.created_at).toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                  })}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {story.source_table === 'articles' && (
                      <Link
                        href={`/admin/stories/${story.id}`}
                        className="text-[10px] font-bold px-2 py-1 border border-blue-400 text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Link>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(story); }}
                      className="text-gray-400 hover:text-black"
                      title="View details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
