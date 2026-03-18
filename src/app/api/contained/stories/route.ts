import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createJHClient } from '@/lib/supabase/server-lite';

export const revalidate = 300; // 5 min cache

const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';

const EL_URL = process.env.EMPATHY_LEDGER_URL;
const EL_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY || process.env.EMPATHY_LEDGER_API_KEY;

function getELClient() {
  if (!EL_URL || !EL_KEY) throw new Error('Empathy Ledger not configured');
  return createClient(EL_URL, EL_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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
 * GET /api/contained/stories?limit=20
 * Fetches stories from Empathy Ledger, scoped to the JusticeHub organisation.
 * All stories come through EL — this is the single source of truth.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limitParam = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const stories: UnifiedStory[] = [];

    // Fetch stories from EL Supabase, scoped to JusticeHub org
    try {
      const el = getELClient();

      const { data: elStories, error } = await el
        .from('stories')
        .select(`
          id, title, summary, content, story_image_url, story_type,
          is_public, is_featured, themes, tags,
          media_urls, published_at, created_at, storyteller_id
        `)
        .eq('organization_id', JH_ORG_ID)
        .eq('is_public', true)
        .eq('privacy_level', 'public')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limitParam);

      if (error) {
        console.error('EL stories fetch error:', error);
      } else if (elStories && elStories.length > 0) {
        // Fetch storyteller names
        const storytellerIds = [...new Set(elStories.map(s => s.storyteller_id).filter(Boolean))];
        let storytellerMap: Record<string, { name: string; avatar: string | null }> = {};

        if (storytellerIds.length > 0) {
          const { data: stData } = await el
            .from('storytellers')
            .select('id, display_name, public_avatar_url')
            .in('id', storytellerIds);

          for (const st of stData || []) {
            storytellerMap[st.id] = {
              name: st.display_name,
              avatar: st.public_avatar_url || null,
            };
          }
        }

        for (const s of elStories) {
          const storyteller = s.storyteller_id ? storytellerMap[s.storyteller_id] : null;
          const excerpt = s.summary || (s.content ? s.content.substring(0, 300) : '');
          const themes = (s.themes as string[]) || [];
          const tags = (s.tags as string[]) || [];

          stories.push({
            id: `el-${s.id}`,
            title: s.title || 'Untitled Story',
            excerpt,
            author_name: storyteller?.name || 'Community Voice',
            author_photo: storyteller?.avatar || null,
            category: themes[0] || s.story_type || 'community-voice',
            story_image_url: s.story_image_url || null,
            video_url: null,
            published_at: s.published_at || s.created_at || new Date().toISOString(),
            source: 'el',
            slug: null,
            is_featured: s.is_featured || false,
            series: tags.includes('SERIES') ? 'Reimagining Youth Justice' : null,
          });
        }
      }
    } catch (e) {
      console.warn('EL stories fetch failed:', e);
    }

    // Curated JusticeHub articles — hand-picked for the CONTAINED stories page
    const CURATED_ARTICLE_IDS = [
      'f5080b5c-54e9-44fe-a286-965eae087cc0', // Building Revolution in Shipping Containers: The Story of CONTAINED
      '2983163d-489b-4d16-9310-63c44d4a71b4', // Walking Toward Justice: A Personal Journey
      '5cd1c792-3ee9-4200-bf0a-4ee0b15153b9', // From Punishment to Potential: Lessons from Spain's Diagrama Model
      '13481204-165d-4e5f-9e2f-f33b78a15712', // ReSOLEution at Bimberi Youth Justice Centre
      '453e30c2-e3cd-4d7c-95f0-50ec1d4dc619', // Beyond Shadows: Plato's Cave and the Reimagining of Youth Justice
      '53a03720-c441-4c48-ba04-c41930b6098d', // From Shadows to Spotlight: Joe Kwon's Redemption and the Rise of ConFit
      '12c8e915-a10a-4057-bd1c-c3d31ccbf2dd', // Diagrama Foundation's Impact on Spain's Youth Detention System
    ];

    try {
      const supabase = await createJHClient();
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, excerpt, slug, featured_image_url, published_at, category, tags, is_contained')
        .in('id', CURATED_ARTICLE_IDS)
        .order('published_at', { ascending: false });

      if (articles) {
        for (const a of articles) {
          // Skip if we already have this title from EL (dedup)
          if (stories.some(s => s.title.toLowerCase() === a.title.toLowerCase())) continue;

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
            is_featured: a.is_contained || false,
            series: null,
          });
        }
      }
    } catch (e) {
      console.warn('JH articles fetch failed:', e);
    }

    // Sort: featured first, then by date
    stories.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return NextResponse.json(stories.slice(0, limitParam));
  } catch (error) {
    console.error('Contained stories GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
