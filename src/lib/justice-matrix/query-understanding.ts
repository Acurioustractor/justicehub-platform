/**
 * Justice Matrix NL query-understanding engine.
 *
 * ONE module. It turns a free-text /ask question into a QueryPlan: an intent +
 * surface classification, a filter set that maps ONLY to real /search params,
 * and 1-3 expanded query strings for multi-query retrieval. It does NOT touch
 * the database and never fabricates content. Categories and country are
 * intersected against a frozen allow-list, exactly like theme-mapper.ts.
 *
 * Two code paths:
 *   - planQueryHeuristic: pure, synchronous, zero-IO. The safety floor.
 *   - planQuery: one callBackgroundLLM(jsonMode) call, Zod-validated, sanitised.
 *     Falls back to planQueryHeuristic on ANY failure (no provider, parse error,
 *     Zod failure, thrown error).
 *
 * Mapping discipline (why each filter exists):
 *   type/cat/outcome/strength/region/country/scope -> real /search params.
 *   yearFrom/yearTo have NO /search equivalent, so they are SOFT post-filters
 *   the caller applies after retrieval, never sent to /search. They live on
 *   the plan so the retrieval layer can drop out-of-range hits without a DB
 *   change. (Spec fallback: implement the post-filter, do not invent a param.)
 *
 * Modelled VERBATIM on theme-mapper.ts: callBackgroundLLM -> JSON.parse with a
 * {[\s\S]*} salvage branch -> validateLLMOutput -> Set-based allow-list filter.
 */

import { SURFACES } from '@/lib/justice-matrix/surfaces';
import { canonicaliseCategories } from '@/lib/justice-matrix/categories';
import { callBackgroundLLM } from '@/lib/ai/model-router';
import { QueryPlanSchema, type QueryPlanLLM, validateLLMOutput } from '@/lib/ai/llm-schemas';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

// INTENT is narrowed to what retrieval actually branches on.
export type QueryIntent = 'find-cases' | 'find-campaigns' | 'find-evidence' | 'unknown';
export type QuerySurface = 'all' | 'refugee' | 'youth';

export interface QueryPlanFilters {
  type: 'all' | 'case' | 'campaign' | 'evidence'; // -> /search ?type
  cat: string[]; // -> /search ?cat (comma-join); allow-list intersected
  outcome: 'favorable' | 'adverse' | 'pending' | null; // -> /search ?outcome
  strength: 'high' | 'medium' | 'low' | null; // -> /search ?strength
  region: string | null; // -> /search ?region
  country: 'AU' | null; // -> /search ?country (ONLY 'AU' ever passes)
  scope: 'all' | 'au' | 'global'; // -> /search ?scope
  yearFrom: number | null; // NO /search param -> SOFT post-filter only
  yearTo: number | null; // NO /search param -> SOFT post-filter only
}

export interface QueryPlan {
  intent: QueryIntent;
  surface: QuerySurface;
  surfaceExplicit: boolean; // true only when the TEXT named the other domain
  filters: QueryPlanFilters;
  queries: string[]; // [original, ...1-2 paraphrases], deduped, capped at JM_QU_MAX_QUERIES
  source: 'llm' | 'heuristic';
}

// ---------------------------------------------------------------------------
// Frozen vocabulary (live-corpus census). Single source; extend only by
// re-counting categories[] if the corpus grows. Used to intersect both the
// LLM-emitted and the heuristic categories. A value not in this list is
// dropped, never sent to /search.
// ---------------------------------------------------------------------------

export const CANONICAL_CATEGORIES = [
  'asylum',
  'refugee',
  'non-refoulement',
  'article-3',
  'immigration',
  'immigration-detention',
  'youth-justice',
  'indigenous-rights',
  'deaths-in-custody',
  'justice-reinvestment',
  'raise-the-age',
  'diversion',
  'age-of-responsibility',
] as const;

const CANONICAL_SET = new Set<string>(CANONICAL_CATEGORIES);

// Cap on the number of expanded query strings (original + paraphrases).
function maxQueries(): number {
  const raw = process.env.JM_QU_MAX_QUERIES;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 3;
}

// ---------------------------------------------------------------------------
// Heuristic floor (pure, zero-IO). Surface detection, intent, cat seeding via
// allow-list intersect, scope inference, year regex, query normalisation.
// ---------------------------------------------------------------------------

