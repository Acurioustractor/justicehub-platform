/**
 * Canonical category vocabulary for the Justice Matrix.
 *
 * Why: the categories arrays on justice_matrix_cases / justice_matrix_campaigns
 * drive the issue pages (category_tags overlap), the facet chips, and the
 * refugee/youth surface filters. Tags arrive as pass-through from source APIs
 * (HUDOC keywords, CourtListener metadata, EDAL labels), so drift
 * re-accumulates with every scan: a one-off SQL canonicalisation ran 2026-05-28
 * and by 2026-06-10 the live data had `article 3`, `immigration detention`
 * (spaces) and `death-in-custody` vs `deaths-in-custody` again.
 *
 * Every write path MUST run tags through canonicaliseCategories() before
 * persisting: the JSON scanners (scan-json), auto-publish, and the admin
 * approve path. The matching one-off backfill lives in
 * supabase/migrations/20260610*_recanonicalise_matrix_categories.sql.
 */

// Variant -> canonical. Keys must already be in mechanical canonical form
// (lowercase, hyphenated) — the synonym pass runs after the mechanical pass.
const SYNONYMS: Record<string, string> = {
  // Meaning-preserving merges only (singular/plural, exact variants). Never
  // map a narrower concept onto a broader one here — that is curation, not
  // canonicalisation, and it belongs in the issue category_tags.
  'death-in-custody': 'deaths-in-custody',
  'third-country-transfer': 'third-country-transfers',
  'pushback': 'pushbacks',
  'dublin-transfer': 'dublin-transfers',
};

/** lowercase, underscores/spaces -> hyphens, collapse repeats, trim edges */
function mechanical(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function canonicaliseCategory(tag: string): string {
  const m = mechanical(tag);
  return SYNONYMS[m] ?? m;
}

export function canonicaliseCategories(tags: ReadonlyArray<string> | null | undefined): string[] {
  if (!tags?.length) return [];
  const out = new Set<string>();
  for (const t of tags) {
    const c = canonicaliseCategory(String(t));
    if (c) out.add(c);
  }
  return [...out];
}
