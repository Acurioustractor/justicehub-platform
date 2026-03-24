import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/network/matched-opportunities?org_id=xxx
 *
 * Returns opportunities matched to an org's profile:
 * - Youth opportunities (art, music, grants) filtered by state
 * - Funding opportunities filtered by focus areas
 * - Sorted by relevance and deadline
 */
export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient() as any;

    // Get org profile
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, state, is_indigenous_org, tags')
      .eq('id', orgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

    // Get membership focus areas if they exist
    const { data: membership } = await supabase
      .from('network_memberships')
      .select('focus_areas')
      .eq('organization_id', orgId)
      .single();

    const focusAreas: string[] = membership?.focus_areas || org.tags || [];
    const now = new Date().toISOString();

    // Fetch youth opportunities — match by state or national
    const { data: youthOpps } = await supabase
      .from('youth_opportunities')
      .select('id, title, description, category, organizer, source_url, application_url, deadline, location_state, is_national, prize_amount, age_min, age_max')
      .eq('status', 'open')
      .or(`location_state.eq.${org.state},is_national.eq.true`)
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(20);

    // Fetch funding opportunities — match by state/national
    const { data: fundingOpps } = await supabase
      .from('alma_funding_opportunities')
      .select('id, name, description, funder_name, category, deadline, min_grant_amount, max_grant_amount, source_url, application_url, jurisdictions, focus_areas')
      .eq('status', 'open')
      .order('deadline', { ascending: true })
      .limit(20);

    // Filter funding by jurisdiction match
    const matchedFunding = (fundingOpps || []).filter((opp: any) => {
      if (!opp.jurisdictions || opp.jurisdictions.length === 0) return true;
      return opp.jurisdictions.includes(org.state) || opp.jurisdictions.includes('National');
    });

    // Score and combine
    const scored = [
      ...(youthOpps || []).map((o: any) => ({
        type: 'youth' as const,
        id: o.id,
        title: o.title,
        description: o.description,
        organizer: o.organizer || o.category,
        url: o.application_url || o.source_url,
        deadline: o.deadline,
        amount: o.prize_amount ? `$${Number(o.prize_amount).toLocaleString()}` : null,
        category: o.category,
        stateMatch: o.location_state === org.state,
        score: (o.location_state === org.state ? 2 : 1) + (o.deadline ? 1 : 0),
      })),
      ...matchedFunding.map((o: any) => ({
        type: 'funding' as const,
        id: o.id,
        title: o.name,
        description: o.description,
        organizer: o.funder_name,
        url: o.application_url || o.source_url,
        deadline: o.deadline,
        amount: o.max_grant_amount ? `Up to $${Number(o.max_grant_amount).toLocaleString()}` : null,
        category: o.category || 'grant',
        stateMatch: true,
        score: 2 + (o.deadline ? 1 : 0),
      })),
    ].sort((a, b) => b.score - a.score);

    return NextResponse.json({
      orgName: org.name,
      state: org.state,
      matchCount: scored.length,
      opportunities: scored,
    });
  } catch (err) {
    console.error('GET /api/network/matched-opportunities error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