// Phrase -> canonical category. Each RHS is in CANONICAL_CATEGORIES; the final
// intersect is belt-and-braces. Keys are matched as plain substrings against a
// lowercased, single-spaced question.
const CATEGORY_CUES: Array<[RegExp, string]> = [
  [/non[-\s]?refoulement/, 'non-refoulement'],
  [/asylum/, 'asylum'],
  [/refugee/, 'refugee'],
  [/article\s*3/, 'article-3'],
  [/immigration\s+detention|detention\s+of\s+(?:migrants|asylum)/, 'immigration-detention'],
  [/\bimmigration\b/, 'immigration'],
  [/youth\s+justice|young\s+(?:person|people|offender)|children\s+in\s+(?:detention|custody)/, 'youth-justice'],
  [/indigenous|first\s+nations|aboriginal|torres\s+strait/, 'indigenous-rights'],
  [/death(?:s)?\s+in\s+custody/, 'deaths-in-custody'],
  [/justice\s+reinvest/, 'justice-reinvestment'],
  [/raise\s+the\s+age/, 'raise-the-age'],
  [/diversion/, 'diversion'],
  [/age\s+of\s+(?:criminal\s+)?responsibility/, 'age-of-responsibility'],
];

// Cues that the question is squarely in the refugee/asylum domain.
const REFUGEE_CUES = /non[-\s]?refoulement|asylum|refugee|\barticle\s*3\b|pushback|offshore|deportation|immigration|border/;
// Cues that the question is squarely in the youth-justice domain.
const YOUTH_CUES = /youth\s+justice|raise\s+the\s+age|age\s+of\s+(?:criminal\s+)?responsibility|justice\s+reinvest|young\s+(?:person|people|offender)|children\s+in\s+(?:detention|custody)|juvenile|deaths?\s+in\s+custody/;

const AU_CUES = /\baustralia\b|\baustralian\b|\bqld\b|\bnsw\b|\bvic\b|\bwa\b|\bsa\b|\btas\b|\bnt\b|\bact\b/;

// Outcome / strength cues (cases only).
const OUTCOME_CUES: Array<[RegExp, 'favorable' | 'adverse' | 'pending']> = [
  [/\b(?:won|win|successful|favou?rable|upheld|granted)\b/, 'favorable'],
  [/\b(?:lost|loss|dismissed|rejected|adverse|defeat)\b/, 'adverse'],
  [/\b(?:pending|ongoing\s+case|awaiting|undecided)\b/, 'pending'],
];

// Phrase -> legal-term swaps for the paraphrase. Conservative, meaning-preserving.
const PARAPHRASE_SWAPS: Array<[RegExp, string]> = [
  [/turn(?:ed|ing)?\s+back\s+boats?|boat\s+turn[-\s]?back/g, 'pushbacks at sea'],
  [/locking\s+up\s+kids|jailing\s+children/g, 'children in detention'],
  [/sending\s+people\s+(?:back|away)/g, 'non-refoulement removal'],
  [/keep\s+kids\s+out\s+of\s+(?:the\s+)?(?:system|jail|prison)/g, 'youth diversion and justice reinvestment'],
  [/off[-\s]?shore\s+processing/g, 'offshore detention third-country transfer'],
];

function normaliseQuestion(q: string): string {
  return q.toLowerCase().replace(/\s+/g, ' ').trim();
}

function detectIntent(norm: string): QueryIntent {
  // Order matters: explicit "campaign"/"evidence" beats the default "cases".
  if (/\bcampaign(?:s)?\b|\bmovement\b|\badvocacy\b|\borganis(?:e|ing|ation)\b/.test(norm)) {
    return 'find-campaigns';
  }
  if (/\bevidence\b|\bevaluation(?:s)?\b|\bresearch\b|\bstud(?:y|ies)\b|\bdata\s+show|\bproven\b|\bworks?\b\s|\beffective(?:ness)?\b/.test(norm)) {
    return 'find-evidence';
  }
  if (/\bcase(?:s)?\b|\bcourt\b|\bjudgment\b|\bjudgement\b|\bruling\b|\bheld\b|\bprecedent\b|\blitigation\b/.test(norm)) {
    return 'find-cases';
  }
  return 'unknown';
}

function intentToType(intent: QueryIntent): 'all' | 'case' | 'campaign' | 'evidence' {
  if (intent === 'find-campaigns') return 'campaign';
  if (intent === 'find-evidence') return 'evidence';
  // find-cases and unknown both keep 'all' (cases lead but campaigns/evidence
  // remain visible; the corpus is small and cross-kind answers are the point).
  return 'all';
}

