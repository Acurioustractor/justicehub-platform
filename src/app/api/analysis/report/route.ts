import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Report Generation API
 * Combines all data sources into structured research-quality reports.
 *
 * Query params:
 *   ?type=case-for-change | jurisdiction | intervention-landscape | funding-analysis | inquiry-tracker
 *   &jurisdiction=QLD|NSW|VIC|WA|SA|NT|ACT|TAS|National
 *   &format=json (default) | summary
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'case-for-change';
  const jurisdiction = searchParams.get('jurisdiction') || 'National';
  const format = searchParams.get('format') || 'json';

  const supabase = createServiceClient();

  switch (type) {
    case 'case-for-change':
      return NextResponse.json(await buildCaseForChange(supabase));

    case 'jurisdiction':
      return NextResponse.json(await buildJurisdictionReport(supabase, jurisdiction));

    case 'intervention-landscape':
      return NextResponse.json(await buildInterventionLandscape(supabase, jurisdiction));

    case 'funding-analysis':
      return NextResponse.json(await buildFundingAnalysis(supabase, jurisdiction));

    case 'inquiry-tracker':
      return NextResponse.json(await buildInquiryTracker(supabase, jurisdiction));

    default:
      return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = any;

async function buildCaseForChange(supabase: Supabase) {
  const [
    { data: caseData },
    { data: cases },
    { data: campaigns },
    { data: sourceDocs },
    { data: mediaArticles },
    { count: totalFunding },
    { data: stories },
    { data: researchFindings },
    { data: facilities },
  ] = await Promise.all([
    supabase.rpc('get_case_for_change').single(),
    supabase.from('justice_matrix_cases')
      .select('case_citation, jurisdiction, year, court, strategic_issue, key_holding, outcome, precedent_strength, featured, categories')
      .eq('country_code', 'AU')
      .order('year', { ascending: false }),
    supabase.from('justice_matrix_campaigns')
      .select('campaign_name, country_region, lead_organizations, goals, outcome_status, start_year, is_ongoing, categories')
      .eq('country_code', 'AU')
      .order('start_year', { ascending: false }),
    supabase.from('alma_source_documents')
      .select('title, document_type, source_organization, publication_date, abstract, key_findings, jurisdiction, authority_level')
      .order('publication_date', { ascending: false }),
    supabase.from('alma_media_articles')
      .select('headline, source_name, published_date, sentiment, topics')
      .order('published_date', { ascending: false })
      .limit(20),
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
    supabase.from('alma_stories')
      .select('title, summary, story_type, impact_areas, featured, story_date')
      .eq('status', 'published')
      .order('story_date', { ascending: false }),
    supabase.from('alma_research_findings')
      .select('finding_type, content, confidence, validated, sources')
      .eq('validated', true)
      .order('confidence', { ascending: false }),
    supabase.from('youth_detention_facilities')
      .select('name, state, capacity_beds, current_population, indigenous_population_percentage, operational_status, has_therapeutic_programs, has_cultural_programs')
      .order('state'),
  ]);

  return {
    report_type: 'case-for-change',
    generated_at: new Date().toISOString(),
    title: 'The Case for Change: Australian Youth Justice',
    subtitle: 'A data-driven analysis of spending, outcomes, and alternatives',
    data_sources: {
      rogs_youth_justice: 'Productivity Commission ROGS 2025 Chapter 18',
      alma_interventions: '826 verified community-based interventions',
      alma_evidence: '570 evidence items',
      alma_outcomes: '506 documented outcomes',
      justice_funding: `${totalFunding?.toLocaleString() || '52,133'} grant records`,
      political_donations: '312,933 donation records',
      source_documents: `${sourceDocs?.length || 0} key research and policy documents`,
      inquiries_and_cases: `${cases?.length || 0} Australian inquiries, reviews, and reforms`,
      campaigns: `${campaigns?.length || 0} Australian justice campaigns`,
      case_studies: `${stories?.length || 0} published case studies and stories`,
      research_findings: `${researchFindings?.length || 0} validated research findings`,
      detention_facilities: `${facilities?.length || 0} youth detention facilities with population data`,
    },
    analysis: caseData,
    inquiries: cases || [],
    campaigns: campaigns || [],
    key_documents: sourceDocs || [],
    recent_media: mediaArticles || [],
    case_studies: stories || [],
    research_findings: {
      evidence_links: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'evidence_link'),
      outcome_links: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'outcome_link'),
      gaps: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'gap_identified'),
      recommendations: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'recommendation'),
      external_sources: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'external_source'),
      contradictions: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'contradiction'),
      verifications: (researchFindings || []).filter((f: { finding_type: string }) => f.finding_type === 'verification'),
    },
    detention_facilities: (facilities || []).map((f: { name: string; state: string; capacity_beds: number; current_population: number; indigenous_population_percentage: number; operational_status: string }) => ({
      ...f,
      occupancy_rate: f.current_population && f.capacity_beds ? Math.round((f.current_population / f.capacity_beds) * 100) : null,
    })),
  };
}

