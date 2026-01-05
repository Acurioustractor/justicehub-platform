'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  summary: string;
  story_image_url: string | null;
  story_category: string | null;
  is_featured: boolean;
}

export default function EmpathyLedgerStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await fetch('/api/empathy-ledger/stories?limit=3&featured=true');
      const data = await response.json();

      if (data.success && data.stories) {
        setStories(data.stories);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h3 className="text-2xl font-bold mb-8 text-center">VOICES OF CHANGE</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="data-card animate-pulse">
              <div className="aspect-video bg-gray-200 mb-4 border-2 border-black" />
              <div className="h-6 bg-gray-200 mb-3 w-3/4" />
              <div className="h-20 bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold mb-8 text-center">VOICES OF CHANGE</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stories.map((story) => (
          <div key={story.id} className="data-card">
            <div className="aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden">
              {story.story_image_url ? (
                <img
                  src={story.story_image_url}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ochre-100 to-eucalyptus-100">
                  <span className="text-4xl">📖</span>
                </div>
              )}
            </div>
            <h4 className="text-lg font-bold mb-3 line-clamp-2">{story.title}</h4>
            <p className="text-gray-700 mb-4 line-clamp-3">
              {story.excerpt || story.summary || 'A story from our community...'}
            </p>
            {story.story_category && (
              <p className="text-sm font-bold text-gray-600 mb-2">
                — {story.story_category}
              </p>
            )}
            <Link
              href={`/stories/${story.id}`}
              className="text-sm font-bold underline mt-2 inline-block"
            >
              Read full story →
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/stories" className="cta-primary">
          READ MORE STORIES
        </Link>
      </div>
    </div>
  );
}
