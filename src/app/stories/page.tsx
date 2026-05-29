import { Suspense } from 'react';
import { StoriesPageContent } from './page-content';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { fetchContentHubArticles } from '@/lib/empathy-ledger-content-hub';
import { getStories, isV2Configured, type V2Story } from '@/lib/empathy-ledger/v2-client';

type StoryContentItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  featured_image_url?: string | null;
  reading_time_minutes?: number | null;
  location_tags?: string[];
  author?: {
    full_name?: string;
    name?: string;
    slug?: string | null;
    photo_url?: string | null;
  } | null;
  published_at?: string | null;
  status?: string;
  view_count?: number;
  content_type: 'article' | 'blog' | 'empathy-ledger' | 'judges-on-country';
  detail_href?: string;
  primary_tag?: string;
};

type LocalArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  featured_image_caption: string | null;
  published_at: string | null;
  tags: string[] | null;
  location_tags: string[] | null;
  reading_time_minutes: number | null;
  category: string | null;
  view_count: number | null;
  public_profiles: {
    full_name?: string | null;
    slug?: string | null;
    photo_url?: string | null;
  } | null;
};

export const metadata = {
  title: 'Stories from the Movement - JusticeHub',
  description:
    'Real stories, evidence-based insights, and updates from communities transforming youth justice across Australia',
};

export const dynamic = 'force-dynamic';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function cleanList<T>(items: Array<T | null | undefined>) {
  return items.filter((item): item is T => Boolean(item));
}

function isPublicStoryCard(story: V2Story) {
  const title = story.title.trim().toLowerCase();
  const hasStoryBody = Boolean(story.excerpt?.trim());
  const hasImage = Boolean(story.imageUrl);
  const isTranscriptShell =
    title.includes('interview transcript') ||
    title.endsWith(' transcript') ||
    title.includes(' - interview');

  return !isTranscriptShell && (hasStoryBody || hasImage);
}

function mapLocalArticle(article: LocalArticleRow): StoryContentItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || '',
    featured_image_url: article.featured_image_url,
    reading_time_minutes: article.reading_time_minutes,
    location_tags: cleanList(article.location_tags || []),
    tags: cleanList(article.tags || []),
    published_at: article.published_at,
    category: article.category || undefined,
    view_count: article.view_count || 0,
    content_type: 'article',
    detail_href: `/stories/${article.slug}`,
    author: article.public_profiles
      ? {
          full_name: article.public_profiles.full_name || undefined,
          slug: article.public_profiles.slug || null,
          photo_url: article.public_profiles.photo_url || null,
        }
      : null,
    primary_tag: article.category || undefined,
  };
}

function mapV2Story(story: V2Story): StoryContentItem {
  return {
    id: story.id,
    slug: `empathy-ledger/${story.id}`,
    title: story.title,
    excerpt: story.excerpt || '',
    featured_image_url: story.imageUrl,
    published_at: story.publishedAt || story.createdAt,
    tags: cleanList(story.themes || []),
    location_tags: cleanList([story.storyteller?.culturalBackground?.[0] || null]),
    reading_time_minutes: null,
    category: 'voices',
    view_count: 0,
    content_type: 'empathy-ledger',
    detail_href: `/stories/empathy-ledger/${story.id}`,
    author: story.storyteller
      ? {
          full_name: story.storyteller.displayName,
          slug: story.storyteller.id,
          photo_url: story.storyteller.avatarUrl,
        }
      : null,
    primary_tag: 'voices',
  };
}

function calculateStats(allContent: StoryContentItem[]) {
  const uniqueLocations = new Set<string>();
  let seedsCount = 0;
  let growthCount = 0;
  let harvestCount = 0;
  let rootsCount = 0;
  let voicesCount = 0;

  allContent.forEach((item) => {
    const category = item.category || item.primary_tag;

    if (category === 'seeds') seedsCount++;
    if (category === 'growth') growthCount++;
    if (category === 'harvest') harvestCount++;
    if (category === 'roots') rootsCount++;
    if (
      category === 'voices' ||
      item.content_type === 'empathy-ledger' ||
      item.content_type === 'judges-on-country'
    ) {
      voicesCount++;
    }

    item.location_tags?.forEach((loc: string) => uniqueLocations.add(loc));
  });

  return {
    total: allContent.length,
    seeds: seedsCount,
    growth: growthCount,
    harvest: harvestCount,
    roots: rootsCount,
    voices: voicesCount,
    locations: uniqueLocations.size,
  };
}

async function getStoriesData() {
  const supabase = createServiceClient();

  try {
    const localArticlesQuery = supabase
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

    const [localArticlesResult, storiesResult, elContentHubArticles] = await Promise.all([
      localArticlesQuery,
      isV2Configured
        ? getStories({ limit: 100 }).catch((error) => {
            console.error('Error fetching Empathy Ledger v2 stories:', error);
            return { data: [] };
          })
        : Promise.resolve({ data: [] }),
      fetchContentHubArticles({ project: 'justicehub', limit: 100 }),
    ]);

    if (localArticlesResult.error) {
      throw localArticlesResult.error;
    }

    const localArticles = ((localArticlesResult.data || []) as LocalArticleRow[]).map(mapLocalArticle);
    const v2Stories = storiesResult.data.filter(isPublicStoryCard).map(mapV2Story);
    const knownTitles = new Set(
      [...localArticles, ...v2Stories].map((item) => item.title.toLowerCase())
    );
    const knownSlugs = new Set(localArticles.map((item) => item.slug));

    const contentHubArticles = elContentHubArticles
      .filter((article) => !knownTitles.has(article.title.toLowerCase()))
      .map((article): StoryContentItem => {
        const slug = article.slug || slugify(article.title);
        return {
          id: article.id,
          slug,
          title: article.title,
          excerpt: article.excerpt || '',
          featured_image_url: article.featuredImageUrl,
          published_at: article.publishedAt,
          tags: cleanList([...(article.tags || []), ...(article.themes || [])]),
          location_tags: [],
          reading_time_minutes: null,
          category: 'voices',
          view_count: 0,
          content_type: 'empathy-ledger',
          detail_href: `/stories/${slug}`,
          author: article.authorName
            ? { full_name: article.authorName, slug: null, photo_url: null }
            : null,
          primary_tag: 'voices',
        };
      })
      .filter((article) => !knownSlugs.has(article.slug));

    const allContent = [...localArticles, ...v2Stories, ...contentHubArticles].sort(
      (a, b) =>
        new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
    );

    return {
      content: allContent,
      stats: calculateStats(allContent),
    };
  } catch (error) {
    console.error('Error fetching stories data:', error);

    return {
      content: [],
      stats: calculateStats([]),
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

export default async function StoriesPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const { content, stats } = await getStoriesData();
  const activeCategory = searchParams?.category || null;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <StoriesPageContent
        initialContent={content}
        initialStats={stats}
        activeCategory={activeCategory}
      />
    </Suspense>
  );
}
