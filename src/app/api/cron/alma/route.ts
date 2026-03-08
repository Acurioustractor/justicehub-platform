import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { LLMClient } from '@/lib/ai/model-router';
import { parseJSON } from '@/lib/ai/parse-json';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Vercel

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * ALMA Enrichment Cron — runs continuously to fill data gaps.
 *
 * Phases (run in order, budget-aware):
 * 1. Outcomes extraction for interventions missing them
 * 2. Score recalculation for any unscored interventions
 *
 * GET /api/cron/alma?batch=20
 * POST /api/cron/alma { batch: 20 }
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batch = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get('batch') || '20'))
  );

  return runEnrichment(batch);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let batch = 20;
  try {
    const body = await request.json();
    batch = Math.min(50, Math.max(1, Number(body.batch || 20)));
  } catch {
    // use default
  }

  return runEnrichment(batch);
}

const OUTCOME_TYPES = [
  'Reduced recidivism',
  'Educational engagement',
  'Community safety',
  'Mental health/wellbeing',
  'Diversion from justice system',
  'Reduced detention/incarceration',
  'Cultural connection',
  'Family connection',
  'Employment/training',
  'Reduced substance use',
  'System cost reduction',
  'Healing/restoration',
];

async function runEnrichment(batchSize: number) {
  const supabase = createServiceClient();
  const results = {
    outcomes_extracted: 0,
    outcome_links_created: 0,
    scores_updated: 0,
    errors: [] as string[],
  };

  // Phase 1: Extract outcomes for interventions that have none
  try {
    // Get interventions with descriptions but no outcomes
    const { data: withOutcomes } = await supabase
      .from('alma_intervention_outcomes')
      .select('intervention_id');
    const hasOutcomes = new Set(
      (withOutcomes || []).map((r) => r.intervention_id)
    );

    const { data: candidates } = await supabase
      .from('alma_interventions')
      .select('id, name, type, description')
      .not('description', 'is', null)
      .order('portfolio_score', { ascending: false })
      .limit(500);

    const needsOutcomes = (candidates || [])
      .filter(
        (c) => !hasOutcomes.has(c.id) && (c.description?.length || 0) >= 50
      )
      .slice(0, batchSize);

    if (needsOutcomes.length > 0) {
      // Process in sub-batches of 10
      for (let i = 0; i < needsOutcomes.length; i += 10) {
        const chunk = needsOutcomes.slice(i, i + 10);
        const prompt = buildOutcomesPrompt(chunk);

        try {
          const raw = await LLMClient.getInstance().call(prompt, {
            maxTokens: 3000,
          });
          const parsed = parseJSON(raw);
          if (!parsed?.results) continue;

          for (const result of parsed.results) {
            if (!result.outcomes?.length) continue;
            const intervention = chunk[result.idx - 1];
            if (!intervention) continue;

            for (const outcome of result.outcomes) {
              if (!outcome.name || !OUTCOME_TYPES.includes(outcome.outcome_type))
                continue;

              const { data: inserted } = await supabase
                .from('alma_outcomes')
                .insert({
                  outcome_type: outcome.outcome_type,
                  description: outcome.name,
                  measurement_method: outcome.measurement || null,
                  metadata: { auto_extracted: true, source: 'cron' },
                })
                .select('id')
                .single();

              if (inserted) {
                results.outcomes_extracted++;
                const { error: linkErr } = await supabase
                  .from('alma_intervention_outcomes')
                  .insert({
                    intervention_id: intervention.id,
                    outcome_id: inserted.id,
                  });
                if (!linkErr) results.outcome_links_created++;
              }
            }
          }
        } catch (err) {
          results.errors.push(
            `Outcomes batch ${i}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  } catch (err) {
    results.errors.push(
      `Outcomes phase: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Phase 2: Recalculate scores for any that need it
  try {
    const { data: unscored } = await supabase
      .from('alma_interventions')
      .select('id')
      .is('portfolio_score', null)
      .limit(100);

    if (unscored && unscored.length > 0) {
      // Call the score calculation RPC if available
      const { error: rpcErr } = await supabase.rpc(
        'calculate_portfolio_scores'
      );
      if (!rpcErr) {
        results.scores_updated = unscored.length;
      } else {
        results.errors.push(`Score RPC: ${rpcErr.message}`);
      }
    }
  } catch (err) {
    results.errors.push(
      `Scores phase: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Get current coverage stats
  const [
    { count: totalInterventions },
    { count: withOutcomesCount },
    { count: totalOutcomes },
    { count: totalEvidence },
  ] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('alma_intervention_outcomes')
      .select('intervention_id', { count: 'exact', head: true }),
    supabase.from('alma_outcomes').select('*', { count: 'exact', head: true }),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    success: results.errors.length === 0,
    results,
    coverage: {
      total_interventions: totalInterventions,
      with_outcomes: withOutcomesCount,
      total_outcomes: totalOutcomes,
      total_evidence: totalEvidence,
    },
    timestamp: new Date().toISOString(),
  });
}

function buildOutcomesPrompt(
  interventions: { id: string; name: string; type: string; description: string | null }[]
) {
  return `You are an Australian youth justice researcher. For each intervention below, extract measurable outcomes from the description.

For each outcome, provide:
- name: Short outcome name (3-8 words)
- outcome_type: One of: ${OUTCOME_TYPES.join(', ')}
- measurement: How this outcome could be measured (1 sentence, or null)

INTERVENTIONS:
${interventions.map((i, idx) => `[${idx + 1}] "${i.name}" (${i.type}): ${(i.description || '').substring(0, 500)}`).join('\n\n')}

Return JSON:
{
  "results": [
    { "idx": 1, "outcomes": [{ "name": "...", "outcome_type": "...", "measurement": "..." }] }
  ]
}

Only include outcomes clearly supported by the description. If no outcomes are identifiable, return empty outcomes array for that intervention.`;
}
