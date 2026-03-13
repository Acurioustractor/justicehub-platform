import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server-lite';
import { checkApiFeatureAccess } from '@/lib/org-hub/feature-gates';

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

function buildPortfolioScore(intervention: Record<string, unknown>) {
  const composite = Number(intervention.portfolio_score) || 0;
  const evidence = Number(intervention.evidence_strength_signal) || 0;
  const authority = Number(intervention.community_authority_signal) || 0;
  const harm = Number(intervention.harm_risk_signal) || 0;
  const capability = Number(intervention.implementation_capability_signal) || 0;
  const option = Number(intervention.option_value_signal) || 0;

  const tier = composite >= 0.7 ? 'High Impact' : composite >= 0.4 ? 'Promising' : 'Needs Development';

  const recommendations: string[] = [];
  if (authority >= 0.8) recommendations.push('Strong community authority indicates deep local engagement');
  if (evidence >= 0.7) recommendations.push('Solid evidence base supports scaling decisions');
  if (evidence < 0.4) recommendations.push('Would benefit from formal evaluation or RCT validation');
  if (capability >= 0.7) recommendations.push('Implementation-ready with documented methodology');
  if (capability < 0.4) recommendations.push('Needs further development before replication');
  if (harm < 0.5) recommendations.push('Elevated harm risk — requires careful monitoring');
  if (option >= 0.8) recommendations.push('High learning potential — worth investing in evaluation');

  return {
    composite,
    evidence_strength: evidence,
    community_authority: authority,
    harm_risk: harm,
    implementation_capability: capability,
    option_value: option,
    tier,
    recommendations: recommendations.slice(0, 3),
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
    notes: ['portfolioScore is calculated from persisted signal fields via calculate_portfolio_signals RPC'],
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

    // Check feature access for full detail
    let hasFullAccess = false;
    try {
      const authClient = await createClient();
      const access = await checkApiFeatureAccess(authClient, 'alma_full_detail');
      hasFullAccess = access.allowed;
    } catch {
      // Unauthenticated — summary only
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

    // Free users: truncated description, no evidence/outcomes/contexts
    if (!hasFullAccess) {
      const truncatedIntervention = {
        ...(intervention as Intervention),
        description: intervention.description
          ? (intervention.description as string).substring(0, 100) + '...'
          : null,
      };
      return NextResponse.json({
        success: true,
        intervention: truncatedIntervention,
        evidence: [],
        outcomes: [],
        contexts: [],
        similarInterventions: (similarInterventionsResult.data || []) as Intervention[],
        portfolioScore: buildPortfolioScore(intervention as Record<string, unknown>),
        provenance: buildProvenance(),
        access: { fullDetail: false, upgradeUrl: '/pricing' },
        gated: {
          evidenceCount: evidenceIds.length,
          outcomeCount: outcomeIds.length,
          contextCount: contextIds.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      intervention: intervention as Intervention,
      evidence: (evidenceResult.data || []) as Evidence[],
      outcomes: (outcomesResult.data || []) as Outcome[],
      contexts: (contextsResult.data || []) as Context[],
      similarInterventions: (similarInterventionsResult.data || []) as Intervention[],
      portfolioScore: buildPortfolioScore(intervention as Record<string, unknown>),
      provenance: buildProvenance(),
      access: { fullDetail: true },
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
