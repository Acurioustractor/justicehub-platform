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

  // LinkedIn engagement from campaign_alignment_entities
  const { data: linkedinEngaged } = await supabase
    .from('campaign_alignment_entities')
    .select('name, organization, composite_score, alignment_category, campaign_list, outreach_status, alignment_signals, warm_paths, entity_type')
    .filter('alignment_signals', 'cs', '{"type":"linkedin_engagement"}')
    .order('composite_score', { ascending: false })
    .limit(50);

  // Pipeline stats
  const { data: pipelineStats } = await supabase
    .from('campaign_alignment_entities')
    .select('outreach_status')
    .filter('alignment_signals', 'cs', '{"type":"linkedin_engagement"}');

  const outreachBreakdown: Record<string, number> = {};
  pipelineStats?.forEach(e => {
    const status = e.outreach_status || 'pending';
    outreachBreakdown[status] = (outreachBreakdown[status] || 0) + 1;
  });

  // Category breakdown of LinkedIn engagers
  const categoryBreakdown: Record<string, number> = {};
  const listBreakdown: Record<string, number> = {};
  linkedinEngaged?.forEach(e => {
    const cat = e.alignment_category || 'unknown';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    const list = e.campaign_list || 'unassigned';
    listBreakdown[list] = (listBreakdown[list] || 0) + 1;
  });

  // Top CONTAINED pages from articles table (view counts)
  const { data: topArticles } = await supabase
    .from('articles')
    .select('title, slug, view_count, share_count, is_contained')
    .eq('is_contained', true)
    .order('view_count', { ascending: false })
    .limit(10);

  // Total entity counts
  const { count: totalEntities } = await supabase
    .from('campaign_alignment_entities')
    .select('*', { count: 'exact', head: true });

  const { count: totalLinkedIn } = await supabase
    .from('campaign_alignment_entities')
    .select('*', { count: 'exact', head: true })
    .filter('alignment_signals', 'cs', '{"type":"linkedin_engagement"}');

  return NextResponse.json({
    summary: {
      total_entities: totalEntities || 0,
      linkedin_engaged: totalLinkedIn || 0,
      outreach_breakdown: outreachBreakdown,
      category_breakdown: categoryBreakdown,
      list_breakdown: listBreakdown,
    },
    top_linkedin_engagers: linkedinEngaged || [],
    top_contained_articles: topArticles || [],
  });
}
