import { Suspense } from 'react';
import { StoriesPageContent } from './page-content';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';

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

    // Temporarily local-first: keep stories list available even when Empathy Ledger env is absent.
    // Voices are still available via dedicated Empathy Ledger routes once env is configured.
    const allContent = [...articles].sort(
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
