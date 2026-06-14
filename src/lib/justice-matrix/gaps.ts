/**
 * Justice Matrix — corpus gap logging (Phase 3, acquisition sensor).
 *
 * When /ask cannot confidently answer a question (a THIN answer), the question
 * is recorded in justice_matrix_gaps via the justice_matrix_record_gap RPC. This
 * is the demand signal for corpus growth: the real questions readers ask that
 * the Matrix cannot yet answer, deduped by a normalized key and ranked by
 * recurrence.
 *
 * recordGap is DEFENSIVE by contract: it never throws and never blocks the /ask
 * answer. If the migration has not been applied yet (table/RPC absent) the write
 * is a silent no-op, so this is safe to ship ahead of the migration.
 */

import { createServiceClient } from '@/lib/supabase/service-lite';

export type GapConfidence = 'strong' | 'partial' | 'thin';

// A 'thin' answer (which already covers the 0-citation and weak-match cases) is
// the gap signal: the corpus could not confidently answer. citationCount is a
// belt-and-braces second trigger in case confidence is ever computed differently.
export function shouldRecordGap(confidence: string, citationCount: number): boolean {
  return confidence === 'thin' || citationCount === 0;
}

// Dedup key: lowercase, strip punctuation to spaces, collapse whitespace, cap.
// Two phrasings that differ only in punctuation/case collapse to one gap row so
// recurrence counts honestly ("raise the age?" == "raise the age").
export function normalizeGapQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

export interface GapRecord {
  question: string;
  surface: string;
  intent: string;
  confidence: string;
  citationCount: number;
  bestDistance: number | null;
  relaxed: boolean;
  planSource: string;
  categories: string[];
}

/**
 * Record (or bump) a corpus gap. Awaited for durability (a fire-and-forget write
 * gets frozen by the serverless runtime before it lands — verified on the
 * contained capture path), but fully wrapped: any failure, including the
 * pre-migration "relation does not exist", is swallowed so /ask never breaks.
 */
export async function recordGap(input: GapRecord): Promise<void> {
  const normalized = normalizeGapQuestion(input.question);
  if (!normalized) return;
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.rpc('justice_matrix_record_gap', {
      p_question: input.question.slice(0, 500),
      p_normalized: normalized,
      p_surface: input.surface,
      p_intent: input.intent,
      p_confidence: input.confidence,
      p_citation_count: input.citationCount,
      p_best_distance: input.bestDistance,
      p_relaxed: input.relaxed,
      p_plan_source: input.planSource,
      p_categories: input.categories ?? [],
    });
    if (error) {
      // Pre-migration the RPC is absent; that is expected and non-fatal.
      console.warn('[gaps] record_gap non-fatal:', error.message);
    }
  } catch (e) {
    console.warn('[gaps] record failed (non-fatal):', e instanceof Error ? e.message : String(e));
  }
}
