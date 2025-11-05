'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { useSearchParams } from 'next/navigation';

const categories = {
  seeds: { emoji: '🌱', label: 'Seeds', color: 'bg-green-100 text-green-800' },
  growth: { emoji: '🌿', label: 'Growth', color: 'bg-emerald-100 text-emerald-800' },
  harvest: { emoji: '🌾', label: 'Harvest', color: 'bg-amber-100 text-amber-800' },
  roots: { emoji: '🌳', label: 'Roots', color: 'bg-amber-100 text-amber-900' },
};

const contentTypes = {
  'Youth Story': { emoji: '💬', color: 'bg-purple-100 text-purple-800' },
  'Editorial': { emoji: '✍️', color: 'bg-blue-100 text-blue-800' },
  'Update': { emoji: '📢', color: 'bg-green-100 text-green-800' },
  'Research': { emoji: '🔬', color: 'bg-indigo-100 text-indigo-800' },
};

type UnifiedContent = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  featured_image_url?: string;
  reading_time_minutes?: number;
  location_tags?: string[];
  author?: {
    full_name?: string;
    name?: string;
    slug: string;
    photo_url?: string;
  };
  published_at: string;
  status: string;
  content_type: 'article' | 'blog';
  primary_tag?: string;
};

export function StoriesPageContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const [content, setContent] = useState<UnifiedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    seeds: 0,
    growth: 0,
    harvest: 0,
    roots: 0,
    locations: 0,
  });

  useEffect(() => {
    async function fetchContent() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch articles (using public_profiles for author info)
      let articlesQuery = supabase
        .from('articles')
        .select(`
          *,
          public_profiles!articles_author_id_fkey (
            full_name,
            slug,
            photo_url
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (category) {
        articlesQuery = articlesQuery.eq('category', category);
      }

      // Fetch blog posts
      const blogsQuery = supabase
        .from('blog_posts')
        .select(`
          *,
          public_profiles!blog_posts_author_id_fkey(full_name, slug, photo_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const [articlesResult, blogsResult] = await Promise.all([
        articlesQuery,
        blogsQuery,
      ]);

      if (articlesResult.error) {
        console.error('Error fetching articles:', articlesResult.error);
      }
      if (blogsResult.error) {
        console.error('Error fetching blog posts:', blogsResult.error);
      }

      // Transform and merge data
      const articles = (articlesResult.data || []).map((article: any) => ({
        ...article,
        content_type: 'article' as const,
        author: article.public_profiles,
        primary_tag: article.category,
      }));

      const blogs = (blogsResult.data || []).map((blog: any) => ({
        ...blog,
        content_type: 'blog' as const,
        author: blog.public_profiles,
        primary_tag: blog.tags?.[0] || 'Editorial',
      }));

      // Merge and sort by published date
      let allContent = [...articles, ...blogs].sort(
        (a, b) =>
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );

      // Filter by content type if specified
      if (type) {
        allContent = allContent.filter((item) => {
          if (type === 'Youth Story' || type === 'Editorial' || type === 'Update' || type === 'Research') {
            return item.primary_tag === type || item.tags?.includes(type);
          }
          return true;
        });
      }

      setContent(allContent);

      // Calculate stats
      const uniqueLocations = new Set<string>();
      let seedsCount = 0;
      let growthCount = 0;
      let harvestCount = 0;
      let rootsCount = 0;

      allContent.forEach((item) => {
        // Count categories
        if (item.category === 'seeds') seedsCount++;
        if (item.category === 'growth') growthCount++;
        if (item.category === 'harvest') harvestCount++;
        if (item.category === 'roots') rootsCount++;

        // Count unique locations
        if (item.location_tags) {
          item.location_tags.forEach((loc: string) => uniqueLocations.add(loc));
        }
      });

      setStats({
        total: allContent.length,
        seeds: seedsCount,
        growth: growthCount,
        harvest: harvestCount,
        roots: rootsCount,
        locations: uniqueLocations.size,
      });

      setLoading(false);
    }

    fetchContent();
  }, [category, type]);

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen page-content">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-bold">Loading stories...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const featuredContent = content?.[0];
  const otherContent = content?.slice(1) || [];

  return (
    <>
      <Navigation />
      <main className="min-h-screen page-content">
        <div className="container-justice py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-6 !text-black">
              Stories from the Movement
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Real stories, evidence-based insights, and updates from communities transforming youth justice across Australia
            </p>
          </div>

          {/* Statistics Section */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total Stories */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-4xl font-black text-black mb-2">{stats.total}</div>
                <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Stories</div>
              </div>

              {/* Seeds */}
              <div className="bg-green-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌱</div>
                <div className="text-3xl font-black text-green-800 mb-2">{stats.seeds}</div>
                <div className="text-xs font-bold text-green-700 uppercase tracking-wide">Seeds</div>
              </div>

              {/* Growth */}
              <div className="bg-emerald-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌿</div>
                <div className="text-3xl font-black text-emerald-800 mb-2">{stats.growth}</div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Growth</div>
              </div>

              {/* Harvest */}
              <div className="bg-amber-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌾</div>
                <div className="text-3xl font-black text-amber-800 mb-2">{stats.harvest}</div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Harvest</div>
              </div>

              {/* Roots */}
              <div className="bg-amber-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌳</div>
                <div className="text-3xl font-black text-amber-900 mb-2">{stats.roots}</div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">Roots</div>
              </div>

              {/* Locations */}
              <div className="bg-blue-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">📍</div>
                <div className="text-3xl font-black text-blue-800 mb-2">{stats.locations}</div>
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">Locations</div>
              </div>
            </div>
          </div>

          {/* Content Type Filters */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/stories"
                className={`px-4 py-2 font-bold border-2 transition-all ${
                  !category && !type
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-gray-100'
                }`}
              >
                All Content
              </Link>
              {Object.entries(contentTypes).map(([key, ct]) => (
                <Link
                  key={key}
                  href={`/stories?type=${encodeURIComponent(key)}`}
                  className={`px-4 py-2 font-bold border-2 transition-all ${
                    type === key
                      ? ct.color + ' border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  {ct.emoji} {key}
                </Link>
              ))}
            </div>
          </div>

          {/* Category Filters (for articles only) */}
          {!type && (
            <div className="max-w-6xl mx-auto mb-12">
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(categories).map(([key, cat]) => (
                  <Link
                    key={key}
                    href={`/stories?category=${key}`}
                    className={`px-3 py-1.5 text-sm font-bold border transition-all rounded-full ${
                      category === key
                        ? cat.color + ' border-current'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Featured Content */}
          {featuredContent && !category && !type && (
            <div className="max-w-6xl mx-auto mb-16">
              <Link
                href={
                  featuredContent.content_type === 'blog'
                    ? `/blog/${featuredContent.slug}`
                    : `/stories/${featuredContent.slug}`
                }
                className="group block bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200 overflow-hidden no-underline"
              >
                <div className="md:flex">
                  {featuredContent.featured_image_url && (
                    <div className="md:w-1/2">
                      <img
                        src={featuredContent.featured_image_url}
                        alt={featuredContent.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={featuredContent.featured_image_url ? 'md:w-1/2 p-8' : 'w-full p-8'}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 border border-red-800 text-xs font-bold uppercase tracking-wide">
                        ⭐ Featured
                      </span>
                      {featuredContent.content_type === 'article' && featuredContent.category && (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border ${
                            categories[featuredContent.category as keyof typeof categories]?.color
                          }`}
                        >
                          {categories[featuredContent.category as keyof typeof categories]?.emoji}
                          {categories[featuredContent.category as keyof typeof categories]?.label}
                        </span>
                      )}
                      {featuredContent.content_type === 'blog' && featuredContent.tags && featuredContent.tags.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-800 text-xs font-bold">
                          {contentTypes[featuredContent.tags[0] as keyof typeof contentTypes]?.emoji || '📝'}
                          {featuredContent.tags[0]}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 group-hover:text-red-600 transition-colors no-underline">
                      {featuredContent.title}
                    </h2>
                    <p className="text-gray-700 text-lg mb-4 line-clamp-3 no-underline">
                      {featuredContent.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {featuredContent.author && (
                        <span className="font-bold">
                          By {featuredContent.author.full_name || featuredContent.author.name}
                        </span>
                      )}
                      {featuredContent.reading_time_minutes && (
                        <span>⏱️ {featuredContent.reading_time_minutes} min read</span>
                      )}
                      {featuredContent.location_tags && featuredContent.location_tags.length > 0 && (
                        <span>📍 {featuredContent.location_tags[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Content Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherContent.map((item) => (
                <Link
                  key={item.id}
                  href={
                    item.content_type === 'blog'
                      ? `/blog/${item.slug}`
                      : `/stories/${item.slug}`
                  }
                  className="group block bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 overflow-hidden no-underline"
                >
                  {item.featured_image_url && (
                    <div className="w-full h-48 border-b-2 border-black">
                      <img
                        src={item.featured_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {item.content_type === 'article' && item.category && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border ${
                            categories[item.category as keyof typeof categories]?.color
                          }`}
                        >
                          {categories[item.category as keyof typeof categories]?.emoji}
                          {categories[item.category as keyof typeof categories]?.label}
                        </span>
                      )}
                      {item.content_type === 'blog' && item.tags && item.tags.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-800 text-xs font-bold">
                          {contentTypes[item.tags[0] as keyof typeof contentTypes]?.emoji || '📝'}
                          {item.tags[0]}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black mb-2 group-hover:text-red-600 transition-colors line-clamp-2 no-underline">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3 no-underline">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {item.reading_time_minutes && (
                        <span>⏱️ {item.reading_time_minutes} min</span>
                      )}
                      {item.location_tags && item.location_tags.length > 0 && (
                        <span>📍 {item.location_tags[0]}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {content?.length === 0 && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <p className="text-xl text-gray-600">
                No content found with the selected filters.
              </p>
              <Link
                href="/stories"
                className="mt-4 inline-block px-6 py-3 bg-black text-white font-bold hover:bg-red-600 transition-colors"
              >
                ← View All Content
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