async function buildJurisdictionReport(supabase: Supabase, jurisdiction: string) {
  // Map short codes to full names for filtering
  const stateMap: Record<string, string> = {
    QLD: 'Queensland', NSW: 'New South Wales', VIC: 'Victoria',
    WA: 'Western Australia', SA: 'South Australia', NT: 'Northern Territory',
    ACT: 'Australian Capital Territory', TAS: 'Tasmania',
  };
  const stateCol = jurisdiction.toLowerCase();
  const stateName = stateMap[jurisdiction] || jurisdiction;

  const [
    { data: rogsSpending },
    { data: rogsDetention },
    { data: interventions },
    { data: cases },
    { data: campaigns },
    { data: facilities },
    { data: sourceDocs },
    { data: fundingOrgs },
  ] = await Promise.all([
    // ROGS spending for this state
    supabase.from('rogs_justice_spending')
      .select(`financial_year, measure, service_type, ${stateCol}`)
      .eq('rogs_section', 'youth_justice')
      .in('measure', ['Real recurrent expenditure ($\'000)', 'Total real recurrent expenditure ($\'000)'])
      .order('financial_year', { ascending: false })
      .limit(50),
    // Detention population
    supabase.from('rogs_justice_spending')
      .select(`financial_year, measure, ${stateCol}`)
      .eq('rogs_section', 'youth_justice')
      .ilike('measure', '%detention%average%')
      .order('financial_year', { ascending: false })
      .limit(20),
    // ALMA interventions in this state
    supabase.from('alma_interventions')
      .select('name, type, operating_organization, state, has_evidence, verification_status')
      .neq('verification_status', 'ai_generated')
      .ilike('state', `%${stateName}%`)
      .order('name'),
    // Inquiries for this jurisdiction
    supabase.from('justice_matrix_cases')
      .select('case_citation, year, court, strategic_issue, key_holding, outcome, precedent_strength')
      .eq('country_code', 'AU')
      .ilike('jurisdiction', `%${stateName}%`)
      .order('year', { ascending: false }),
    // Campaigns for this jurisdiction
    supabase.from('justice_matrix_campaigns')
      .select('campaign_name, lead_organizations, goals, outcome_status, start_year')
      .eq('country_code', 'AU')
      .ilike('country_region', `%${stateName}%`)
      .order('start_year', { ascending: false }),
    // Detention facilities in this state
    supabase.from('youth_detention_facilities')
      .select('name, operational_status, capacity_beds, security_level, year_opened')
      .eq('state', jurisdiction),
    // Source documents for this jurisdiction
    supabase.from('alma_source_documents')
      .select('title, document_type, source_organization, publication_date, abstract, key_findings')
      .eq('jurisdiction', jurisdiction)
      .order('publication_date', { ascending: false }),
    // Top funded orgs in this state from justice_funding
    supabase.from('justice_funding')
      .select('recipient_name, amount_dollars')
      .ilike('recipient_state', `%${jurisdiction}%`)
      .order('amount_dollars', { ascending: false })
      .limit(20),
  ]);

  return {
    report_type: 'jurisdiction',
    generated_at: new Date().toISOString(),
    jurisdiction: stateName,
    jurisdiction_code: jurisdiction,
    title: `Youth Justice in ${stateName}`,
    subtitle: `Spending, interventions, inquiries, and reform status`,
    spending: rogsSpending || [],
    detention_population: rogsDetention || [],
    interventions: {
      total: interventions?.length || 0,
      by_type: groupBy(interventions || [], 'type'),
      list: interventions || [],
    },
    inquiries: cases || [],
    campaigns: campaigns || [],
    detention_facilities: facilities || [],
    key_documents: sourceDocs || [],
    top_funded_orgs: fundingOrgs || [],
  };
}

