import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * GET /api/cron/campaign/linkedin-monitor
 * Weekly cron: triggers re-scrape of active tracked posts.
 * The actual scraping is done via the CLI script — this endpoint
 * records the intent and can be extended to invoke the scraper.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // Get active tracked posts
    const { data: posts, error } = await supabase
      .from('campaign_tracked_posts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'No active tracked posts' });
    }

    // For now, log the posts that need re-scraping
    // Full automation would invoke the scraper script
    const stale = posts.filter(p => {
      if (!p.last_scraped_at) return true;
      const daysSince = (Date.now() - new Date(p.last_scraped_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    });

    return NextResponse.json({
      message: `${stale.length} posts need re-scraping`,
      total_tracked: posts.length,
      stale_posts: stale.map(p => ({
        url: p.post_url,
        last_scraped: p.last_scraped_at,
        comments: p.total_comments,
      })),
    });
  } catch (err) {
    console.error('LinkedIn monitor cron error:', err);
    return NextResponse.json({ error: 'Monitor failed' }, { status: 500 });
  }
}
