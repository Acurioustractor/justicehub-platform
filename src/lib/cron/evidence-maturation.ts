/**
 * Evidence Maturation Tracker
 *
 * Detects when ALMA interventions should move up/down the evidence ladder.
 * Flags maturation candidates in alma_maturation_log for human review.
 * Never auto-promotes — all changes require human approval.
 *
 * Used by: /api/cron/alma/enrich/maturation
 */

// ---------------------------------------------------------------------------
// Evidence level constants (exact strings from ALMA constraint)
// ---------------------------------------------------------------------------

export const EVIDENCE_LEVELS = {
  PROVEN: 'Proven (RCT/quasi-experimental, replicated)',
  EFFECTIVE: 'Effective (strong evaluation, positive outcomes)',
  PROMISING: 'Promising (community-endorsed, emerging evidence)',
  INDIGENOUS_LED: 'Indigenous-led (culturally grounded, community authority)',
  UNTESTED: 'Untested (theory/pilot stage)',
} as const;

type EvidenceLevel = (typeof EVIDENCE_LEVELS)[keyof typeof EVIDENCE_LEVELS];

// Ordered from highest to lowest for comparison
const EVIDENCE_HIERARCHY: EvidenceLevel[] = [
  EVIDENCE_LEVELS.PROVEN,
  EVIDENCE_LEVELS.EFFECTIVE,
  EVIDENCE_LEVELS.PROMISING,
  EVIDENCE_LEVELS.UNTESTED,
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvidenceSignals {
  evidenceCount: number;
  hasCostData: boolean;
  hasEvaluation: boolean;
  hasRCT: boolean;
  isIndigenousLed: boolean;
}

export interface MaturationCandidate {
  intervention_id: string;
  current_level: string;
  proposed_level: string;
  evidence_summary: string;
  evidence_count: number;
  cost_data_available: boolean;
  confidence: number;
}

interface ScanResult {
  candidatesFound: number;
  interventionsScanned: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// determineEvidenceLevel — pure function for evidence ladder logic
// ---------------------------------------------------------------------------

export function determineEvidenceLevel(signals: EvidenceSignals): EvidenceLevel {
  const { evidenceCount, hasCostData, hasEvaluation, hasRCT, isIndigenousLed } = signals;

  // Indigenous-led programs keep their level — cultural authority is its own evidence category
  if (isIndigenousLed) {
    return EVIDENCE_LEVELS.INDIGENOUS_LED;
  }

  // RCT/quasi-experimental found → Proven
  if (hasRCT && evidenceCount >= 3 && hasEvaluation) {
    return EVIDENCE_LEVELS.PROVEN;
  }

  // 5+ evidence with evaluation → Effective
  if (evidenceCount >= 5 && hasEvaluation) {
    return EVIDENCE_LEVELS.EFFECTIVE;
  }

  // 3+ evidence items with cost data OR evaluation → Promising
  if (evidenceCount >= 3 && (hasCostData || hasEvaluation)) {
    return EVIDENCE_LEVELS.PROMISING;
  }

  // Default: stays Untested
  return EVIDENCE_LEVELS.UNTESTED;
}

// ---------------------------------------------------------------------------
// assessMaturation — checks a single intervention
// ---------------------------------------------------------------------------

export async function assessMaturation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  interventionId: string
): Promise<MaturationCandidate | null> {
  // Fetch the intervention
  const { data: intervention, error: intError } = await (supabase as any)
    .from('alma_interventions')
    .select('id, name, evidence_level, cost_per_young_person')
    .eq('id', interventionId)
    .single();

  if (intError || !intervention) {
    console.error(`[Maturation] Failed to fetch intervention ${interventionId}:`, intError);
    return null;
  }

  // Fetch evidence items linked to this intervention
  const { data: evidence, error: evError } = await (supabase as any)
    .from('alma_evidence')
    .select('id, methodology')
    .eq('intervention_id', interventionId)
    .neq('verification_status', 'ai_generated');

  if (evError) {
    console.error(`[Maturation] Failed to fetch evidence for ${interventionId}:`, evError);
    return null;
  }

  const evidenceItems = evidence || [];
  const evidenceCount = evidenceItems.length;
  const hasCostData = intervention.cost_per_young_person != null;
  const currentLevel: string = intervention.evidence_level || EVIDENCE_LEVELS.UNTESTED;

  // Check for evaluation reports and RCTs in methodology
  const hasEvaluation = evidenceItems.some(
    (e: { methodology?: string }) =>
      e.methodology &&
      /evaluation|outcome|longitudinal|controlled/i.test(e.methodology)
  );
  const hasRCT = evidenceItems.some(
    (e: { methodology?: string }) =>
      e.methodology &&
      /rct|randomised|randomized|quasi.?experimental/i.test(e.methodology)
  );

  // Check if Indigenous-led
  const isIndigenousLed = currentLevel === EVIDENCE_LEVELS.INDIGENOUS_LED;

  // Determine proposed level
  const proposedLevel = determineEvidenceLevel({
    evidenceCount,
    hasCostData,
    hasEvaluation,
    hasRCT,
    isIndigenousLed,
  });

  // If same level, no maturation needed
  if (proposedLevel === currentLevel) {
    return null;
  }

  // Check the proposed level is actually higher (not a downgrade for now)
  const currentIdx = EVIDENCE_HIERARCHY.indexOf(currentLevel as EvidenceLevel);
  const proposedIdx = EVIDENCE_HIERARCHY.indexOf(proposedLevel as EvidenceLevel);

  // Only flag upgrades (lower index = higher level)
  // Also flag if current level is not in hierarchy (e.g. null/unknown)
  if (currentIdx !== -1 && proposedIdx >= currentIdx) {
    return null;
  }

  // Calculate confidence based on evidence signals
  let confidence = 0.3; // base
  if (evidenceCount >= 3) confidence += 0.2;
  if (evidenceCount >= 5) confidence += 0.1;
  if (hasCostData) confidence += 0.1;
  if (hasEvaluation) confidence += 0.2;
  if (hasRCT) confidence += 0.1;
  confidence = Math.min(confidence, 1.0);

  const summary = [
    `${evidenceCount} evidence items`,
    hasCostData ? 'cost data available' : 'no cost data',
    hasEvaluation ? 'has evaluation report' : 'no evaluation',
    hasRCT ? 'RCT/quasi-experimental found' : '',
  ]
    .filter(Boolean)
    .join(', ');

  return {
    intervention_id: interventionId,
    current_level: currentLevel,
    proposed_level: proposedLevel,
    evidence_summary: summary,
    evidence_count: evidenceCount,
    cost_data_available: hasCostData,
    confidence: Math.round(confidence * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// runMaturationScan — batch processes all interventions
// ---------------------------------------------------------------------------

export async function runMaturationScan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: any
): Promise<ScanResult> {
  // Use provided supabase or create service client
  const sb = supabase || (await import('@/lib/supabase/service')).createServiceClient();

  // Fetch all verified interventions
  const { data: interventions, error: listError } = await (sb as any)
    .from('alma_interventions')
    .select('id, name, evidence_level, cost_per_young_person')
    .neq('verification_status', 'ai_generated')
    .order('name');

  if (listError) {
    console.error('[Maturation] Failed to list interventions:', listError);
    return { candidatesFound: 0, interventionsScanned: 0, errors: 1 };
  }

  if (!interventions?.length) {
    console.log('[Maturation] No interventions to scan');
    return { candidatesFound: 0, interventionsScanned: 0, errors: 0 };
  }

  console.log(`[Maturation] Scanning ${interventions.length} interventions...`);

  let candidatesFound = 0;
  let errors = 0;

  for (const intervention of interventions) {
    try {
      const candidate = await assessMaturation(sb, intervention.id);

      if (candidate) {
        // Log the maturation candidate for human review
        const { error: insertError } = await (sb as any)
          .from('alma_maturation_log')
          .insert({
            intervention_id: candidate.intervention_id,
            current_level: candidate.current_level,
            proposed_level: candidate.proposed_level,
            evidence_summary: candidate.evidence_summary,
            evidence_count: candidate.evidence_count,
            cost_data_available: candidate.cost_data_available,
            confidence: candidate.confidence,
            reviewed: false,
          });

        if (insertError) {
          console.error(
            `[Maturation] Failed to insert candidate for ${intervention.name}:`,
            insertError
          );
          errors++;
        } else {
          console.log(
            `[Maturation] Candidate: ${intervention.name} — ${candidate.current_level} → ${candidate.proposed_level} (confidence: ${candidate.confidence})`
          );
          candidatesFound++;
        }
      }
    } catch (err) {
      errors++;
      console.error(
        `[Maturation] Error processing ${intervention.name}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log(
    `[Maturation] Scan complete: ${candidatesFound} candidates from ${interventions.length} interventions (${errors} errors)`
  );

  return {
    candidatesFound,
    interventionsScanned: interventions.length,
    errors,
  };
}