function detectCategories(norm: string): string[] {
  const out: string[] = [];
  for (const [re, cat] of CATEGORY_CUES) {
    if (re.test(norm) && !out.includes(cat)) out.push(cat);
  }
  // canonicalise + intersect against the frozen allow-list (belt-and-braces).
  return canonicaliseCategories(out).filter((c) => CANONICAL_SET.has(c));
}

function detectOutcome(norm: string): 'favorable' | 'adverse' | 'pending' | null {
  for (const [re, val] of OUTCOME_CUES) {
    if (re.test(norm)) return val;
  }
  return null;
}

// Extract a year range. Single year -> both bounds. "2015 to 2019" / "2015-2019"
// / "between 2015 and 2019" -> [from, to]. No /search param exists for this; the
// caller applies it as a soft post-filter.
function detectYears(norm: string): { from: number | null; to: number | null } {
  const years = (norm.match(/\b(19|20)\d{2}\b/g) ?? []).map((y) => parseInt(y, 10)).filter((y) => y >= 1900 && y <= 2100);
  if (years.length === 0) return { from: null, to: null };
  if (years.length === 1) return { from: years[0], to: years[0] };
  const sorted = [...years].sort((a, b) => a - b);
  return { from: sorted[0], to: sorted[sorted.length - 1] };
}

function buildQueries(norm: string, original: string): string[] {
  const base = (original.trim() || norm).trim();
  const queries: string[] = [];
  if (base) queries.push(base);

  // One conservative paraphrase: swap colloquial phrasing for legal terms.
  let para = norm;
  let swapped = false;
  for (const [re, repl] of PARAPHRASE_SWAPS) {
    if (re.test(para)) {
      para = para.replace(re, repl);
      swapped = true;
    }
  }
  if (swapped && para.trim() && para.trim() !== base.toLowerCase()) {
    queries.push(para.trim());
  }

  // Always guarantee at least one non-empty query.
  if (queries.length === 0) queries.push('justice matrix');

  // Dedup (case-insensitive) preserving order, then cap.
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const query of queries) {
    const key = query.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(query);
    }
  }
  return deduped.slice(0, maxQueries());
}

/**
 * Pure, synchronous, zero-IO. The floor the LLM path degrades to. This is the
 * whole safety net: it never calls a provider, never touches the DB, and never
 * emits a category or country outside the allow-list.
 */
export function planQueryHeuristic(question: string, uiSurface: QuerySurface): QueryPlan {
  const norm = normaliseQuestion(question);

  const intent = detectIntent(norm);
  const type = intentToType(intent);

  // Surface detection: only flip away from the UI surface when the TEXT names
  // the other domain. A bare question keeps the UI lens (surfaceExplicit=false).
  let surface: QuerySurface = uiSurface;
  let surfaceExplicit = false;
  if (REFUGEE_CUES.test(norm)) {
    surface = 'refugee';
    surfaceExplicit = true;
  } else if (YOUTH_CUES.test(norm)) {
    surface = 'youth';
    surfaceExplicit = true;
  }

  let cat = detectCategories(norm);
  const outcome = type === 'evidence' ? null : detectOutcome(norm);
  const years = detectYears(norm);

  // Scope: when a surface is applied implicitly (UI lens, text did not name the
  // other domain) use the surface default scope; otherwise infer from the text.
  let scope: 'all' | 'au' | 'global';
  if (uiSurface !== 'all' && !surfaceExplicit) {
    scope = SURFACES[uiSurface].defaultScope;
  } else if (surface === 'refugee') {
    scope = AU_CUES.test(norm) ? 'au' : SURFACES.refugee.defaultScope;
  } else if (surface === 'youth') {
    scope = SURFACES.youth.defaultScope; // always 'au'
  } else {
    scope = AU_CUES.test(norm) ? 'au' : 'all';
  }

  // Seed refugee cats from the surface preset when none were detected. NEVER
  // seed a youth cat. SURFACES.youth.defaultCats is [] by design; a cat filter
  // would trip /search evidenceEligible=false and starve the ALMA evidence lane.
  if (surface === 'refugee' && cat.length === 0) {
    cat = [...SURFACES.refugee.defaultCats].filter((c) => CANONICAL_SET.has(c));
  }

  // country: only ever 'AU' (a non-AU code is a silent recall sink because
  // country_code is ~40% null). Lean on scope + region for the AU/global split.
  const country: 'AU' | null = scope === 'au' ? 'AU' : null;

  const filters: QueryPlanFilters = {
    type,
    cat,
    outcome,
    strength: null, // not reliably inferable from free text; left to explicit facets
    region: null, // region is a free-text prefix; not inferred heuristically
    country,
    scope,
    yearFrom: years.from,
    yearTo: years.to,
  };

  // EVIDENCE-LANE GATE: an evidence request must reach /search with an
  // evidence-eligible filter set, or the evidenceEligible gate drops the lane.
  applyEvidenceLaneGate(intent, filters);

  return {
    intent,
    surface,
    surfaceExplicit,
    filters,
    queries: buildQueries(norm, question),
    source: 'heuristic',
  };
}

