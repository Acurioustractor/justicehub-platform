import { Suspense } from 'react';
import { StoriesPageContent } from './page-content';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

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

    // Fetch blog posts
    const blogsQuery = supabase
      .from('blog_posts')
      .select(`
        *,
        public_profiles!blog_posts_author_id_fkey(full_name, slug, photo_url)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Fetch Empathy Ledger stories (only those tagged for JusticeHub display)
    // Note: We don't join storytellers table due to RLS restrictions
    const empathyLedgerQuery = empathyLedgerClient
      .from('stories')
      .select(`
        id,
        title,
        summary,
        content,
        story_image_url,
        story_type,
        themes,
        is_featured,
        justicehub_featured,
        cultural_sensitivity_level,
        published_at,
        created_at
      `)
      .eq('is_public', true)
      .eq('privacy_level', 'public')
      .eq('justicehub_featured', true)  // Only stories tagged for JusticeHub
      .order('published_at', { ascending: false });

    const [articlesResult, blogsResult, empathyLedgerResult] = await Promise.all([
      articlesQuery,
      blogsQuery,
      empathyLedgerQuery,
    ]);

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

    // Map story_type to human-readable category
    const storyTypeLabels: Record<string, string> = {
      'personal_narrative': 'Personal Story',
      'traditional_knowledge': 'Traditional Knowledge',
      'impact_story': 'Impact Story',
      'community_story': 'Community Story',
      'healing_journey': 'Healing Journey',
      'advocacy': 'Advocacy',
      'cultural_practice': 'Cultural Practice',
    };

    // Transform Empathy Ledger stories to match unified format
    const empathyLedgerStories = (empathyLedgerResult.data || []).map((story: any) => {
      return {
        id: story.id,
        title: story.title,
        slug: story.id, // Use ID as slug for EL stories
        excerpt: story.summary || (story.content ? story.content.substring(0, 200) + '...' : ''),
        category: 'voices', // New category for Empathy Ledger stories
        tags: story.themes || [],
        featured_image_url: story.story_image_url || null,
        reading_time_minutes: story.content ? Math.ceil(story.content.split(/\s+/).length / 200) : null,
        location_tags: [],
        author: null, // Storyteller data not available due to RLS
        published_at: story.published_at || story.created_at,
        status: 'published',
        content_type: 'empathy-ledger' as const,
        primary_tag: story.story_type ? storyTypeLabels[story.story_type] || story.story_type : 'Community Voice',
        // Extra fields for EL stories
        cultural_sensitivity_level: story.cultural_sensitivity_level,
        is_el_featured: story.is_featured || story.justicehub_featured,
      };
    });

    // Merge and sort by published date
    const allContent = [...articles, ...blogs, ...empathyLedgerStories].sort(
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
      if (item.category === 'voices') voicesCount++;

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
