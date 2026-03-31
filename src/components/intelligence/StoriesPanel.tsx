'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Users, ArrowRight, Loader2 } from 'lucide-react';

interface StoryItem {
  id: string;
  title: string;
  summary: string | null;
  story_image_url: string | null;
  themes: string[];
  storyteller_name: string | null;
  published_at: string | null;
  created_at: string;
  excerpt: string;
  cultural_sensitivity_level: string | null;
}

interface StoriesResponse {
  success: boolean;
  stories: StoryItem[];
  count: number;
  consent_info?: {
    is_public: boolean;
    privacy_level: string;
    description: string;
  };
  unavailable_reason?: string;
}

function formatCount(count: number): string {
  if (count === 0) return 'No stories yet';
  if (count === 1) return '1 story from community';
  return `${count} stories from community`;
}

function truncateExcerpt(text: string, maxLength = 200): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

interface StoriesPanelProps {
  /** Max stories to show in the panel grid */
  limit?: number;
  /** Whether to show the "View All" link */
  showViewAll?: boolean;
  /** Optional heading override */
  heading?: string;
}

export function StoriesPanel({
  limit = 6,
  showViewAll = true,
  heading = 'Community Voices',
}: StoriesPanelProps) {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStories() {
      try {
        setLoading(true);
        const res = await fetch(`/api/empathy-ledger/stories?limit=${limit}`);
        if (!res.ok) throw new Error(`Failed to fetch stories: ${res.status}`);

        const data: StoriesResponse = await res.json();
        if (!data.success) throw new Error('Stories API returned unsuccessful');

        setStories(data.stories || []);
        setTotalCount(data.count || 0);
        setError(null);
      } catch (err) {
        console.error('StoriesPanel fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [limit]);

  // Loading state
  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center gap-3 text-[#0A0A0A]/40">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span
            className="text-sm"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Loading community stories...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8 text-center">
        <p
          className="text-sm text-[#0A0A0A]/40"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Stories temporarily unavailable
        </p>
      </div>
    );
  }

  // Empty state
  if (stories.length === 0) {
    return (
      <div className="py-12 text-center">
        <Heart className="w-8 h-8 mx-auto mb-3 text-[#0A0A0A]/20" />
        <p className="text-[#0A0A0A]/50 text-sm">
          No community stories available yet.
        </p>
        <Link
          href="https://www.empathyledger.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-[#059669] hover:underline"
        >
          Share a story on Empathy Ledger
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-[#059669]" />
            <p
              className="text-xs uppercase tracking-[0.2em] text-[#059669]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Empathy Ledger
            </p>
          </div>
          <h2
            className="text-2xl font-bold tracking-tight text-[#0A0A0A]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {heading}
          </h2>
          <p
            className="text-sm text-[#0A0A0A]/50 mt-1"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {formatCount(totalCount)}
          </p>
        </div>

        {showViewAll && totalCount > limit && (
          <Link
            href="/intelligence/stories"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#059669] hover:text-[#059669]/80 transition-colors"
          >
            View All Stories
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Story Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stories.slice(0, limit).map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Bottom CTA */}
      {showViewAll && totalCount > limit && (
        <div className="mt-8 text-center">
          <Link
            href="/intelligence/stories"
            className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-6 py-3 text-sm font-medium hover:bg-[#0A0A0A]/90 transition-colors"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Users className="w-4 h-4" />
            View All {totalCount} Stories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StoryCard({ story }: { story: StoryItem }) {
  const displayExcerpt = story.summary || story.excerpt;

  return (
    <div className="bg-[#F5F0E8] border border-[#0A0A0A]/10 rounded-lg overflow-hidden hover:border-[#0A0A0A]/25 hover:shadow-md transition-all group">
      {/* Image */}
      {story.story_image_url && (
        <div className="relative w-full h-44 overflow-hidden bg-[#0A0A0A]/5">
          <Image
            src={story.story_image_url}
            alt={story.title || 'Community story'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Storyteller */}
        {story.storyteller_name && (
          <p
            className="text-xs text-[#059669] font-medium mb-1.5"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {story.storyteller_name}
          </p>
        )}

        {/* Title */}
        <h3
          className="font-bold text-[#0A0A0A] leading-tight mb-2 line-clamp-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {story.title || 'Untitled Story'}
        </h3>

        {/* Excerpt */}
        {displayExcerpt && (
          <p className="text-sm text-[#0A0A0A]/60 line-clamp-3 mb-3">
            {truncateExcerpt(displayExcerpt)}
          </p>
        )}

        {/* Themes */}
        {story.themes && story.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {story.themes.slice(0, 3).map((theme) => (
              <span
                key={theme}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/50"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {theme}
              </span>
            ))}
            {story.themes.length > 3 && (
              <span className="text-[10px] text-[#0A0A0A]/30 self-center">
                +{story.themes.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoriesPanel;
