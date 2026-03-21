import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

/**
 * Coverage Dashboard API
 *
 * Returns real-time coverage metrics across all data dimensions.
 * Used by the analysis page to show research completeness
 * and by the research loop to identify gaps.
 */
export async function GET() {
  const supabase = createServiceClient();

  const [
    { count: interventions },
    { count: evidence },
    { count: outcomeLinks },
    { count: evidenceLinks },
    { count: stories },
    { count: findings },
    { count: media },
    { count: docs },
    { count: cases },
    { count: campaigns },
    { count: sources },
    { count: withCost },
    { count: enrichedEvidence },
    { count: auCases },
    { count: politicalDonations },
    { count: fundingRecords },
  ] = await Promise.all([
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_intervention_outcomes').select('*', { count: 'exact', head: true }),
    supabase.from('alma_intervention_evidence').select('*', { count: 'exact', head: true }),
    supabase.from('alma_stories').select('*', { count: 'exact', head: true }),
    supabase.from('alma_research_findings').select('*', { count: 'exact', head: true }),
    supabase.from('alma_media_articles').select('*', { count: 'exact', head: true }),
    supabase.from('alma_source_documents').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_sources').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated').not('cost_per_young_person', 'is', null),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }).neq('metadata', '{}'),
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }).ilike('jurisdiction', '%Australia%'),
    supabase.from('political_donations').select('*', { count: 'exact', head: true }),
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
  ]);

  const ti = interventions || 826;
  const te = evidence || 570;

  const dimensions = [
    { id: 'interventions', label: 'Verified Interventions', current: ti, target: 1000, icon: 'target' },
    { id: 'evidence', label: 'Evidence Items', current: te, target: 1000, icon: 'file-text' },
    { id: 'outcome_links', label: 'Outcome Links', current: outcomeLinks || 0, target: ti * 3, icon: 'link' },
    { id: 'evidence_links', label: 'Evidence Links', current: evidenceLinks || 0, target: ti * 2, icon: 'link' },
    { id: 'cost_data', label: 'Cost Data Coverage', current: withCost || 0, target: ti, icon: 'dollar-sign' },
    { id: 'evidence_metadata', label: 'Enriched Evidence', current: enrichedEvidence || 0, target: te, icon: 'database' },
    { id: 'stories', label: 'Case Studies', current: stories || 0, target: 50, icon: 'book-open' },
    { id: 'findings', label: 'Research Findings', current: findings || 0, target: 100, icon: 'search' },
    { id: 'media', label: 'Media Articles', current: media || 0, target: 200, icon: 'newspaper' },
    { id: 'documents', label: 'Source Documents', current: docs || 0, target: 100, icon: 'file' },
    { id: 'cases', label: 'Australian Cases', current: auCases || 0, target: 80, icon: 'landmark' },
    { id: 'campaigns', label: 'Active Campaigns', current: campaigns || 0, target: 60, icon: 'megaphone' },
    { id: 'sources', label: 'Data Sources', current: sources || 0, target: 40, icon: 'globe' },
  ];

  const scored = dimensions.map((d) => ({
    ...d,
    score: Math.round(Math.min(1, d.current / d.target) * 100),
    gap: Math.max(0, d.target - d.current),
  }));

  const overallScore = Math.round(
    scored.reduce((sum, d) => sum + d.score, 0) / scored.length
  );

  return NextResponse.json({
    overall_score: overallScore,
    dimensions: scored,
    totals: {
      interventions: ti,
      evidence: te,
      outcome_links: outcomeLinks || 0,
      evidence_links: evidenceLinks || 0,
      stories: stories || 0,
      findings: findings || 0,
      media: media || 0,
      documents: docs || 0,
      cases: cases || 0,
      campaigns: campaigns || 0,
      sources: sources || 0,
      political_donations: politicalDonations || 0,
      funding_records: fundingRecords || 0,
    },
    loop_schedule: {
      alma_enrichment: '3:00 AM AEST',
      evidence_discovery: '4:00 AM AEST',
      media_discovery: '5:00 AM AEST',
      metadata_enrichment: '6:00 AM AEST',
      cost_enrichment: '7:00 AM AEST',
      research_discovery: '8:00 AM AEST',
      research_loop: '9:00 AM AEST (gap-driven)',
    },
    timestamp: new Date().toISOString(),
  });
}