// Force the filter set evidence can actually match: no cat/outcome/strength/
// region/country, scope=au. Mutates in place. Applied for both an explicit
// evidence type and a find-evidence intent.
function applyEvidenceLaneGate(intent: QueryIntent, filters: QueryPlanFilters): void {
  if (filters.type === 'evidence' || intent === 'find-evidence') {
    filters.type = 'evidence';
    filters.cat = [];
    filters.outcome = null;
    filters.strength = null;
    filters.region = null;
    filters.country = null;
    filters.scope = 'au';
  }
}

// ---------------------------------------------------------------------------
// Sanitiser: turn a validated LLM plan into a QueryPlan. Allow-list intersect,
// surface override, scope resolution, evidence-lane gate, AU-only country.
// INTERNAL (not exported); the LLM path is the only caller.
// ---------------------------------------------------------------------------

function sanitisePlan(llm: QueryPlanLLM, uiSurface: QuerySurface, original: string): QueryPlan {
  // cat: lowercase + canonicalise + intersect the frozen allow-list, then dedup.
  const cat = canonicaliseCategories(llm.categories.map((c) => c.toLowerCase())).filter((c) =>
    CANONICAL_SET.has(c),
  );

  // country: ONLY 'AU' ever passes; nothing else.
  const country: 'AU' | null = (llm.country ?? '').toUpperCase() === 'AU' ? 'AU' : null;

  // region: NEVER trusted from the LLM. cases.region is 67% null, and the model
  // routinely fills it with a court ("High Court of Australia") or country
  // ("Australia") that the sparse sub-region column never matches, which zeros
  // an otherwise-rich result set (verified live 2026-06-14). The heuristic
  // already refuses to infer region; the LLM path now matches it. scope +
  // country carry the geography; an explicit /search ?region facet still works.
  const region = null;
  void llm.region;

  // SURFACE OVERRIDE: honour the model's surface only when it explicitly named
  // the other domain; otherwise keep the UI surface.
  const surface: QuerySurface =
    llm.surface_explicit && llm.surface !== 'all' ? llm.surface : uiSurface;
  const surfaceExplicit = !!llm.surface_explicit;

  // scope: when a surface is applied implicitly, use its default scope.
  let scope: 'all' | 'au' | 'global';
  if (uiSurface !== 'all' && !llm.surface_explicit) {
    scope = SURFACES[uiSurface].defaultScope;
  } else {
    scope = llm.scope;
  }

  // intent + type: derive BOTH deterministically from the question text, NOT
  // from the LLM. The model over-commits to find-evidence/find-campaigns on
  // questions that never named a kind (e.g. "raise the age" -> find-evidence ->
  // the evidence-lane gate then collapses it to evidence-only, dropping every
  // relevant case), verified live 2026-06-14. detectIntent narrows ONLY on an
  // explicit kind word ("campaign", "evidence/research/study") and otherwise
  // yields 'all' (cases lead, campaigns + evidence stay visible — the corpus is
  // small and cross-kind answers are the point). The LLM still drives cat /
  // scope / country / surface / queries below, where it adds value without the
  // sharp over-narrowing failure mode.
  const intent: QueryIntent = detectIntent(normaliseQuestion(original));
  const type = intentToType(intent);

  let finalCat = cat;
  // Seed refugee cats from the preset when the resolved surface is refugee and
  // no category survived. Youth stays scope-only; NEVER seed a youth cat.
  if (surface === 'refugee' && finalCat.length === 0) {
    finalCat = [...SURFACES.refugee.defaultCats].filter((c) => CANONICAL_SET.has(c));
  }

  const filters: QueryPlanFilters = {
    type,
    cat: finalCat,
    outcome: llm.outcome,
    strength: llm.strength,
    region,
    country,
    scope,
    yearFrom: llm.year_from,
    yearTo: llm.year_to,
  };

  applyEvidenceLaneGate(intent, filters);

  // queries: prepend the verbatim original, dedup (case-insensitive), cap.
  const rawQueries = [original.trim(), ...llm.queries.map((s) => s.trim())].filter(Boolean);
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const query of rawQueries) {
    const key = query.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      queries.push(query);
    }
  }
  if (queries.length === 0) queries.push(original.trim() || 'justice matrix');

  return {
    intent,
    surface,
    surfaceExplicit,
    filters,
    queries: queries.slice(0, maxQueries()),
    source: 'llm',
  };
}

