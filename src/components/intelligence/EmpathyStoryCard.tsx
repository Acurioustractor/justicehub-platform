'use client';

import * as React from 'react';
import Link from 'next/link';

export interface EmpathyStory {
  id: string;
  title: string | null;
  slug: string | null;
  summary: string | null;
  excerpt: string | null;
  story_image_url: string | null;
  themes: string[] | null;
  created_at: string | null;
}

export function EmpathyStoryCard({ story, showTheme = true }: { story: EmpathyStory, showTheme?: boolean }) {
  const quote = story.excerpt || story.summary || story.title;
  const image = story.story_image_url;

  return (
    <Link href={`/stories/empathy-ledger/${story.id}`} className="block group h-full cursor-pointer relative overflow-hidden rounded-[24px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
      {/* Background Image & Overlay */}
      {image ? (
        <div className="absolute inset-0 z-0">
          <img src={image} alt={story.title || ''} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a1a1a] to-[#0A0A0A]" />
      )}

      {/* Content wrapper with glassmorphism */}
      <div className="relative z-10 h-full flex flex-col p-6 sm:p-8">
        {/* Top badge */}
        {showTheme && story.themes && story.themes.length > 0 && (
          <div className="self-start mb-6">
            <span className="backdrop-blur-md bg-white/20 text-white/90 border border-white/20 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-medium uppercase tracking-wider shadow-sm">
              {story.themes[0]}
            </span>
          </div>
        )}

        {/* The Quote */}
        <div className="mt-auto">
          <blockquote className="mb-6 relative">
            <span className="absolute -left-6 -top-4 text-5xl text-white/20 font-serif leading-none">"</span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-serif text-white/95 leading-tight italic drop-shadow-md">
              {quote}
            </p>
          </blockquote>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
            <div className="text-sm font-medium text-white/80 line-clamp-1 flex-1 pr-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {story.title}
            </div>
            {story.created_at && (
              <div className="text-[10px] font-mono text-white/40 shrink-0 uppercase tracking-widest">
                {new Date(story.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric'})}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
