/**
 * LLM issue-mapper: assigns canonical themes to a staged discovery.
 *
 * Why: scanner categories are pass-through source metadata (HUDOC keywords,
 * CourtListener tags), so whether a new case lands on an issue page depends on
 * keyword luck. This maps each staged item onto the CONTROLLED vocabulary —
 * the union of justice_matrix_issues.category_tags plus the domain tags — so
 * issue pages pick up new material by design.
 *
 * Guardrails:
 *   - the vocabulary comes from the DB at call time; the LLM cannot add to it
 *   - output is Zod-validated (JusticeMatrixThemeMapSchema) and then
 *     intersected against the allowed list again — a hallucinated theme is
 *     dropped, never published
 *   - best-effort: any failure returns [] and the scan continues; source tags
 *     are never replaced, only extended
 */

import { callBackgroundLLM } from '@/lib/ai/model-router';
import { JusticeMatrixThemeMapSchema, validateLLMOutput } from '@/lib/ai/llm-schemas';
import { canonicaliseCategories } from '@/lib/justice-matrix/categories';

const DOMAIN_TAGS = ['refugee', 'asylum', 'youth-justice'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadControlledVocabulary(supabase: any): Promise<string[]> {
  const { data } = await supabase.from('justice_matrix_issues').select('category_tags').eq('is_published', true);
  const vocab = new Set<string>(DOMAIN_TAGS);
  for (const row of (data ?? []) as { category_tags: string[] | null }[]) {
    for (const t of row.category_tags ?? []) vocab.add(t);
  }
  return [...vocab];
}

export async function mapToCanonicalThemes(
  item: { title: string; summary?: string | null; jurisdiction?: string | null; categories?: string[] | null },
  vocabulary: string[],
): Promise<string[]> {
  if (!vocabulary.length) return [];
  try {
    const prompt = [
      'You classify a legal case or advocacy campaign against a fixed theme vocabulary.',
      'Return ONLY JSON: {"themes": ["..."]} where every theme is copied EXACTLY from the allowed list.',
      'Choose at most 4 themes that genuinely describe the item. If none apply, return {"themes": []}.',
      'Never invent a theme that is not in the list.',
      '',
      `Allowed themes: ${vocabulary.join(', ')}`,
      '',
      `Title: ${item.title}`,
      item.jurisdiction ? `Jurisdiction: ${item.jurisdiction}` : '',
      item.summary ? `Summary: ${item.summary.slice(0, 800)}` : '',
      item.categories?.length ? `Source tags: ${item.categories.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const raw = await callBackgroundLLM(prompt, { jsonMode: true, maxTokens: 200 });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return [];
      parsed = JSON.parse(m[0]);
    }
    const validated = validateLLMOutput(parsed, JusticeMatrixThemeMapSchema);
    if (!validated.success) return [];
    const allowed = new Set(vocabulary);
    return canonicaliseCategories(validated.data.themes).filter((t) => allowed.has(t));
  } catch {
    return [];
  }
}
