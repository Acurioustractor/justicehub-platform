import { Suspense } from 'react';
import { StoriesPageContent } from './page-content';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { fetchSyndicatedStories, fetchContentHubArticles } from '@/lib/empathy-ledger/syndication';

export const metadata = {
  title: 'Stories from the Movement - JusticeHub',
  description: 'Real stories, evidence-based insights, and updates from communities transforming youth justice across Australia',
};

export const dynamic = 'force-dynamic';

async function getStoriesData() {
  const supabase = createServiceClient();

  try {
    // Fetch articles
    const articlesQuery = supabase
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

    const { data: articlesData, error: articlesError } = await articlesQuery;
    if (articlesError) {
      throw articlesError;
    }

    // Transform and merge data
    const articles = (articlesData || []).map((article: any) => ({
      ...article,
      content_type: 'article' as const,
      author: article.public_profiles,
      primary_tag: article.category,
    }));

    // Pull syndicated stories + articles from Empathy Ledger
    let elArticles: typeof articles = [];
    try {
      const [elStories, elContentHubArticles] = await Promise.all([
        fetchSyndicatedStories(),
        fetchContentHubArticles(),
      ]);

      // Map syndicated stories (consent-based)
      const mappedStories = elStories.map((s) => ({
        id: s.id,
        slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title: s.title,
        excerpt: s.excerpt,
        content: '',
        featured_image_url: s.imageUrl,
        featured_image_caption: null,
        published_at: s.publishedAt || s.createdAt,
        tags: s.themes || [],
        location_tags: s.location ? [s.location] : [],
        reading_time_minutes: null,
        category: null,
        view_count: 0,
        content_type: 'empathy-ledger' as const,
        author: s.storyteller ? { full_name: s.storyteller.name, slug: null, photo_url: s.storyteller.avatar } : null,
        primary_tag: 'roots',
        public_profiles: null,
      }));

      // Map Content Hub articles (public API)
      const mappedArticles = elContentHubArticles.map((a) => ({
        id: a.id,
        slug: a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title: a.title,
        excerpt: a.excerpt,
        content: '',
        featured_image_url: a.featuredImageUrl,
        featured_image_caption: a.featuredImageAlt,
        published_at: a.publishedAt,
        tags: a.tags || [],
        location_tags: [],
        reading_time_minutes: null,
        category: null,
        view_count: 0,
        content_type: 'empathy-ledger' as const,
        author: a.authorName ? { full_name: a.authorName, slug: null, photo_url: null } : null,
        primary_tag: 'growth',
        public_profiles: null,
      }));

      elArticles = [...mappedStories, ...mappedArticles];
    } catch { /* EL unavailable — continue with local only */ }

    // Merge local + EL, deduplicate by slug
    const localSlugs = new Set(articles.map((a: any) => a.slug));
    const dedupedEL = elArticles.filter((e: any) => !localSlugs.has(e.slug));
    const allContent = [...articles, ...dedupedEL].sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    // Calculate stats
    const uniqueLocations = new Set<string>();
    let seedsCount = 0;
    let growthCount = 0;
    let harvestCount = 0;
    let rootsCount = 0;
    let voicesCount = 0;

    allContent.forEach((item) => {
      if (item.category === 'seeds') seedsCount++;
      if (item.category === 'growth') growthCount++;
      if (item.category === 'harvest') harvestCount++;
      if (item.category === 'roots') rootsCount++;

      if (item.location_tags) {
        item.location_tags.forEach((loc: string) => uniqueLocations.add(loc));
      }
    });

    return {
      content: allContent,
      stats: {
        total: allContent.length,
        seeds: seedsCount,
        growth: growthCount,
        harvest: harvestCount,
        roots: rootsCount,
        voices: voicesCount,
        locations: uniqueLocations.size,
      },
    };
  } catch (error) {
    console.error('Error fetching stories data:', error);
    return {
      content: [],
      stats: {
        total: 0,
        seeds: 0,
        growth: 0,
        harvest: 0,
        roots: 0,
        voices: 0,
        locations: 0,
      },
    };
  }
}

function LoadingFallback() {
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

export default async function StoriesPage() {
  const { content, stats } = await getStoriesData();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <StoriesPageContent initialContent={content} initialStats={stats} />
    </Suspense>
  );
}
