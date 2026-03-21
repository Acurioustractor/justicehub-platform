import { createServiceClient } from '@/lib/supabase/service-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 min

/**
 * GET /api/analysis/data-health
 *
 * Returns a comprehensive data health dashboard showing:
 * - Linkage rates (funding→org, org→GS, intervention→org)
 * - Data completeness (ABNs, websites, states, ACNC enrichment)
 * - Coverage scores per dimension
 * - Stale data counts
 * - Sprint agent readiness (what gaps remain)
 */
export async function GET() {
  const supabase = createServiceClient();

  try {
    // Run all counts in parallel
    const [
      totalOrgs,
      orgsWithAbn,
      orgsWithGS,
      orgsWithAcnc,
      orgsWithWebsite,
      totalFunding,
      fundingLinked,
      fundingWithAbn,
      totalInterventions,
      interventionsLinked,
      totalEvidence,
      totalFindings,
      totalMedia,
      totalStories,
      totalCases,
    ] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).not('abn', 'is', null),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).not('gs_entity_id', 'is', null),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).not('acnc_data', 'is', null),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).not('website', 'is', null),
      supabase.from('justice_funding').select('id', { count: 'exact', head: true }),
      supabase.from('justice_funding').select('id', { count: 'exact', head: true }).not('alma_organization_id', 'is', null),
      supabase.from('justice_funding').select('id', { count: 'exact', head: true }).not('recipient_abn', 'is', null),
      supabase.from('alma_interventions').select('id', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
      supabase.from('alma_interventions').select('id', { count: 'exact', head: true }).neq('verification_status', 'ai_generated').not('operating_organization_id', 'is', null),
      supabase.from('alma_evidence').select('id', { count: 'exact', head: true }),
      supabase.from('alma_research_findings').select('id', { count: 'exact', head: true }),
      supabase.from('alma_media_articles').select('id', { count: 'exact', head: true }),
      supabase.from('alma_stories').select('id', { count: 'exact', head: true }),
      supabase.from('justice_matrix_cases').select('id', { count: 'exact', head: true }),
    ]);

    const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 1000) / 10 : 0;

    const orgCount = totalOrgs.count || 0;
    const fundCount = totalFunding.count || 0;
    const intCount = totalInterventions.count || 0;

    const linkageScores = {
      funding_to_org: pct(fundingLinked.count || 0, fundCount),
      funding_has_abn: pct(fundingWithAbn.count || 0, fundCount),
      org_to_grantscope: pct(orgsWithGS.count || 0, orgCount),
      org_has_abn: pct(orgsWithAbn.count || 0, orgCount),
      org_has_acnc: pct(orgsWithAcnc.count || 0, orgCount),
      org_has_website: pct(orgsWithWebsite.count || 0, orgCount),
      intervention_to_org: pct(interventionsLinked.count || 0, intCount),
    };

    // Overall data health grade
    const avgLinkage = Object.values(linkageScores).reduce((a, b) => a + b, 0) / Object.values(linkageScores).length;
    const grade = avgLinkage >= 90 ? 'A' : avgLinkage >= 75 ? 'B+' : avgLinkage >= 60 ? 'B' : avgLinkage >= 45 ? 'C+' : avgLinkage >= 30 ? 'C' : 'D';

    // Sprint agent gaps (what would the auto-sprint pick?)
    const gaps = [];
    const unlinkedFunding = fundCount - (fundingLinked.count || 0);
    if (unlinkedFunding > 0) gaps.push({ mode: 'linkage', count: unlinkedFunding, label: 'Funding records without org link' });

    const unlinkedGS = orgCount - (orgsWithGS.count || 0);
    if (unlinkedGS > 0) gaps.push({ mode: 'gs_bridge', count: unlinkedGS, label: 'Orgs without GrantScope link' });

    const orphanInt = intCount - (interventionsLinked.count || 0);
    if (orphanInt > 0) gaps.push({ mode: 'orphan_fix', count: orphanInt, label: 'Interventions without org link' });

    return NextResponse.json({
      grade,
      avg_linkage_pct: Math.round(avgLinkage * 10) / 10,
      counts: {
        organizations: orgCount,
        justice_funding: fundCount,
        interventions: intCount,
        evidence: totalEvidence.count || 0,
        research_findings: totalFindings.count || 0,
        media_articles: totalMedia.count || 0,
        stories: totalStories.count || 0,
        cases: totalCases.count || 0,
      },
      linkage: linkageScores,
      sprint_gaps: gaps,
      cron_schedule: {
        auto_sprint: '10:00 UTC daily (picks highest-impact gap)',
        linkage_sprint: '22:00 UTC daily (bulk funding→org linkage)',
        research_loop: '09:00 UTC daily',
        enrichment: '06:00-08:00 UTC daily (evidence, costs, research)',
        tenders: '02:00 UTC Mon/Thu',
        discovery: '04:00-05:00 UTC daily (interventions + media)',
      },
    });
  } catch (error) {
    console.error('Data health error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
