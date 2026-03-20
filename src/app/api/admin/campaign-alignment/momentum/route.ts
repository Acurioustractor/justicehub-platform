import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { STATUS_TO_STAGE } from '@/lib/campaign/pipeline-stages';

/**
 * GET /api/admin/campaign-alignment/momentum
 * Aggregated campaign momentum metrics: pipeline funnel, newsletter, social, reactions, actions.
 * Admin-only.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const service = createServiceClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      pipelineRes,
      newsletterTotalRes,
      newsletter7dRes,
      newsletter30dRes,
      socialScoredRes,
      socialOffersRes,
      reactionsTotalRes,
      reactionsRecommendRes,
      actionsWithRes,
      actionsActionedRes,
      followUpRes,
    ] = await Promise.all([
      // Pipeline: all entities with outreach_status set
      service
        .from('campaign_alignment_entities')
        .select('outreach_status, updated_at')
        .not('outreach_status', 'is', null),

      // Newsletter totals
      service
        .from('newsletter_subscriptions')
        .select('id', { count: 'exact', head: true }),

      // Newsletter last 7 days
      service
        .from('newsletter_subscriptions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // Newsletter last 30 days
      service
        .from('newsletter_subscriptions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo),

      // Social: total scored (passion > 0)
      service
        .from('campaign_alignment_entities')
        .select('id', { count: 'exact', head: true })
        .gt('passion_score', 0),

      // Social: offers (engagement_signals contains offer type)
      service
        .from('campaign_alignment_entities')
        .select('engagement_signals')
        .gt('passion_score', 0),

      // Tour reactions total
      service
        .from('tour_reactions')
        .select('id', { count: 'exact', head: true }),

      // Tour reactions with rating (for recommend rate)
      service
        .from('tour_reactions')
        .select('rating'),

      // Actions: entities with recommended_approach
      service
        .from('campaign_alignment_entities')
        .select('id', { count: 'exact', head: true })
        .not('recommended_approach', 'is', null),

      // Actions: entities where outreach_status is not pending/not_started
      service
        .from('campaign_alignment_entities')
        .select('id', { count: 'exact', head: true })
        .not('recommended_approach', 'is', null)
        .not('outreach_status', 'in', '("pending","not_started")'),

      // Follow-ups needed: warm/proposal entities not updated in 7+ days
      service
        .from('campaign_alignment_entities')
        .select('id', { count: 'exact', head: true })
        .in('outreach_status', ['contacted', 'nominated', 'in_discussion', 'proposal_sent'])
        .lt('updated_at', sevenDaysAgo),
    ]);

    // Pipeline funnel — map statuses to stages using shared constants
    const pipeline: Record<string, number> = { cold: 0, warm: 0, proposal: 0, committed: 0, active: 0, stale: 0 };
    for (const row of pipelineRes.data || []) {
      const stage = STATUS_TO_STAGE[row.outreach_status] || 'cold';
      pipeline[stage]++;

      // Also mark as stale if warm/proposal and 30+ days inactive
      if ((stage === 'warm' || stage === 'proposal') && row.updated_at) {
        const daysSince = Math.floor((now.getTime() - new Date(row.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= 30) pipeline.stale++;
      }
    }

    // Count offers from engagement_signals
    let offersCount = 0;
    for (const entity of socialOffersRes.data || []) {
      if (Array.isArray(entity.engagement_signals)) {
        for (const sig of entity.engagement_signals) {
          if (sig.type === 'offer') offersCount++;
        }
      }
    }

    // Tour reaction recommend rate (rating >= 4 out of 5)
    const ratings = (reactionsRecommendRes.data || []).filter((r: any) => r.rating != null);
    const recommendCount = ratings.filter((r: any) => r.rating >= 4).length;
    const recommendRate = ratings.length > 0 ? Math.round((recommendCount / ratings.length) * 100) : 0;

    return NextResponse.json({
      pipeline,
      newsletter: {
        total: newsletterTotalRes.count || 0,
        last_7_days: newsletter7dRes.count || 0,
        last_30_days: newsletter30dRes.count || 0,
      },
      social: {
        total_scored: socialScoredRes.count || 0,
        offers: offersCount,
      },
      reactions: {
        total: reactionsTotalRes.count || 0,
        recommend_rate: recommendRate,
      },
      actions: {
        total_with_action: actionsWithRes.count || 0,
        actioned: actionsActionedRes.count || 0,
        pending: (actionsWithRes.count || 0) - (actionsActionedRes.count || 0),
      },
      follow_ups_needed: followUpRes.count || 0,
    });
  } catch (error) {
    console.error('Momentum stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch momentum stats' }, { status: 500 });
  }
}
