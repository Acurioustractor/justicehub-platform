import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const type = searchParams.get('type');

  try {
    // Fetch articles
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

    // Calculate stats
    const uniqueLocations = new Set<string>();
    let seedsCount = 0;
    let growthCount = 0;
    let harvestCount = 0;
    let rootsCount = 0;

    allContent.forEach((item) => {
      if (item.category === 'seeds') seedsCount++;
      if (item.category === 'growth') growthCount++;
      if (item.category === 'harvest') harvestCount++;
      if (item.category === 'roots') rootsCount++;

      if (item.location_tags) {
        item.location_tags.forEach((loc: string) => uniqueLocations.add(loc));
      }
    });

    return NextResponse.json({
      success: true,
      content: allContent,
      stats: {
        total: allContent.length,
        seeds: seedsCount,
        growth: growthCount,
        harvest: harvestCount,
        roots: rootsCount,
        locations: uniqueLocations.size,
      },
    });
  } catch (error: any) {
    console.error('Stories API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