// ---------------------------------------------------------------------------
// LLM path. ONE call, validated, sanitised. Degrades to the heuristic on ANY
// failure. Modelled verbatim on theme-mapper.ts.
// ---------------------------------------------------------------------------

function planPrompt(question: string, uiSurface: QuerySurface): string {
  return [
    'You convert a natural-language question into a search PLAN for a legal research index.',
    'The index holds strategic-litigation CASES, advocacy CAMPAIGNS, and Australian youth-justice EVIDENCE studies.',
    'Return ONLY JSON with these keys:',
    '{"intent","surface","surface_explicit","type","categories","outcome","strength","region","country","scope","year_from","year_to","queries"}',
    '',
    'Rules:',
    `- intent: one of ${['find-cases', 'find-campaigns', 'find-evidence', 'unknown'].join(', ')}.`,
    '- surface: one of all, refugee, youth. surface_explicit=true ONLY if the question itself names the refugee/asylum or youth-justice domain.',
    '- type: all, case, campaign, or evidence (match intent).',
    `- categories: choose only from this fixed list, copied EXACTLY: ${CANONICAL_CATEGORIES.join(', ')}. Use [] if none clearly apply. Never invent a category.`,
    '- outcome: favorable, adverse, pending, or null (cases only).',
    '- strength: high, medium, low, or null (cases only).',
    '- region: a place/court name as plain text, or null.',
    '- country: the two-letter code "AU" only when the question is clearly about Australia, else null.',
    '- scope: all, au, or global.',
    '- year_from / year_to: 4-digit years if a time window is stated, else null.',
    '- queries: the original question plus 1 to 2 short paraphrases that use precise legal terms. 1 to 3 strings total.',
    '',
    `UI surface (the lens the reader is currently in): ${uiSurface}`,
    `Question: ${question}`,
  ].join('\n');
}

/**
 * Single LLM call, validate, sanitise. On ANY throw / parse failure / Zod
 * failure -> planQueryHeuristic. The LLM never widens the allow-list and never
 * sets a country other than AU. The sanitiser enforces both.
 */
export async function planQuery(question: string, uiSurface: QuerySurface): Promise<QueryPlan> {
  try {
    const prompt = planPrompt(question, uiSurface);
    const raw = await callBackgroundLLM(prompt, { jsonMode: true, maxTokens: 700 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) {
        console.warn('[planQuery] no JSON in LLM output, using heuristic:', raw.slice(0, 160));
        return planQueryHeuristic(question, uiSurface);
      }
      parsed = JSON.parse(m[0]);
    }

    const validated = validateLLMOutput(parsed, QueryPlanSchema);
    if (!validated.success) {
      console.warn('[planQuery] Zod rejected plan, using heuristic:', JSON.stringify(validated.errors).slice(0, 200));
      return planQueryHeuristic(question, uiSurface);
    }

    return sanitisePlan(validated.data, uiSurface, question);
  } catch (error) {
    console.warn('[planQuery] LLM call failed, using heuristic:', error instanceof Error ? error.message : String(error));
    return planQueryHeuristic(question, uiSurface);
  }
}

// ---------------------------------------------------------------------------
// Relax-and-retry support (used by the retrieval layer after a zero-result
// first pass). Pure, exported for direct testing.
// ---------------------------------------------------------------------------

/**
 * True when the plan carries a narrowing that can zero a corpus that actually
 * holds the answer: a single-kind type (a campaign/evidence request returning 0
 * should retry across all kinds) OR any of cat/outcome/strength/region. The
 * geography (scope/country) and year window are NOT counted; they are reliable
 * and survive a relax pass.
 */
export function hasNarrowingFilters(f: QueryPlanFilters): boolean {
  return f.type !== 'all' || !!f.outcome || !!f.strength || !!f.region || f.cat.length > 0;
}

/**
 * Cast the widest sensible net for a broad second pass: kind back to 'all' and
 * cat/outcome/strength/region cleared, keeping scope/country and the soft year
 * window. Used only after the first fan-out returned nothing, so precision is
 * already lost and the goal is to surface the closest real records rather than a
 * false "no match".
 */
export function relaxFilters(f: QueryPlanFilters): QueryPlanFilters {
  return { ...f, type: 'all', cat: [], outcome: null, strength: null, region: null };
}
