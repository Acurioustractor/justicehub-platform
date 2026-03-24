import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Fetch LinkedIn engagers — pull top entities, filter client-side for linkedin signals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allEntities } = await (supabase as any)
    .from('campaign_alignment_entities')
    .select('name, organization, composite_score, alignment_category, campaign_list, outreach_status, alignment_signals, warm_paths, entity_type')
    .order('composite_score', { ascending: false })
    .limit(5000);

  // Filter for LinkedIn engagement
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
  const { count: totalEntities } = await (supabase as any)
    .from('campaign_alignment_entities')
    .select('*', { count: 'exact', head: true });

  // CONTAINED articles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: topArticles } = await (supabase as any)
    .from('articles')
    .select('title, slug, view_count, share_count, is_contained')
    .eq('is_contained', true)
    .order('view_count', { ascending: false })
    .limit(15);

  // ALL articles — top viewed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allArticles } = await (supabase as any)
    .from('articles')
    .select('title, slug, view_count, share_count, category, is_contained')
    .order('view_count', { ascending: false })
    .limit(30);

  // Site-wide stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalViews = (allArticles || []).reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalShares = (allArticles || []).reduce((sum: number, a: any) => sum + (a.share_count || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containedViews = (allArticles || []).filter((a: any) => a.is_contained).reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);

  // Total articles count
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
    top_linkedin_engagers: linkedinEngaged.slice(0, 50),
    top_contained_articles: topArticles || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    top_viewed_articles: (allArticles || []).filter((a: any) => (a.view_count || 0) > 0),
  });
}
