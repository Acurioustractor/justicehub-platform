import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [
      interventionsResult,
      evidenceLinksResult,
      outcomesResult,
      outcomeLinksResult,
      topProgramsResult,
      typesResult,
      outcomeTypesResult,
    ] = await Promise.all([
      supabase
        .from('alma_interventions')
        .select('id, portfolio_score, evidence_level, type, geography, operating_organization_id', { count: 'exact' })
        .neq('verification_status', 'ai_generated'),
      supabase.from('alma_intervention_evidence').select('id', { count: 'exact' }),
      supabase.from('alma_outcomes').select('id', { count: 'exact' }),
      supabase.from('alma_intervention_outcomes').select('id', { count: 'exact' }),
      // Top programs — only show if scores exist (currently all NULL after cleanup)
      supabase
        .from('alma_interventions')
        .select('name, type, portfolio_score, evidence_level, geography, operating_organization')
        .not('portfolio_score', 'is', null)
        .gte('portfolio_score', 0.7)
        .neq('verification_status', 'ai_generated')
        .order('portfolio_score', { ascending: false })
        .limit(20),
      supabase.from('alma_interventions').select('type'),
      supabase
        .from('alma_outcomes')
        .select('outcome_type'),
    ]);

    const interventions = interventionsResult.data || [];
    const highImpact = interventions.filter((i) => Number(i.portfolio_score) >= 0.7).length;
    const indigenousLed = interventions.filter(
      (i) => i.evidence_level === 'Indigenous-led (culturally grounded, community authority)'
    ).length;
    const orgsLinked = interventions.filter((i) => i.operating_organization_id).length;

    // Type breakdown
    const typeCounts: Record<string, { total: number; highImpact: number }> = {};
    for (const i of interventions) {
      if (!i.type) continue;
      if (!typeCounts[i.type]) typeCounts[i.type] = { total: 0, highImpact: 0 };
      typeCounts[i.type].total++;
      if (Number(i.portfolio_score) >= 0.7) typeCounts[i.type].highImpact++;
    }

    // Geography breakdown
    const geoCounts: Record<string, number> = {};
    for (const i of interventions) {
      const geos = i.geography as string[] | null;
      if (!geos) continue;
      for (const g of geos) {
        geoCounts[g] = (geoCounts[g] || 0) + 1;
      }
    }

    // Outcome type breakdown
    const outcomeTypeMap: Record<string, number> = {};
    for (const o of outcomeTypesResult.data || []) {
      const t = (o as any).outcome_type;
      if (t) outcomeTypeMap[t] = (outcomeTypeMap[t] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      overview: {
        totalInterventions: interventionsResult.count || 0,
        highImpactPrograms: highImpact,
        indigenousLedPrograms: indigenousLed,
        orgsLinked,
        totalEvidence: evidenceLinksResult.count || 0,
        totalOutcomes: outcomesResult.count || 0,
        outcomeLinks: outcomeLinksResult.count || 0,
      },
      typeBreakdown: Object.entries(typeCounts)
        .map(([type, counts]) => ({ type, ...counts }))
        .sort((a, b) => b.highImpact - a.highImpact),
      outcomeBreakdown: Object.entries(outcomeTypeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      topPrograms: (topProgramsResult.data || []).map((p) => ({
        name: p.name,
        type: p.type,
        score: Number(p.portfolio_score),
        evidenceLevel: p.evidence_level,
        geography: p.geography,
        organization: p.operating_organization,
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
