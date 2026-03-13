'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Play, Users, Video } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  author_name: string;
  author_photo: string | null;
  category: string;
  story_image_url: string | null;
  video_url: string | null;
  published_at: string;
  source: 'el' | 'article' | 'tour';
  slug: string | null;
  is_featured: boolean;
  series: string | null;
}

const sourceLabels: Record<string, { label: string; color: string }> = {
  el: { label: 'Community Voice', color: 'bg-purple-100 text-purple-800 border-purple-800' },
  article: { label: 'Article', color: 'bg-blue-100 text-blue-800 border-blue-800' },
  tour: { label: 'Tour Story', color: 'bg-red-100 text-red-800 border-red-800' },
};

const DESCRIPT_VIDEOS = [
  {
    id: 'oYopJZ1SKzg',
    title: 'From Personal Struggles to Professional Passion',
    description: 'A journey from lived experience to leading change in youth justice.',
    view_url: 'https://share.descript.com/view/oYopJZ1SKzg',
  },
  {
    id: 'Ko8sRLTLee1',
    title: 'Blurring the Lines Between Staff and Residents',
    description: 'How therapeutic models break down barriers between workers and young people.',
    view_url: 'https://share.descript.com/view/Ko8sRLTLee1',
  },
  {
    id: 'mlKNz3wLtdC',
    title: 'Breaking Stigmas: People Are Good at Heart',
    description: 'Challenging assumptions about young people in the justice system.',
    view_url: 'https://share.descript.com/view/mlKNz3wLtdC',
  },
];

