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

  if (type === 'supporter') {
    return NextResponse.json(await getSupporterBriefings(service, state));
  }

  if (type === 'programs') {
    return NextResponse.json(await getProgramFinder(service, state));
  }

  if (type === 'organization') {
    const orgId = searchParams.get('orgId');
    return NextResponse.json(await getOrganizationBriefings(service, state, orgId));
  }

  return NextResponse.json({ error: 'type must be media, funder, supporter, programs, or organization' }, { status: 400 });
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

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales', QLD: 'Queensland', VIC: 'Victoria', WA: 'Western Australia',
  NT: 'Northern Territory', SA: 'South Australia', ACT: 'Australian Capital Territory', TAS: 'Tasmania',
};

async function getSupporterBriefings(service: any, state: string | null) {
  const stateName = state ? STATE_NAMES[state] || state : 'Australia';

  // State-specific data for the MP letter
  let stateFundingRecords = 0;
  let statePrograms = 0;
  let stateOrgs = 0;

  if (state) {
    const { count: fc } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('state', state);
    stateFundingRecords = fc || 0;

    const { data: progs } = await service
      .from('alma_interventions')
      .select('id, organizations!inner(state)')
      .neq('verification_status', 'ai_generated')
      .eq('organizations.state', state);
    statePrograms = (progs || []).length;

    const { count: oc } = await service
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state)
      .eq('is_active', true);
    stateOrgs = oc || 0;
  }

  // Pre-written MP letter template
  const mpLetter = `Dear [MP Name],

I am writing as a constituent in ${stateName} to raise concerns about youth justice in our state.

${state ? `In ${stateName}, there are ${statePrograms} community-based youth programs operating across ${stateOrgs.toLocaleString()} organisations, yet many remain underfunded or unfunded entirely.` : 'Across Australia, hundreds of community-based youth programs operate with inadequate funding.'}

Research shows that community alternatives to detention cost approximately $170,000 per young person per year, compared to $548,000 for detention — while delivering better outcomes for young people, families, and communities.

${state ? `Our state has ${stateFundingRecords.toLocaleString()} tracked funding records in the JusticeHub database, but significant gaps remain in support for evidence-backed programs.` : ''}

I urge you to:
1. Increase investment in community-based alternatives to youth detention
2. Support Indigenous-led programs that are proven to reduce reoffending
3. Commit to transparent reporting on youth justice spending and outcomes

The CONTAINED national tour is bringing together organisations, researchers, and people with lived experience to build a better approach. I encourage you to engage with this movement.

Sincerely,
[Your Name]
[Your Address]`;

  // Social share templates
  const socialPosts = [
    {
      platform: 'Twitter/X',
      text: `Community alternatives cost $170K/year vs $548K for detention — and they actually work. ${state ? `${stateName} has ${statePrograms} programs that need more support.` : ''} Learn more at justicehub.org.au #CONTAINED #YouthJustice`,
    },
    {
      platform: 'LinkedIn',
      text: `${state ? `${stateName}` : 'Australia'} invests heavily in youth detention ($548K/person/year) when community alternatives ($170K/year) deliver better outcomes. ${state ? `There are ${statePrograms} programs in ${state} working to change this.` : ''}\n\nThe CONTAINED tour is building a national coalition for change. justicehub.org.au/contained`,
    },
    {
      platform: 'Instagram',
      text: `$170K vs $548K. Community programs vs detention. The evidence is clear — alternatives work better AND cost less. ${state ? `${statePrograms} programs in ${state} are proving it every day.` : ''} Link in bio. #CONTAINED #YouthJustice #JusticeReinvestment`,
    },
  ];

  return {
    mp_letter: mpLetter,
    social_posts: socialPosts,
    state_stats: {
      state: state || 'National',
      state_name: stateName,
      funding_records: stateFundingRecords,
      programs: statePrograms,
      organizations: stateOrgs,
    },
  };
}

async function getProgramFinder(service: any, state: string | null) {
  // Fetch programs, filtered by state if provided
  let query = service
    .from('alma_interventions')
    .select('id, name, evidence_level, description, implementation_cost, cost_per_young_person, operating_organization_id, organizations(name, slug, state, city, is_indigenous_org)')
    .neq('verification_status', 'ai_generated')
    .order('name');

  if (state) {
    query = query.eq('organizations.state', state);
  }

  const { data: programsRaw } = await query.limit(50);

  // Filter out programs where the org join returned null (wrong state)
  const programs = (programsRaw || [])
    .filter((p: any) => p.organizations !== null)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      evidence_level: p.evidence_level?.split(' (')[0] || null,
      description: p.description ? (p.description.length > 200 ? p.description.slice(0, 200) + '...' : p.description) : null,
      org_name: p.organizations?.name || null,
      org_slug: p.organizations?.slug || null,
      state: p.organizations?.state || null,
      city: p.organizations?.city || null,
      is_indigenous: p.organizations?.is_indigenous_org || false,
    }));

  // Group by evidence level
  const byEvidence: Record<string, number> = {};
  for (const p of programs) {
    const level = p.evidence_level || 'Other';
    byEvidence[level] = (byEvidence[level] || 0) + 1;
  }

  // Programs by state counts
  const byState: Record<string, number> = {};
  for (const p of programs) {
    if (p.state) byState[p.state] = (byState[p.state] || 0) + 1;
  }

  return {
    programs,
    total: programs.length,
    by_evidence: byEvidence,
    by_state: byState,
  };
}

