'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Story } from './page';

/**
 * One story at a time. Swipe / tap-edge to advance, tap centre for the full
 * story page. Background image is the first media_url if available; falls
 * back to a black field so the quote is legible.
 *
 * The pull quote is the first paragraph or first 280 chars of summary.
 */

function quoteFromStory(s: Story): string {
  const raw = (s.summary || '').trim();
  const para = raw.split(/\n\n/)[0] || raw;
  if (para.length <= 280) return para;
  return para.slice(0, 277).trimEnd() + '…';
}

export function StorySwiper({ stories }: { stories: Story[] }) {
  const [idx, setIdx] = useState(0);
  const story = stories[idx];

  if (!story) return null;

  const image = story.media_urls && story.media_urls.length > 0 ? story.media_urls[0] : null;
  const quote = quoteFromStory(story);
  const next = () => setIdx((i) => (i + 1) % stories.length);
  const prev = () => setIdx((i) => (i - 1 + stories.length) % stories.length);

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col">
      {/* Background image */}
      {image && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end max-w-5xl mx-auto w-full px-6 sm:px-12 py-12 sm:py-16">
        <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          “{quote}”
        </blockquote>
        <p className="text-sm font-mono uppercase tracking-[0.3em] text-white/70 mb-6">
          {story.title}
          {story.region_slug && <span> · {story.region_slug.replace(/-/g, ' ')}</span>}
        </p>

        {story.full_story && (
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="hidden"
          >
            Read full story
          </Link>
        )}
      </div>

      {/* Nav: bottom bar */}
      <div className="relative z-20 bg-black/80 border-t border-stone-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prev}
            className="min-h-[56px] min-w-[120px] px-5 text-sm font-mono uppercase tracking-[0.3em] text-stone-300 border-2 border-stone-700 rounded hover:bg-stone-900"
          >
            ← Previous
          </button>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500">
            {idx + 1} of {stories.length}
          </p>
          <button
            type="button"
            onClick={next}
            className="min-h-[56px] min-w-[120px] px-5 text-sm font-mono uppercase tracking-[0.3em] text-white border-2 border-emerald-600 bg-emerald-700/30 rounded hover:bg-emerald-700/60"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
