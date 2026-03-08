import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  const supabase = createServiceClient();

  try {
    // Get total interventions (ALMA programs)
    const { count: totalInterventions } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true });

    // Get interventions with evidence level data (indicates documented evaluation/outcomes)
    const { count: withOutcomes } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true })
      .not('evidence_level', 'is', null);

    // Get total services
    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get youth-specific services
    const { count: youthServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('youth_specific', true);

    // Get total public profiles (people)
    const { count: totalPeople } = await supabase
      .from('public_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    // Get total organizations
    const { count: totalOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get services by state for coverage
    const { data: stateData } = await supabase
      .from('services')
      .select('location_state')
      .eq('is_active', true);

    const statesWithServices = new Set(
      stateData?.map((s) => s.location_state).filter(Boolean) || []
    );

    // ALMA deep stats
    const [
      { count: highImpactCount },
      { count: orgsLinkedCount },
      { count: totalOutcomes },
      { count: totalOutcomeLinks },
      { count: totalEvidence },
      { count: totalEvidenceLinks },
      { count: indigenousLedCount },
    ] = await Promise.all([
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).gte('portfolio_score', 0.7),
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).not('operating_organization_id', 'is', null),
      supabase.from('alma_outcomes').select('*', { count: 'exact', head: true }),
      supabase.from('alma_intervention_outcomes').select('*', { count: 'exact', head: true }),
      supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
      supabase.from('alma_intervention_evidence').select('*', { count: 'exact', head: true }),
      supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).eq('evidence_level', 'Indigenous-led (culturally grounded, community authority)'),
    ]);

    // Calculate outcomes rate percentage
    const outcomesRate = totalInterventions
      ? Math.round(((withOutcomes || 0) / totalInterventions) * 100)
      : 0;

    // Estimated cost savings (based on $1.04M savings per youth diverted)
    // Using conservative estimate of 50 youth diverted per active service
    const estimatedDiverted = (totalServices || 0) * 50;
    const costSavingsMillions = Math.round(estimatedDiverted * 1.04);

    return NextResponse.json({
      success: true,
      is_fallback: false,
      stats: {
        programs_documented: totalInterventions || 0,
        programs_with_outcomes: withOutcomes || 0,
        outcomes_rate: outcomesRate,
        total_services: totalServices || 0,
        youth_services: youthServices || 0,
        total_people: totalPeople || 0,
        total_organizations: totalOrganizations || 0,
        states_covered: statesWithServices.size,
        estimated_cost_savings_millions: costSavingsMillions,
        // ALMA deep stats — single source of truth
        high_impact_programs: highImpactCount || 0,
        orgs_linked: orgsLinkedCount || 0,
        indigenous_led_programs: indigenousLedCount || 0,
        total_outcomes: totalOutcomes || 0,
        total_outcome_links: totalOutcomeLinks || 0,
        total_evidence: totalEvidence || 0,
        total_evidence_links: totalEvidenceLinks || 0,
      },
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Homepage stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        is_fallback: true,
        error: 'Failed to fetch statistics',
        // Return fallback stats - last known good values
        stats: {
          programs_documented: 1112,
          programs_with_outcomes: 1094,
          outcomes_rate: 98,
          total_services: 150,
          youth_services: 89,
          total_people: 45,
          total_organizations: 67,
          states_covered: 8,
          estimated_cost_savings_millions: 45,
          high_impact_programs: 480,
          orgs_linked: 527,
          indigenous_led_programs: 0,
          total_outcomes: 1150,
          total_outcome_links: 1699,
          total_evidence: 198,
          total_evidence_links: 327,
        },
        fallback_note: 'Using cached data due to temporary database issue',
      },
      { status: 200 }
    ); // Return 200 with fallback data
  }
}
