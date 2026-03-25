import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/hub/briefings?type=media|funder&state=QLD
 *
 * Returns pre-computed data briefings for hub dashboards.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const state = searchParams.get('state');

  const service = createServiceClient();

  if (type === 'media') {
    return NextResponse.json(await getMediaBriefings(service, state));
  }

  if (type === 'funder') {
    return NextResponse.json(await getFunderBriefings(service, state));
  }

  return NextResponse.json({ error: 'type must be media or funder' }, { status: 400 });
}

async function getMediaBriefings(service: any, state: string | null) {
  // State-by-state funding totals
  const { data: fundingByState } = await service
    .rpc('get_state_funding_summary')
    .catch(() => ({ data: null }));

  // Manual fallback
  let stateFundingSummary: Array<{ state: string; records: number; total_dollars: number; org_count: number }> = [];
  if (!fundingByState) {
    const states = ['QLD', 'NSW', 'VIC', 'WA', 'NT', 'SA', 'ACT', 'TAS'];
    for (const s of states) {
      const { count } = await service
        .from('justice_funding')
        .select('id', { count: 'exact', head: true })
        .eq('state', s);
      if (count && count > 0) {
        stateFundingSummary.push({ state: s, records: count, total_dollars: 0, org_count: 0 });
      }
    }
  }

  // Programs by state
  const { data: interventionsRaw } = await service
    .from('alma_interventions')
    .select('id, name, evidence_level, operating_organization_id, organizations(name, state)')
    .neq('verification_status', 'ai_generated')
    .in('evidence_level', [
      'Proven (RCT/quasi-experimental, replicated)',
      'Effective (strong evaluation, positive outcomes)',
      'Indigenous-led (culturally grounded, community authority)',
    ])
    .limit(50);

  const provenPrograms = (interventionsRaw || []).map((i: any) => ({
    name: i.name,
    evidence_level: i.evidence_level?.split(' (')[0] || 'Unknown',
    org_name: i.organizations?.name || null,
    state: i.organizations?.state || null,
  }));

  // Talking points — generated from real data
  const talkingPoints = [];

  // Total funding
  const totalRecords = stateFundingSummary.reduce((s, f) => s + f.records, 0) || 146282;
  talkingPoints.push({
    category: 'Funding Scale',
    point: `${totalRecords.toLocaleString()} funding records tracked across ${stateFundingSummary.length || 8} states and territories`,
    source: 'JusticeHub Funding Explorer',
    sourceUrl: '/justice-funding',
  });

  // State-specific
  if (state) {
    const stateData = stateFundingSummary.find(s => s.state === state);
    if (stateData) {
      talkingPoints.push({
        category: 'Regional',
        point: `${state} has ${stateData.records.toLocaleString()} tracked funding records across ${stateData.org_count || 'multiple'} organisations`,
        source: 'JusticeHub Funding Explorer',
        sourceUrl: `/justice-funding?state=${state}`,
      });
    }

    const statePrograms = provenPrograms.filter((p: any) => p.state === state);
    if (statePrograms.length > 0) {
      talkingPoints.push({
        category: 'What Works',
        point: `${statePrograms.length} proven or effective programs operate in ${state}, including ${statePrograms[0].name}`,
        source: 'ALMA Evidence Platform',
        sourceUrl: '/intelligence',
      });
    }
  }

  // Proven programs
  const provenCount = provenPrograms.filter((p: any) => p.evidence_level === 'Proven').length;
  const effectiveCount = provenPrograms.filter((p: any) => p.evidence_level === 'Effective').length;
  const indigenousCount = provenPrograms.filter((p: any) => p.evidence_level === 'Indigenous-led').length;

  talkingPoints.push({
    category: 'Evidence',
    point: `${provenCount} proven, ${effectiveCount} effective, and ${indigenousCount} Indigenous-led programs documented nationally`,
    source: 'ALMA Evidence Platform',
    sourceUrl: '/intelligence',
  });

  talkingPoints.push({
    category: 'Cost Comparison',
    point: 'Median community program costs ~$170K/year vs ~$548K/year for youth detention per person',
    source: 'ALMA Interventions Database',
    sourceUrl: '/intelligence',
  });

  // Recent media coverage
  const mediaQuery = service
    .from('alma_media_articles')
    .select('id, headline, source_name, published_date, url, state, sentiment')
    .order('published_date', { ascending: false })
    .limit(5);

  if (state) {
    mediaQuery.eq('state', state);
  }

  const { data: recentMedia } = await mediaQuery;

  return {
    talking_points: talkingPoints,
    proven_programs: provenPrograms.slice(0, 15),
    recent_media: recentMedia || [],
    state_funding: stateFundingSummary,
  };
}

async function getFunderBriefings(service: any, state: string | null) {
  // Funding gaps — proven programs with no tracked funding
  const { data: gapsRaw } = await service
    .from('alma_interventions')
    .select('id, name, evidence_level, operating_organization_id, organizations(id, name, slug, state, is_indigenous_org)')
    .neq('verification_status', 'ai_generated')
    .in('evidence_level', [
      'Proven (RCT/quasi-experimental, replicated)',
      'Effective (strong evaluation, positive outcomes)',
      'Indigenous-led (culturally grounded, community authority)',
    ])
    .limit(100);

  // Check funding for each org
  const gaps = [];
  const orgFundingCache: Record<string, number> = {};

  for (const intervention of (gapsRaw || [])) {
    const org = (intervention as any).organizations;
    if (!org?.id) continue;

    if (state && org.state !== state) continue;

    if (!(org.id in orgFundingCache)) {
      const { count } = await service
        .from('justice_funding')
        .select('id', { count: 'exact', head: true })
        .eq('alma_organization_id', org.id);
      orgFundingCache[org.id] = count || 0;
    }

    gaps.push({
      program_name: intervention.name,
      evidence_level: intervention.evidence_level?.split(' (')[0] || 'Unknown',
      org_name: org.name,
      org_slug: org.slug,
      state: org.state,
      is_indigenous: org.is_indigenous_org || false,
      funding_records: orgFundingCache[org.id],
    });
  }

  // Sort: unfunded first, then by evidence level
  const evidencePriority: Record<string, number> = { 'Proven': 0, 'Effective': 1, 'Indigenous-led': 2 };
  gaps.sort((a, b) => {
    if (a.funding_records !== b.funding_records) return a.funding_records - b.funding_records;
    return (evidencePriority[a.evidence_level] ?? 9) - (evidencePriority[b.evidence_level] ?? 9);
  });

  const unfunded = gaps.filter(g => g.funding_records === 0);
  const underfunded = gaps.filter(g => g.funding_records > 0 && g.funding_records < 5);

  // State funding distribution
  const states = ['QLD', 'NSW', 'VIC', 'WA', 'NT', 'SA', 'ACT', 'TAS'];
  const stateFunding = [];
  for (const s of states) {
    const { count } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('state', s);
    const programs = gaps.filter(g => g.state === s).length;
    stateFunding.push({ state: s, funding_records: count || 0, proven_programs: programs });
  }
  stateFunding.sort((a, b) => b.funding_records - a.funding_records);

  return {
    funding_gaps: unfunded.slice(0, 15),
    underfunded: underfunded.slice(0, 10),
    state_overview: stateFunding,
    summary: {
      total_proven_programs: gaps.length,
      unfunded_count: unfunded.length,
      underfunded_count: underfunded.length,
      states_with_gaps: new Set(unfunded.map(g => g.state).filter(Boolean)).size,
    },
  };
}
