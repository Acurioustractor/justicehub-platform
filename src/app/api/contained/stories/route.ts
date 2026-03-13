import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

export const revalidate = 300; // 5 min cache

interface UnifiedStory {
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

/**
 * GET /api/contained/stories
 * Merges stories from 3 sources:
 * 1. synced_stories (Empathy Ledger stories)
 * 2. articles (published, is_contained = true)
 * 3. tour_stories (approved community submissions)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const stories: UnifiedStory[] = [];

    // 1. Synced EL stories — use actual schema columns
    const { data: elStories } = await supabase
      .from('synced_stories')
      .select('id, title, summary, story_image_url, is_featured, source_published_at, themes, project_slugs')
      .order('is_featured', { ascending: false })
      .order('source_published_at', { ascending: false })
      .limit(20);

    if (elStories) {
      for (const s of elStories) {
        // Include if tagged with the-contained OR is featured
        const projectSlugs = (s.project_slugs as string[]) || [];
        const isContained = projectSlugs.includes('the-contained');
        if (!isContained && !s.is_featured) continue;

        stories.push({
          id: `el-${s.id}`,
          title: s.title || 'Untitled Story',
          excerpt: s.summary || '',
          author_name: 'Community Voice',
          author_photo: null,
          category: 'community-voice',
          story_image_url: s.story_image_url || null,
          video_url: null,
          published_at: s.source_published_at || new Date().toISOString(),
          source: 'el',
          slug: null,
          is_featured: s.is_featured || false,
          series: null,
        });
      }
    }

    // 2. Articles — use is_contained flag
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, excerpt, slug, featured_image_url, published_at, category, tags')
      .eq('status', 'published')
      .eq('is_contained', true)
      .order('published_at', { ascending: false })
      .limit(30);

    if (articles) {
      for (const a of articles) {
        stories.push({
          id: `article-${a.id}`,
          title: a.title,
          excerpt: a.excerpt || '',
          author_name: 'JusticeHub',
          author_photo: null,
          category: a.category || 'analysis',
          story_image_url: a.featured_image_url || null,
          video_url: null,
          published_at: a.published_at || new Date().toISOString(),
          source: 'article',
          slug: a.slug || null,
          is_featured: ((a.tags as string[]) || []).some((t: string) => t.toUpperCase() === 'CONTAINED'),
          series: null,
        });
      }
    }

    // 3. Tour stories (community submissions) — use actual schema
    const { data: tourStories } = await supabase
      .from('tour_stories')
      .select('id, name, tour_stop, story, status, is_public, created_at')
      .eq('status', 'approved')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (tourStories) {
      for (const t of tourStories) {
        stories.push({
          id: `tour-${t.id}`,
          title: `Tour Story — ${t.tour_stop || 'Community'}`,
          excerpt: (t.story || '').substring(0, 300),
          author_name: t.name || 'Anonymous',
          author_photo: null,
          category: 'tour-submission',
          story_image_url: null,
          video_url: null,
          published_at: t.created_at || new Date().toISOString(),
          source: 'tour',
          slug: null,
          is_featured: false,
          series: null,
        });
      }
    }

    // Sort: featured first, then by date
    stories.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Contained stories GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