async function getOrganizationBriefings(service: any, state: string | null, orgId: string | null) {
  // 1. Funding near this org's state
  let nearbyFunding: Array<{ source: string; recipient_name: string; amount_dollars: number | null; state: string }> = [];
  let stateFundingCount = 0;
  if (state) {
    const { count } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('state', state);
    stateFundingCount = count || 0;

    const { data: recentFunding } = await service
      .from('justice_funding')
      .select('source, recipient_name, amount_dollars, state')
      .eq('state', state)
      .not('amount_dollars', 'is', null)
      .order('amount_dollars', { ascending: false })
      .limit(10);
    nearbyFunding = recentFunding || [];
  }

  // 2. Similar programs in same state
  let similarPrograms: Array<{ name: string; evidence_level: string; org_name: string }> = [];
  if (state) {
    const { data: progs } = await service
      .from('alma_interventions')
      .select('name, evidence_level, organizations!inner(name, state)')
      .neq('verification_status', 'ai_generated')
      .eq('organizations.state', state)
      .limit(15);

    similarPrograms = (progs || [])
      .filter((p: any) => p.organizations !== null)
      .map((p: any) => ({
        name: p.name,
        evidence_level: p.evidence_level?.split(' (')[0] || 'Unknown',
        org_name: p.organizations?.name || null,
      }));
  }

  // 3. Org's own funding (if orgId provided)
  let orgFunding: Array<{ source: string; amount_dollars: number | null; financial_year: string | null }> = [];
  let orgFundingCount = 0;
  if (orgId) {
    const { count } = await service
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .eq('alma_organization_id', orgId);
    orgFundingCount = count || 0;

    const { data: ownFunding } = await service
      .from('justice_funding')
      .select('source, amount_dollars, financial_year')
      .eq('alma_organization_id', orgId)
      .order('amount_dollars', { ascending: false })
      .limit(10);
    orgFunding = ownFunding || [];
  }

  // 4. Org's programs (if orgId provided)
  let orgPrograms: Array<{ name: string; evidence_level: string; description: string | null }> = [];
  if (orgId) {
    const { data: progs } = await service
      .from('alma_interventions')
      .select('name, evidence_level, description')
      .neq('verification_status', 'ai_generated')
      .eq('operating_organization_id', orgId)
      .limit(20);

    orgPrograms = (progs || []).map((p: any) => ({
      name: p.name,
      evidence_level: p.evidence_level?.split(' (')[0] || 'Unknown',
      description: p.description ? (p.description.length > 150 ? p.description.slice(0, 150) + '...' : p.description) : null,
    }));
  }

  // 5. Compliance deadlines (ACNC reporting)
  const complianceReminders = [];
  const now = new Date();
  const month = now.getMonth();
  // ACNC Annual Information Statement due by 31 Dec (large), 30 Jun (medium/small)
  if (month >= 9) {
    complianceReminders.push({ type: 'ACNC', deadline: `31 December ${now.getFullYear()}`, description: 'Annual Information Statement due (large charities)' });
  }
  if (month >= 3 && month < 6) {
    complianceReminders.push({ type: 'ACNC', deadline: `30 June ${now.getFullYear()}`, description: 'Annual Information Statement due (medium/small charities)' });
  }
  complianceReminders.push({ type: 'ORIC', deadline: 'Within 6 months of financial year end', description: 'General report due for ORIC-registered corporations' });

  // 6. Network stats — other orgs in same state
  let networkStats = { orgs_in_state: 0, indigenous_orgs_in_state: 0, members_in_state: 0 };
  if (state) {
    const { count: orgCount } = await service
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state)
      .eq('is_active', true);

    const { count: indCount } = await service
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state)
      .eq('is_indigenous_org', true)
      .eq('is_active', true);

    const { data: stateMembers } = await service
      .from('public_profiles')
      .select('id')
      .eq('location', state)
      .not('role_tags', 'is', null);

    networkStats = {
      orgs_in_state: orgCount || 0,
      indigenous_orgs_in_state: indCount || 0,
      members_in_state: (stateMembers || []).length,
    };
  }

  return {
    state_funding: { count: stateFundingCount, top_recipients: nearbyFunding },
    similar_programs: similarPrograms,
    org_funding: { count: orgFundingCount, records: orgFunding },
    org_programs: orgPrograms,
    compliance: complianceReminders,
    network: networkStats,
  };
}
