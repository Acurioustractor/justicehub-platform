import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  // Auth check with user client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Use service client for data queries (bypasses RLS)
  const service = createServiceClient();

  // Fetch entities, filter for LinkedIn engagement client-side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allEntities } = await (service as any)
    .from('campaign_alignment_entities')
    .select('name, organization, composite_score, alignment_category, campaign_list, outreach_status, alignment_signals, warm_paths, entity_type')
    .order('composite_score', { ascending: false })
    .limit(5000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedinEngaged = (allEntities || []).filter((e: any) => {
    const signals = e.alignment_signals;
    if (!signals) return false;
    if (typeof signals === 'string') return signals.includes('linkedin');
    if (Array.isArray(signals)) return signals.some((s: { type?: string }) => s.type?.includes('linkedin'));
    return JSON.stringify(signals).includes('linkedin');
  });

  // Build breakdowns
  const categoryBreakdown: Record<string, number> = {};
  const listBreakdown: Record<string, number> = {};
  const outreachBreakdown: Record<string, number> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkedinEngaged.forEach((e: any) => {
    const cat = e.alignment_category || 'unknown';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    const list = e.campaign_list || 'unassigned';
    listBreakdown[list] = (listBreakdown[list] || 0) + 1;
    const status = e.outreach_status || 'pending';
    outreachBreakdown[status] = (outreachBreakdown[status] || 0) + 1;
  });

  // Total entities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalEntities } = await (service as any)
    .from('campaign_alignment_entities')
    .select('*', { count: 'exact', head: true });

  // CONTAINED articles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: topArticles } = await (service as any)
    .from('articles')
    .select('title, slug, view_count, share_count, is_contained')
    .eq('is_contained', true)
    .order('view_count', { ascending: false })
    .limit(15);

  // ALL articles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allArticles } = await (service as any)
    .from('articles')
    .select('title, slug, view_count, share_count, category, is_contained')
    .order('view_count', { ascending: false })
    .limit(30);

  // Page views from tracking table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pageViews } = await (service as any)
    .from('page_views')
    .select('path, referrer, utm_source, utm_medium, utm_campaign, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  // Aggregate page views
  const pathCounts: Record<string, number> = {};
  const referrerCounts: Record<string, number> = {};
  const utmCampaignCounts: Record<string, number> = {};
  let todayViews = 0;
  let weekViews = 0;
  const now = Date.now();
  const dayMs = 86400000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pageViews || []).forEach((pv: any) => {
    const path = pv.path || '/';
    pathCounts[path] = (pathCounts[path] || 0) + 1;

    if (pv.referrer) {
      try {
        const host = new URL(pv.referrer).hostname;
        referrerCounts[host] = (referrerCounts[host] || 0) + 1;
      } catch {
        referrerCounts[pv.referrer] = (referrerCounts[pv.referrer] || 0) + 1;
      }
    }

    if (pv.utm_campaign) {
      utmCampaignCounts[pv.utm_campaign] = (utmCampaignCounts[pv.utm_campaign] || 0) + 1;
    }

    const age = now - new Date(pv.created_at).getTime();
    if (age < dayMs) todayViews++;
    if (age < 7 * dayMs) weekViews++;
  });

  // Sort path counts
  const topPages = Object.entries(pathCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([path, views]) => ({ path, views }));

  const topReferrers = Object.entries(referrerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([referrer, views]) => ({ referrer, views }));

  const campaigns = Object.entries(utmCampaignCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([campaign, views]) => ({ campaign, views }));

  // Site stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalViews = (allArticles || []).reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalShares = (allArticles || []).reduce((sum: number, a: any) => sum + (a.share_count || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containedViews = (allArticles || []).filter((a: any) => a.is_contained).reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);

  const { count: totalArticleCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    summary: {
      total_entities: totalEntities || 0,
      linkedin_engaged: linkedinEngaged.length,
      outreach_breakdown: outreachBreakdown,
      category_breakdown: categoryBreakdown,
      list_breakdown: listBreakdown,
    },
    site: {
      total_articles: totalArticleCount || 0,
      total_views: totalViews,
      total_shares: totalShares,
      contained_articles: (topArticles || []).length,
      contained_views: containedViews,
    },
    page_analytics: {
      total_tracked: (pageViews || []).length,
      today: todayViews,
      this_week: weekViews,
      top_pages: topPages,
      top_referrers: topReferrers,
      campaigns: campaigns,
    },
    top_linkedin_engagers: linkedinEngaged.slice(0, 50),
    top_contained_articles: topArticles || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    top_viewed_articles: (allArticles || []).filter((a: any) => (a.view_count || 0) > 0),
  });
}