function StoryCard({ story }: { story: Story }) {
  const sourceConfig = sourceLabels[story.source] || sourceLabels.el;
  const href = story.source === 'article' && story.slug
    ? `/stories/${story.slug}`
    : story.source === 'el' && story.slug
    ? `/stories/empathy-ledger/${story.slug}`
    : null;

  const card = (
    <div className="group bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 overflow-hidden h-full flex flex-col">
      {story.story_image_url && (
        <div className="relative w-full h-48 border-b-2 border-black">
          <Image
            src={story.story_image_url}
            alt={story.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {story.video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-12 h-12 text-white fill-white/80" />
            </div>
          )}
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold border ${sourceConfig.color}`}>
            {sourceConfig.label}
          </span>
          {story.is_featured && (
            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 border border-red-800 text-xs font-bold">
              Featured
            </span>
          )}
          {story.series && (
            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 border border-amber-800 text-xs font-bold">
              {story.series}
            </span>
          )}
        </div>
        <h3 className="text-xl font-black mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
          {story.title}
        </h3>
        <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-1">
          {story.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {story.author_photo && (
            <Image
              src={story.author_photo}
              alt={story.author_name}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="font-bold">{story.author_name}</span>
          <span>{new Date(story.published_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {card}
      </Link>
    );
  }
  return card;
}

export function ContainedStoriesContent() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'el' | 'article' | 'tour'>('all');
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    fetch('/api/contained/stories')
      .then(res => res.json())
      .then((data: Story[]) => {
        if (Array.isArray(data)) setStories(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Rotate hero quote every 8s
  const featuredStories = useMemo(() => stories.filter(s => s.is_featured), [stories]);
  useEffect(() => {
    if (featuredStories.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(i => (i + 1) % featuredStories.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredStories.length]);

  const filtered = useMemo(() => {
    if (filter === 'all') return stories;
    return stories.filter(s => s.source === filter);
  }, [stories, filter]);

  const seriesArticles = useMemo(() =>
    stories.filter(s => s.series === 'Reimagining Youth Justice'),
  [stories]);

  const tourStoryList = useMemo(() =>
    stories.filter(s => s.source === 'tour'),
  [stories]);

  const heroStory = featuredStories[heroIndex];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Breadcrumb */}
        <div className="container-justice mb-6">
          <Link
            href="/contained/tour"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tour
          </Link>
        </div>

        {/* Hero Quote */}
        {heroStory && (
          <section className="bg-black text-white py-20 mb-16">
            <div className="container-justice max-w-4xl mx-auto text-center">
              <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-8">
                Real Stories
              </div>
              <blockquote className="text-2xl md:text-4xl font-black leading-tight mb-8 transition-opacity duration-500">
                &ldquo;{heroStory.excerpt.length > 200 ? heroStory.excerpt.substring(0, 200) + '...' : heroStory.excerpt}&rdquo;
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                {heroStory.author_photo && (
                  <Image
                    src={heroStory.author_photo}
                    alt={heroStory.author_name}
                    width={48}
                    height={48}
                    className="rounded-full border-2 border-red-600"
                  />
                )}
                <div>
                  <div className="font-bold text-lg">{heroStory.author_name}</div>
                  <div className="text-gray-400 text-sm">Community Voice</div>
                </div>
              </div>
              {featuredStories.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  {featuredStories.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === heroIndex ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats Bar */}
        <section className="container-justice mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Community Voices', value: stories.filter(s => s.source === 'el').length },
              { icon: BookOpen, label: 'Articles', value: stories.filter(s => s.source === 'article').length },
              { icon: Video, label: 'Video Stories', value: stories.filter(s => s.video_url).length },
              { icon: Users, label: 'Tour Stories', value: tourStoryList.length },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 border-2 border-black p-4 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="container-justice mb-8">
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'All Stories'],
              ['el', 'Community Voices'],
              ['article', 'Articles'],
              ['tour', 'Tour Stories'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-sm font-bold border-2 transition-colors ${
                  filter === key
                    ? 'bg-black text-white border-black'
                    : 'border-gray-300 hover:border-black'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Stories Grid */}
        {filter === 'all' && featuredStories.length > 0 && (
          <section className="container-justice mb-16">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-red-600 inline-block" />
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStories.slice(0, 6).map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {/* The Series — Reimagining Youth Justice */}
        {filter === 'all' && seriesArticles.length > 0 && (
          <section className="bg-gray-50 border-t-2 border-b-2 border-black py-12 mb-16">
            <div className="container-justice">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2">
                <span className="w-8 h-1 bg-red-600 inline-block" />
                The Series: Reimagining Youth Justice
              </h2>
              <p className="text-gray-600 mb-6">A deep investigation into what&apos;s broken and what&apos;s possible.</p>
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
                {seriesArticles.map((article, i) => (
                  <div key={article.id} className="min-w-[300px] max-w-[300px] snap-start flex-shrink-0">
                    <Link
                      href={article.slug ? `/stories/${article.slug}` : '#'}
                      className="block no-underline"
                    >
                      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 overflow-hidden h-full">
                        {article.story_image_url && (
                          <div className="relative w-full h-40 border-b-2 border-black">
                            <Image
                              src={article.story_image_url}
                              alt={article.title}
                              fill
                              className="object-cover"
                              sizes="300px"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
                            Part {i + 1}
                          </div>
                          <h3 className="text-lg font-black mb-2 line-clamp-2">{article.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Filtered Stories Grid */}
        <section className="container-justice mb-16">
          {filter !== 'all' && (
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
              {filter === 'el' ? 'Community Voices' : filter === 'article' ? 'Articles' : 'Tour Stories'}
            </h2>
          )}
          {filter === 'all' && (
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-red-600 inline-block" />
              All Stories
            </h2>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 border-2 border-gray-200 h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filter === 'all' ? filtered.filter(s => !s.is_featured) : filtered).map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg mb-4">No stories yet in this category.</p>
              <Link
                href="/contained/tour#submit-story"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-red-600 transition-colors"
              >
                Submit Your Story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Community Voices — call to submit */}
        <section className="bg-black text-white py-16 mb-16">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Share Your Story
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Have you been affected by the youth justice system? Your story matters.
              Every voice strengthens the case for change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contained/tour#submit-story"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                Submit Your Story <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contained/act"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Take Action <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Video Testimonials */}
        <section className="container-justice mb-16">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
            <span className="w-8 h-1 bg-red-600 inline-block" />
            Video Testimonials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DESCRIPT_VIDEOS.map(video => (
              <div key={video.id} className="border-2 border-black bg-white">
                <div className="aspect-video border-b-2 border-black bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-3">
                    Video Testimonial
                  </div>
                  <div className="text-lg font-black leading-tight max-w-xs">
                    {video.title}
                  </div>
                  <div className="text-sm text-gray-400 mt-3">
                    Watch on Descript
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-lg mb-1">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{video.description}</p>
                  <a
                    href={video.view_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors text-sm"
                  >
                    Watch Video <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
