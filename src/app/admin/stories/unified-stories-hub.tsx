'use client';

import { useState, useEffect, useCallback } from 'react';
import { StoriesTable } from './stories-table';
import { StoryDetailPanel } from './story-detail-panel';
import type { UnifiedStory } from '@/app/api/admin/stories/unified/route';

type TabKey = 'all' | 'articles' | 'synced_stories' | 'partner_stories' | 'stories' | 'tour_stories';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'articles', label: 'Articles' },
  { key: 'synced_stories', label: 'EL Synced' },
  { key: 'partner_stories', label: 'Partner Stories' },
  { key: 'stories', label: 'Interviews' },
  { key: 'tour_stories', label: 'Community' },
];

export function UnifiedStoriesHub() {
  const [allStories, setAllStories] = useState<UnifiedStory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<UnifiedStory | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stories/unified');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAllStories(data.stories);
      setCounts(data.counts);
    } catch (err) {
      console.error('Error fetching unified stories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filteredStories = activeTab === 'all'
    ? allStories
    : allStories.filter(s => s.source_table === activeTab);

  const handleRefresh = () => {
    setLoading(true);
    fetchStories();
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
        <div className="animate-pulse text-lg font-bold text-gray-500">Loading stories from all sources...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b-2 border-black overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-black uppercase whitespace-nowrap transition-colors border-2 border-b-0 -mb-[2px] ${
              activeTab === tab.key
                ? 'bg-white text-black border-black'
                : 'bg-gray-100 text-gray-500 border-transparent hover:text-black hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {counts[tab.key] !== undefined && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-black text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <StoriesTable
        stories={filteredStories}
        onSelect={(story) => setSelectedStory(story)}
        onRefresh={handleRefresh}
      />

      {/* Detail Panel */}
      {selectedStory && (
        <StoryDetailPanel
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
