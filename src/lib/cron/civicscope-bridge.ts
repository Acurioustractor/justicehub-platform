/**
 * CivicScope Bridge — Parliamentary Data -> ALMA Evidence Graph
 *
 * Searches civic_ministerial_statements and civic_hansard for youth justice
 * mentions and creates alma_research_findings rows with finding_type = 'parliamentary'.
 *
 * Used by: /api/cron/alma/civicscope-bridge
 */

import { createServiceClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const YOUTH_JUSTICE_KEYWORDS = [
  'youth justice',
  'juvenile justice',
  'youth detention',
  'youth crime',
  'young offender',
  'youth diversion',
  'bail support',
  'raising the age',
  'age of criminal responsibility',
  'Don Dale',
  'Banksia Hill',
  'Ashley',
  'community safety',
  'youth recidivism',
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CivicMention {
  source_table: 'civic_ministerial_statements' | 'civic_hansard';
  source_id: string;
  title: string;
  body_snippet: string;
  speaker: string;
  date: string;
  source_url: string | null;
}

interface BridgeStats {
  mentions_found: number;
  findings_created: number;
  duplicates_skipped: number;
  links_made: number;
  errors: number;
}

// Max snippet length stored in content JSON
const MAX_SNIPPET_LENGTH = 1000;

// Build a PostgREST OR filter for keyword matching across a column
function buildKeywordFilter(column: string): string {
  return YOUTH_JUSTICE_KEYWORDS.map(
    (kw) => `${column}.ilike.%${kw}%`
  ).join(',');
}

// ---------------------------------------------------------------------------
// Step 1: Find youth justice mentions in civic tables
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findYouthJusticeMentions(supabase: any): Promise<CivicMention[]> {
  const mentions: CivicMention[] = [];

  // Query ministerial statements
  try {
    const headlineFilter = buildKeywordFilter('headline');
    const bodyFilter = buildKeywordFilter('body_text');

    const { data: statements, error: stmtError } = await (supabase as any)
      .from('civic_ministerial_statements')
      .select('id, headline, body_text, minister_name, published_at, source_url')
      .or(`${headlineFilter},${bodyFilter}`)
      .order('published_at', { ascending: false })
      .limit(200);

    if (stmtError) {
      console.error('[CivicBridge] Statements query error:', stmtError.message);
    } else if (statements?.length) {
      for (const s of statements) {
        mentions.push({
          source_table: 'civic_ministerial_statements',
          source_id: s.id,
          title: s.headline || '(no headline)',
          body_snippet: (s.body_text || '').slice(0, MAX_SNIPPET_LENGTH),
          speaker: s.minister_name || 'Unknown',
          date: s.published_at || '',
          source_url: s.source_url || null,
        });
      }
    }
  } catch (err) {
    console.error('[CivicBridge] Statements query exception:', err);
  }

  // Query Hansard speeches
  try {
    const subjectFilter = buildKeywordFilter('subject');
    const bodyFilter = buildKeywordFilter('body_text');

    const { data: hansard, error: hansardError } = await (supabase as any)
      .from('civic_hansard')
      .select('id, subject, body_text, speaker_name, sitting_date, source_url')
      .or(`${subjectFilter},${bodyFilter}`)
      .order('sitting_date', { ascending: false })
      .limit(200);

    if (hansardError) {
      console.error('[CivicBridge] Hansard query error:', hansardError.message);
    } else if (hansard?.length) {
      for (const h of hansard) {
        mentions.push({
          source_table: 'civic_hansard',
          source_id: h.id,
          title: h.subject || '(no subject)',
          body_snippet: (h.body_text || '').slice(0, MAX_SNIPPET_LENGTH),
          speaker: h.speaker_name || 'Unknown',
          date: h.sitting_date || '',
          source_url: h.source_url || null,
        });
      }
    }
  } catch (err) {
    console.error('[CivicBridge] Hansard query exception:', err);
  }

  console.log(`[CivicBridge] Found ${mentions.length} youth justice mentions across civic tables`);
  return mentions;
}

// ---------------------------------------------------------------------------
// Step 2: Create alma_research_findings from mentions (with dedup)
// ---------------------------------------------------------------------------

export async function createResearchFindings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  mentions: CivicMention[]
): Promise<{ inserted: number; duplicates: number; errors: number; findingIds: string[] }> {
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const findingIds: string[] = [];

  for (const mention of mentions) {
    try {
      // Dedup key: "civicscope:<table>:<id>"
      const dedupKey = `civicscope:${mention.source_table}:${mention.source_id}`;

      // Check if this source already exists
      const { count, error: checkError } = await (supabase as any)
        .from('alma_research_findings')
        .select('id', { count: 'exact', head: true })
        .eq('validation_source', dedupKey);

      if (checkError) {
        console.error(`[CivicBridge] Dedup check error for ${dedupKey}:`, checkError.message);
        errors++;
        continue;
      }

      if ((count || 0) > 0) {
        duplicates++;
        continue;
      }

      // Detect which keywords matched
      const matchedKeywords = YOUTH_JUSTICE_KEYWORDS.filter((kw) => {
        const text = `${mention.title} ${mention.body_snippet}`.toLowerCase();
        return text.includes(kw.toLowerCase());
      });

      // Insert the finding
      const { data: insertedRow, error: insertError } = await (supabase as any)
        .from('alma_research_findings')
        .insert({
          finding_type: 'external_source',
          content: {
            title: mention.title,
            speaker: mention.speaker,
            date: mention.date,
            source_table: mention.source_table,
            body_snippet: mention.body_snippet,
            matched_keywords: matchedKeywords,
          },
          confidence: matchedKeywords.length >= 3 ? 0.9 : matchedKeywords.length >= 2 ? 0.8 : 0.7,
          validation_source: dedupKey,
          sources: mention.source_url ? [mention.source_url] : [],
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`[CivicBridge] Insert error for ${dedupKey}:`, insertError.message);
        errors++;
        continue;
      }

      inserted++;
      if (insertedRow?.id) {
        findingIds.push(insertedRow.id);
      }
    } catch (err) {
      errors++;
      console.error(
        `[CivicBridge] Error creating finding for ${mention.source_id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log(`[CivicBridge] Created ${inserted} findings, ${duplicates} duplicates skipped, ${errors} errors`);
  return { inserted, duplicates, errors, findingIds };
}

// ---------------------------------------------------------------------------
// Step 3: Link findings to organizations and programs (best-effort)
// ---------------------------------------------------------------------------

export async function linkToOrgsAndPrograms(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  mentions: CivicMention[],
  findingIds: string[]
): Promise<{ linked: number }> {
  let linked = 0;

  for (let i = 0; i < mentions.length && i < findingIds.length; i++) {
    const mention = mentions[i];
    const findingId = findingIds[i];

    if (!findingId) continue;

    // Extract potential org/program names from text
    // Simple heuristic: look for capitalized multi-word phrases
    const text = `${mention.title} ${mention.body_snippet}`;
    const candidates = extractNameCandidates(text);

    for (const candidate of candidates.slice(0, 5)) {
      try {
        // Try org match
        const { data: org } = await (supabase as any)
          .from('organizations')
          .select('id, name')
          .ilike('name', `%${candidate}%`)
          .limit(1)
          .single();

        if (org) {
          // Link finding to the org
          await (supabase as any)
            .from('alma_research_findings')
            .update({ entity_id: org.id, entity_type: 'organization' })
            .eq('id', findingId);

          linked++;
          console.log(`[CivicBridge] Linked finding ${findingId} -> org "${org.name}"`);
          break; // One link per finding
        }

        // Try intervention match
        const { data: intervention } = await (supabase as any)
          .from('alma_interventions')
          .select('id, name')
          .ilike('name', `%${candidate}%`)
          .neq('verification_status', 'ai_generated')
          .limit(1)
          .single();

        if (intervention) {
          await (supabase as any)
            .from('alma_research_findings')
            .update({ entity_id: intervention.id, entity_type: 'intervention' })
            .eq('id', findingId);

          linked++;
          console.log(`[CivicBridge] Linked finding ${findingId} -> intervention "${intervention.name}"`);
          break;
        }
      } catch {
        // Best-effort — don't fail the batch for matching errors
      }
    }
  }

  console.log(`[CivicBridge] Linked ${linked} findings to orgs/programs`);
  return { linked };
}

/**
 * Extract potential organization/program name candidates from text.
 * Looks for sequences of 2+ capitalized words (simple heuristic).
 */
function extractNameCandidates(text: string): string[] {
  const matches = text.match(/(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g) || [];
  // Deduplicate and filter out common false positives
  const skipPhrases = new Set([
    'The Government', 'Mr Speaker', 'Madam Speaker', 'Prime Minister',
    'Attorney General', 'The Minister', 'The Hon',
  ]);
  const unique = Array.from(new Set(matches)).filter((m) => !skipPhrases.has(m) && m.length > 5);
  return unique;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function runCivicScopeBridge(): Promise<BridgeStats> {
  const supabase = createServiceClient();

  console.log('[CivicBridge] Starting CivicScope -> ALMA bridge run');

  // Step 1: Find mentions
  const mentions = await findYouthJusticeMentions(supabase as any);

  // Step 2: Create findings (with dedup)
  const { inserted, duplicates, errors, findingIds } = await createResearchFindings(
    supabase as any,
    mentions
  );

  // Step 3: Link to orgs/programs (best-effort)
  const { linked } = await linkToOrgsAndPrograms(supabase as any, mentions, findingIds);

  const stats: BridgeStats = {
    mentions_found: mentions.length,
    findings_created: inserted,
    duplicates_skipped: duplicates,
    links_made: linked,
    errors,
  };

  console.log('[CivicBridge] Completed:', JSON.stringify(stats));
  return stats;
}