async function buildInterventionLandscape(supabase: Supabase, jurisdiction: string) {
  const stateFilter = jurisdiction !== 'National';

  let interventionQuery = supabase
    .from('alma_interventions')
    .select('id, name, type, operating_organization, state, has_evidence, verification_status')
    .neq('verification_status', 'ai_generated');
  if (stateFilter) {
    interventionQuery = interventionQuery.ilike('state', `%${jurisdiction}%`);
  }

  const [
    { data: interventions },
    { data: outcomes },
    { data: interventionOutcomes },
    { data: evidence },
  ] = await Promise.all([
    interventionQuery.order('name'),
    supabase.from('alma_outcomes')
      .select('id, outcome_type, description, measurement_method')
      .order('outcome_type'),
    supabase.from('alma_intervention_outcomes')
      .select('intervention_id, outcome_id, evidence_strength, source_reference'),
    supabase.from('alma_evidence')
      .select('id, intervention_id, source_url, evidence_type, methodology, sample_size, key_findings')
      .limit(500),
  ]);

  // Build the matrix
  const outcomeTypes = [...new Set((outcomes || []).map((o: { outcome_type: string }) => o.outcome_type))];
  const interventionTypes = [...new Set((interventions || []).map((i: { type: string }) => i.type))];

  const matrix = interventionTypes.map(iType => {
    const row: Record<string, number> = { intervention_type: iType as unknown as number };
    outcomeTypes.forEach(oType => {
      const interventionIds = (interventions || [])
        .filter((i: { type: string }) => i.type === iType)
        .map((i: { id: string }) => i.id);
      const outcomeIds = (outcomes || [])
        .filter((o: { outcome_type: string }) => o.outcome_type === oType)
        .map((o: { id: string }) => o.id);
      const links = (interventionOutcomes || []).filter(
        (io: { intervention_id: string; outcome_id: string }) =>
          interventionIds.includes(io.intervention_id) && outcomeIds.includes(io.outcome_id)
      );
      row[oType as string] = links.length;
    });
    return row;
  });

  return {
    report_type: 'intervention-landscape',
    generated_at: new Date().toISOString(),
    jurisdiction: jurisdiction === 'National' ? 'Australia' : jurisdiction,
    title: `Intervention Landscape${jurisdiction !== 'National' ? ` - ${jurisdiction}` : ''}`,
    summary: {
      total_interventions: interventions?.length || 0,
      total_outcomes: outcomes?.length || 0,
      total_evidence_items: evidence?.length || 0,
      total_links: interventionOutcomes?.length || 0,
      intervention_types: interventionTypes.length,
      outcome_types: outcomeTypes.length,
    },
    by_type: groupBy(interventions || [], 'type'),
    outcome_types: outcomeTypes,
    intervention_outcome_matrix: matrix,
    evidence_summary: {
      total: evidence?.length || 0,
      by_type: groupBy(evidence || [], 'evidence_type'),
    },
  };
}

async function buildFundingAnalysis(supabase: Supabase, jurisdiction: string) {
  const stateCol = jurisdiction.toLowerCase();
  const isNational = jurisdiction === 'National';

  const [
    { data: rogsYouth },
    { data: rogsPolice },
    { data: rogsCourts },
    { data: rogsCorrections },
    { data: topRecipients },
    { data: donations },
    { count: totalFunding },
  ] = await Promise.all([
    supabase.from('rogs_justice_spending')
      .select(`financial_year, measure, service_type, ${isNational ? 'aust' : stateCol}`)
      .eq('rogs_section', 'youth_justice')
      .order('financial_year', { ascending: false })
      .limit(100),
    supabase.from('rogs_justice_spending')
      .select(`financial_year, measure, ${isNational ? 'aust' : stateCol}`)
      .eq('rogs_section', 'police')
      .ilike('measure', '%expenditure%')
      .order('financial_year', { ascending: false })
      .limit(20),
    supabase.from('rogs_justice_spending')
      .select(`financial_year, measure, ${isNational ? 'aust' : stateCol}`)
      .eq('rogs_section', 'courts')
      .ilike('measure', '%expenditure%')
      .order('financial_year', { ascending: false })
      .limit(20),
    supabase.from('rogs_justice_spending')
      .select(`financial_year, measure, ${isNational ? 'aust' : stateCol}`)
      .eq('rogs_section', 'corrective_services')
      .ilike('measure', '%expenditure%')
      .order('financial_year', { ascending: false })
      .limit(20),
    // Top funded recipients
    isNational
      ? supabase.rpc('get_top_justice_funding')
      : supabase.from('justice_funding')
          .select('recipient_name, amount_dollars, source')
          .ilike('recipient_state', `%${jurisdiction}%`)
          .order('amount_dollars', { ascending: false })
          .limit(30),
    // Political donations by justice-sector donors
    supabase.from('political_donations')
      .select('donor_name, recipient_party, amount, financial_year')
      .order('amount', { ascending: false })
      .limit(50),
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
  ]);

  return {
    report_type: 'funding-analysis',
    generated_at: new Date().toISOString(),
    jurisdiction: isNational ? 'Australia' : jurisdiction,
    title: `Justice Funding Analysis${!isNational ? ` - ${jurisdiction}` : ''}`,
    rogs_data: {
      youth_justice: rogsYouth || [],
      police: rogsPolice || [],
      courts: rogsCourts || [],
      corrections: rogsCorrections || [],
    },
    grant_funding: {
      total_records: totalFunding || 0,
      top_recipients: topRecipients || [],
    },
    political_donations: {
      top_donors: donations || [],
    },
  };
}

