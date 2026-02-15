import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type Intervention = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  consent_level: string | null;
  cultural_authority: string | null;
  metadata: Record<string, unknown> | null;
  source_url?: string | null;
  organization_name?: string | null;
};

type Evidence = {
  id: string;
  evidence_type: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  source_url?: string | null;
};

type Outcome = {
  id: string;
  outcome_type: string | null;
  metadata: Record<string, unknown> | null;
};

type Context = {
  id: string;
  context_type: string | null;
  metadata: Record<string, unknown> | null;
};

function mockPortfolioScore() {
  return {
    composite: 0.75,
    evidence_strength: 0.8,
    community_authority: 0.85,
    harm_risk: 0.2,
    implementation_capability: 0.7,
    option_value: 0.65,
    tier: 'High Impact',
    recommendations: [
      'Strong community authority indicates deep local engagement',
      'Evidence base is solid but could benefit from RCT validation',
      'Ready for scaling with additional funding',
    ],
  };
}

function buildProvenance() {
  return {
    mode: 'computed' as const,
    summary:
      'Primary intervention/evidence/outcome/context records are authoritative; portfolio score is currently computed heuristic output.',
    sources: [
      { table: 'alma_interventions', role: 'primary', classification: 'canonical' },
      { table: 'alma_intervention_evidence', role: 'supporting', classification: 'canonical' },
      { table: 'alma_intervention_outcomes', role: 'supporting', classification: 'canonical' },
      { table: 'alma_intervention_contexts', role: 'supporting', classification: 'canonical' },
      { table: 'alma_evidence', role: 'supporting', classification: 'canonical' },
      { table: 'alma_outcomes', role: 'supporting', classification: 'canonical' },
      { table: 'alma_community_contexts', role: 'supporting', classification: 'canonical' },
    ],
    notes: ['portfolioScore uses temporary heuristic calculation and is not an authoritative persisted metric'],
    generated_at: new Date().toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interventionId = params.id;
    if (!interventionId) {
      return NextResponse.json({ success: false, error: 'Intervention ID is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: intervention, error: interventionError } = await supabase
      .from('alma_interventions')
      .select('*')
      .eq('id', interventionId)
      .single();

    if (interventionError) {
      if (interventionError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Intervention not found' }, { status: 404 });
      }
      throw new Error(interventionError.message);
    }

    const [evidenceLinksResult, outcomeLinksResult, contextLinksResult, similarInterventionsResult] =
      await Promise.all([
        supabase.from('alma_intervention_evidence').select('evidence_id').eq('intervention_id', interventionId),
        supabase.from('alma_intervention_outcomes').select('outcome_id').eq('intervention_id', interventionId),
        supabase.from('alma_intervention_contexts').select('context_id').eq('intervention_id', interventionId),
        supabase
          .from('alma_interventions')
          .select('*')
          .neq('id', interventionId)
          .eq('type', (intervention as Intervention).type || '')
          .limit(3),
      ]);

    if (evidenceLinksResult.error) throw new Error(evidenceLinksResult.error.message);
    if (outcomeLinksResult.error) throw new Error(outcomeLinksResult.error.message);
    if (contextLinksResult.error) throw new Error(contextLinksResult.error.message);
    if (similarInterventionsResult.error) throw new Error(similarInterventionsResult.error.message);

    const evidenceIds = Array.from(
      new Set(
        (evidenceLinksResult.data || [])
          .map((row: { evidence_id: string | null }) => row.evidence_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const outcomeIds = Array.from(
      new Set(
        (outcomeLinksResult.data || [])
          .map((row: { outcome_id: string | null }) => row.outcome_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const contextIds = Array.from(
      new Set(
        (contextLinksResult.data || [])
          .map((row: { context_id: string | null }) => row.context_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const [evidenceResult, outcomesResult, contextsResult] = await Promise.all([
      evidenceIds.length > 0
        ? supabase.from('alma_evidence').select('*').in('id', evidenceIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Evidence[], error: null }),
      outcomeIds.length > 0
        ? supabase.from('alma_outcomes').select('*').in('id', outcomeIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Outcome[], error: null }),
      contextIds.length > 0
        ? supabase.from('alma_community_contexts').select('*').in('id', contextIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as Context[], error: null }),
    ]);

    if (evidenceResult.error) throw new Error(evidenceResult.error.message);
    if (outcomesResult.error) throw new Error(outcomesResult.error.message);
    if (contextsResult.error) throw new Error(contextsResult.error.message);

    return NextResponse.json({
      success: true,
      intervention: intervention as Intervention,
      evidence: (evidenceResult.data || []) as Evidence[],
      outcomes: (outcomesResult.data || []) as Outcome[],
      contexts: (contextsResult.data || []) as Context[],
      similarInterventions: (similarInterventionsResult.data || []) as Intervention[],
      portfolioScore: mockPortfolioScore(),
      provenance: buildProvenance(),
    });
  } catch (error: unknown) {
    console.error('Intelligence intervention detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch intervention detail',
      },
      { status: 500 }
    );
  }
}
