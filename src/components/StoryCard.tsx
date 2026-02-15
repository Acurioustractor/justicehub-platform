import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Star, ArrowRight } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  excerpt?: string;
  story_image_url?: string;
  story_category?: string;
  is_featured?: boolean;
  published_at?: string;
}

interface StoryCardProps {
  story: Story;
  showLink?: boolean;
}

export default function StoryCard({ story, showLink = true }: StoryCardProps) {
  if (!story) return null;

  // Clean up the title - remove markdown artifacts
  let displayTitle = story.title || '';
  displayTitle = displayTitle.replace(/^#+\s*/, '').trim(); // Remove leading #

  // Get excerpt - prefer the cleaned excerpt from API
  const excerpt = story.excerpt || story.summary || '';

  // Format category for display
  const categoryDisplay = story.story_category
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const cardContent = (
    <div className={`border-2 border-black bg-white overflow-hidden h-full flex flex-col transition-all hover:shadow-lg ${story.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
      {/* Hero Image */}
      {story.story_image_url ? (
        <div className="relative w-full h-52 bg-gradient-to-br from-purple-100 to-blue-100">
          <Image
            src={story.story_image_url}
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-lg text-white leading-tight drop-shadow-lg">
              {displayTitle}
            </h3>
          </div>
          {story.is_featured && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-black text-xs font-bold flex items-center gap-1">
              <Star className="h-3 w-3" />
              FEATURED
            </div>
          )}
        </div>
      ) : (
        /* No image - show colored header */
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white leading-tight">
                {displayTitle}
              </h3>
            </div>
          </div>
          {story.is_featured && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400 text-black text-xs font-bold">
                <Star className="h-3 w-3" />
                FEATURED
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category Badge */}
        {categoryDisplay && (
          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium mb-3 self-start border border-blue-200">
            {categoryDisplay}
          </span>
        )}

        {/* Excerpt */}
        {excerpt && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Link */}
        {showLink && (
          <div className="mt-auto pt-2 border-t border-gray-100">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-800">
              Read full story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Wrap entire card in link for better UX
  if (showLink) {
    return (
      <Link
        href={`/stories/empathy-ledger/${story.id}`}
        className="block group h-full no-underline"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