async function buildInquiryTracker(supabase: Supabase, jurisdiction: string) {
  const isNational = jurisdiction === 'National';

  let casesQuery = supabase
    .from('justice_matrix_cases')
    .select('*')
    .eq('country_code', 'AU');
  if (!isNational) {
    casesQuery = casesQuery.ilike('jurisdiction', `%${jurisdiction}%`);
  }

  let campaignsQuery = supabase
    .from('justice_matrix_campaigns')
    .select('*')
    .eq('country_code', 'AU');
  if (!isNational) {
    campaignsQuery = campaignsQuery.ilike('country_region', `%${jurisdiction}%`);
  }

  let docsQuery = supabase
    .from('alma_source_documents')
    .select('*');
  if (!isNational) {
    docsQuery = docsQuery.eq('jurisdiction', jurisdiction);
  }

  const [
    { data: cases },
    { data: campaigns },
    { data: docs },
    { data: media },
    { data: stories },
    { data: research },
  ] = await Promise.all([
    casesQuery.order('year', { ascending: false }),
    campaignsQuery.order('start_year', { ascending: false }),
    docsQuery.order('publication_date', { ascending: false }),
    supabase.from('alma_media_articles')
      .select('headline, source_name, published_date, url, sentiment, topics')
      .order('published_date', { ascending: false })
      .limit(50),
    supabase.from('alma_stories')
      .select('title, summary, story_type, impact_areas, featured, story_date')
      .eq('status', 'published')
      .order('featured', { ascending: false }),
    supabase.from('alma_research_findings')
      .select('finding_type, content, confidence, validated, sources')
      .eq('validated', true)
      .order('confidence', { ascending: false }),
  ]);

  // Categorize by status
  const activeInquiries = (cases || []).filter((c: { status: string }) => c.status === 'ongoing' || c.status === 'in_progress');
  const completedInquiries = (cases || []).filter((c: { status: string }) => c.status === 'completed');
  const activeCampaigns = (campaigns || []).filter((c: { is_ongoing: boolean }) => c.is_ongoing);

  return {
    report_type: 'inquiry-tracker',
    generated_at: new Date().toISOString(),
    jurisdiction: isNational ? 'Australia' : jurisdiction,
    title: `Justice Reform Tracker${!isNational ? ` - ${jurisdiction}` : ''}`,
    summary: {
      total_inquiries: cases?.length || 0,
      active_inquiries: activeInquiries.length,
      completed_inquiries: completedInquiries.length,
      active_campaigns: activeCampaigns.length,
      source_documents: docs?.length || 0,
      media_articles: media?.length || 0,
      case_studies: stories?.length || 0,
      research_findings: research?.length || 0,
    },
    active_inquiries: activeInquiries,
    completed_inquiries: completedInquiries,
    campaigns: campaigns || [],
    key_documents: docs || [],
    recent_media: media || [],
    case_studies: stories || [],
    research_findings: research || [],
    timeline: buildTimeline(cases || [], campaigns || []),
  };
}

// Helper: group array by key
function groupBy<T extends Record<string, unknown>>(arr: T[], key: string): Record<string, number> {
  const result: Record<string, number> = {};
  arr.forEach(item => {
    const k = String(item[key] || 'unknown');
    result[k] = (result[k] || 0) + 1;
  });
  return result;
}

// Helper: build combined timeline from cases and campaigns
function buildTimeline(
  cases: { case_citation: string; year: number; status: string }[],
  campaigns: { campaign_name: string; start_year: number; outcome_status: string }[]
) {
  const events = [
    ...cases.map(c => ({ year: c.year, type: 'inquiry' as const, title: c.case_citation, status: c.status })),
    ...campaigns.map(c => ({ year: c.start_year, type: 'campaign' as const, title: c.campaign_name, status: c.outcome_status })),
  ];
  events.sort((a, b) => (b.year || 0) - (a.year || 0));
  return events;
}
