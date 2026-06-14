/**
 * POST /api/justice-matrix/ask — Ask the Matrix (grounded RAG).
 *
 * Pipeline:
 *   1. planQuery(question, uiSurface)        — intent/surface/filters/expanded queries
 *   2. retrievePlan(request, plan)           — multi-query /search fan-out, distance-min fusion
 *   3. structured answer                     — citation-forced JSON grounding prompt
 *   4. amplification                         — followups / relatedIssues / gaps / researchTrail / actions
 *
 * Backwards-compatible: `answer` stays a STRING (the existing client renders it).
 * `answerStructured` is ADDITIVE and nullable. The provider chain + retrieval-only
 * fallback are preserved (route-local chooseProvider/askProvider keep the
 * retrieval.provider name). Confidence and the boundary note are computed in TS
 * and OVERWRITTEN server-side in every branch — never trusted from the model.
 *
 * Copy rules: no em-dash, no AI-vocab, the not-legal-advice boundary on every
 * answer, the consent gate on evidence (enforced upstream in /search).
 */

import { NextResponse } from 'next/server';
import { SURFACES } from '@/lib/justice-matrix/surfaces';
import { createServiceClient } from '@/lib/supabase/service-lite';
import {
  planQuery,
  hasNarrowingFilters,
  relaxFilters,
  type QueryPlan,
  type QueryIntent,
} from '@/lib/justice-matrix/query-understanding';
import { AskMatrixAnswerSchema, validateLLMOutput, type MatrixFaithfulness } from '@/lib/ai/llm-schemas';
import {
  mechanicalFaithfulness,
  stripInvalidCitations,
  checkFaithfulness,
  faithCacheKey,
} from '@/lib/justice-matrix/faithfulness';
import { recordGap, shouldRecordGap } from '@/lib/justice-matrix/gaps';
import {
  citationCategories,
  buildRelatedIssues,
  buildGaps,
  buildResearchTrail,
  buildActions,
  templateFollowups,
  followupSystemPrompt,
  followupUserPrompt,
  parseFollowups,
  type IssueRow,
  type Followup,
  type RelatedIssue,
  type Gap,
  type TrailMove,
  type Action,
} from '@/lib/justice-matrix/amplify';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

type Surface = 'all' | 'refugee' | 'youth';
type SourceKind = 'case' | 'campaign' | 'evidence';

// Soft threshold: a fused hit beyond this distance is a weak match (drives the
// gap path + clamps confidence). Cosine distance in text-embedding-3-small space.
const WEAK_MATCH = 0.45;

// Exact boundary line. Set in EVERY branch, no exceptions.
const BOUNDARY_NOTE =
  'This is a research resource, not legal advice. Read the linked source before acting on it.';

interface AskRequest {
  question?: string;
  surface?: Surface;
}

interface RawCase {
  kind: 'case';
  id: string;
  title: string;
  jurisdiction: string | null;
  year: number | null;
  court: string | null;
  excerpt: string | null;
  authoritative_link: string | null;
  verified: boolean | null;
  human_confirmed: boolean | null;
  // Threaded from the /search payload (already present, previously discarded).
  distance: number | null;
  precedent_strength: string | null;
  categories: string[] | null;
  country_code: string | null;
}

interface RawCampaign {
  kind: 'campaign';
  id: string;
  title: string;
  region: string | null;
  start_year: number | null;
  excerpt: string | null;
  lead_organizations: string | null;
  campaign_link: string | null;
  distance: number | null;
  categories: string[] | null;
}

interface RawEvidence {
  kind: 'evidence';
  id: string;
  title: string;
  jurisdiction: string | null;
  year: number | null;
  evidence_type: string | null;
  excerpt: string | null;
  organization: string | null;
  source_url: string | null;
  restricted: boolean;
  distance: number | null;
}

type RawHit = RawCase | RawCampaign | RawEvidence;

interface Citation {
  id: string;
  label: string;
  kind: SourceKind;
  title: string;
  href: string;
  externalUrl: string | null;
  meta: string;
  excerpt: string | null;
  verified?: boolean | null;
  humanConfirmed?: boolean | null;
  restricted?: boolean;
  // Threaded so amplification (related issues, adjacent-jurisdiction trail) and
  // confidence can read them. Cases+campaigns carry categories; cases carry
  // jurisdiction/country_code.
  categories?: string[] | null;
  jurisdiction?: string | null;
  country_code?: string | null;
  // Internal: the fused min-distance for this hit (null in keyword mode). Not
  // serialised onto the public citation, used only to derive confidence.
  _distance?: number | null;
}

interface SearchPayload {
  mode: 'keyword' | 'semantic' | 'hybrid';
  cases?: RawCase[];
  campaigns?: RawCampaign[];
  evidence?: RawEvidence[];
  total?: number;
}

interface Provider {
  name: string;
  url: string;
  model: string;
  key: string;
}

interface StructuredAnswer {
  directAnswer: string;
  keyRecords: { label: string; point: string }[];
  whatHeld: string[];
  limits: string;
  confidence: 'strong' | 'partial' | 'thin';
  boundaryNote: string;
}

// ---------------------------------------------------------------------------
// Grounding system prompt (citation-forced JSON). {{N}} = number of records,
// {{SURFACE_FRAMING}} = the lens framing line.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_TEMPLATE = [
  'You are Ask the Matrix, a grounded research assistant for JusticeHub\'s Justice Matrix.',
  '',
  'You are given {{N}} retrieved Matrix records, labelled [C1] to [C{{N}}]. {{SURFACE_FRAMING}}',
  '',
  'Use ONLY these records. Cite every substantive factual claim with a bracket label like [C1].',
  'Never invent a case, campaign, outcome, holding, source link, or a label that is not in the list.',
  'If the records do not establish something, say so plainly in "limits". Leave "whatHeld" empty when no record states a holding.',
  '',
  'Return ONLY JSON with these keys:',
  '{"directAnswer","keyRecords","whatHeld","limits","boundaryNote"}',
  '- directAnswer: 2 to 4 sentences of plain prose, with [C#] citations inline.',
  '- keyRecords: 3 to 6 items, each {"label","point"}; label MUST be one of the [C#] labels shown.',
  '- whatHeld: each string is "[C#] <what that record actually established>"; use [] when none stated.',
  '- limits: what the corpus did NOT establish for this question.',
  '- boundaryNote: leave it as an empty string; it is set by the system.',
  '',
  'Boundaries: this is research support and strategy orientation, not legal advice. Do not tell a user what legal action to take.',
  'Write in plain English. No em-dashes. Do not use the words delve, crucial, pivotal, seamless, robust, comprehensive, or nuanced.',
].join('\n');

function surfaceFraming(surface: Surface): string {
  if (surface === 'refugee') {
    return 'These records sit in the refugee and asylum strategic-litigation domain, across courts and borders.';
  }
  if (surface === 'youth') {
    return 'These records sit in the Australian youth-justice domain: cases, campaigns, and evidence studies.';
  }
  return 'These records span strategic-litigation cases, advocacy campaigns, and Australian evidence studies.';
}

// The badge stays the authoritative confidence signal; this just aligns the prose
// with it so a tentative answer does not read as a firm one under a 'thin' badge.
function hedgingLine(confidence: 'strong' | 'partial' | 'thin'): string {
  if (confidence === 'thin') {
    return 'Retrieval for this question is weak. Write tentatively: say what the few records suggest, foreground the limits, and do not state firm conclusions.';
  }
  if (confidence === 'partial') {
    return 'Retrieval is moderate. State what the records support and be explicit about what they do not.';
  }
  return 'Retrieval is solid. You may state what the records establish plainly, every claim still cited.';
}

function buildSystemPrompt(n: number, surface: Surface, confidence: 'strong' | 'partial' | 'thin'): string {
  return (
    SYSTEM_PROMPT_TEMPLATE.replace(/\{\{N\}\}/g, String(n)).replace(
      '{{SURFACE_FRAMING}}',
      surfaceFraming(surface),
    ) +
    '\n\n' +
    hedgingLine(confidence)
  );
}

// ---------------------------------------------------------------------------
// Input + provider selection
// ---------------------------------------------------------------------------

function cleanQuestion(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function normaliseSurface(value: unknown): Surface {
  return value === 'refugee' || value === 'youth' ? value : 'all';
}

function chooseProvider(): Provider | null {
  if (process.env.GEMINI_API_KEY) {
    return {
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.5-flash',
      key: process.env.GEMINI_API_KEY,
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      key: process.env.GROQ_API_KEY,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      key: process.env.OPENAI_API_KEY,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Citation construction
// ---------------------------------------------------------------------------

function hrefFor(hit: RawHit): string {
  if (hit.kind === 'case') return `/justice-matrix/cases/${hit.id}`;
  if (hit.kind === 'campaign') return `/justice-matrix/campaigns/${hit.id}`;
  return `/justice-matrix/evidence/${hit.id}`;
}

function metaFor(hit: RawHit): string {
  if (hit.kind === 'case') {
    return [hit.court, hit.jurisdiction, hit.year].filter(Boolean).join(' | ');
  }
  if (hit.kind === 'campaign') {
    return [hit.region, hit.start_year, hit.lead_organizations].filter(Boolean).join(' | ');
  }
  return [hit.jurisdiction ?? 'Australia', hit.year, hit.evidence_type, hit.organization]
    .filter(Boolean)
    .join(' | ');
}

function toCitation(hit: RawHit, index: number): Citation {
  const label = `C${index + 1}`;
  if (hit.kind === 'case') {
    return {
      id: hit.id,
      label,
      kind: 'case',
      title: hit.title,
      href: hrefFor(hit),
      externalUrl: hit.authoritative_link,
      meta: metaFor(hit),
      excerpt: hit.excerpt,
      verified: hit.verified,
      humanConfirmed: hit.human_confirmed,
      categories: hit.categories ?? null,
      jurisdiction: hit.jurisdiction ?? null,
      country_code: hit.country_code ?? null,
      _distance: hit.distance ?? null,
    };
  }
  if (hit.kind === 'campaign') {
    return {
      id: hit.id,
      label,
      kind: 'campaign',
      title: hit.title,
      href: hrefFor(hit),
      externalUrl: hit.campaign_link,
      meta: metaFor(hit),
      excerpt: hit.excerpt,
      categories: hit.categories ?? null,
      _distance: hit.distance ?? null,
    };
  }
  return {
    id: hit.id,
    label,
    kind: 'evidence',
    title: hit.title,
    href: hrefFor(hit),
    externalUrl: hit.source_url,
    meta: metaFor(hit),
    excerpt: hit.excerpt,
    restricted: hit.restricted,
    jurisdiction: hit.jurisdiction ?? 'Australia',
    _distance: hit.distance ?? null,
  };
}

// Strip the internal _distance before serialising to the client.
function publicCitation(c: Citation): Citation {
  const { _distance, ...rest } = c;
  void _distance;
  return rest;
}

function orderedHits(payload: SearchPayload, surface: Surface): RawHit[] {
  const cases = payload.cases ?? [];
  const campaigns = payload.campaigns ?? [];
  const evidence = surface === 'refugee' ? [] : payload.evidence ?? [];
  const all: RawHit[] = [];
  const max = Math.max(cases.length, campaigns.length, evidence.length);

  for (let i = 0; i < max; i += 1) {
    if (cases[i]) all.push(cases[i]);
    if (campaigns[i]) all.push(campaigns[i]);
    if (evidence[i]) all.push(evidence[i]);
  }

  const seen = new Set<string>();
  return all.filter((hit) => {
    const key = `${hit.kind}:${hit.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Multi-query retrieval + distance-min fusion
// ---------------------------------------------------------------------------

interface RetrievalResult {
  citations: Citation[];
  mode: 'keyword' | 'semantic' | 'hybrid';
  total: number;
  bestDistance: number | null;
  fusedHits: RawHit[];
  // True when the first fan-out returned nothing and a broadened (facet-stripped)
  // second pass was used instead. Surfaced so the answer can be honest that it
  // widened the search.
  relaxed?: boolean;
}

function maxQueriesCap(): number {
  const raw = process.env.JM_QU_MAX_QUERIES;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 3;
}

// Build the /search params for ONE query string + the plan filters.
function buildSearchParams(query: string, plan: QueryPlan): URLSearchParams {
  const f = plan.filters;
  const params = new URLSearchParams({
    q: query,
    mode: 'hybrid',
    type: f.type,
    limit: '10',
  });
  if (f.cat.length) params.set('cat', f.cat.join(','));
  if (f.outcome) params.set('outcome', f.outcome);
  if (f.strength) params.set('strength', f.strength);
  if (f.region) params.set('region', f.region);
  if (f.country === 'AU') params.set('country', 'AU'); // ONLY 'AU' ever passes
  params.set('scope', f.scope);
  return params;
}

// Effective distance for a case: provenance boost (closer = better), floored at
// 0. Human-confirmed (a person checked it) beats verified beats unreviewed, so a
// machine-extracted case sorts below a reviewed one at equal semantic distance.
// Until the migration that adds human_confirmed to the semantic RPC lands, the
// field is null on semantic hits and they fall through to the verified branch.
function effectiveDistance(hit: RawHit): number | null {
  if (hit.distance === null || hit.distance === undefined) return null;
  if (hit.kind === 'case') {
    if (hit.human_confirmed === true) return Math.max(0, hit.distance - 0.05);
    if (hit.verified === true) return Math.max(0, hit.distance - 0.03);
  }
  return hit.distance;
}

// Top-level retrieval: one fan-out, then ONE relax-and-retry if it came back
// empty. The planner (LLM) over-applies narrow facets (region most of all, then
// outcome/strength/cat) that can zero a question the corpus actually holds, so a
// bare-zero first pass is retried with those facets stripped before we conclude
// "no match". Geography (scope/country/type) + the year window survive the relax.
async function retrievePlan(request: Request, plan: QueryPlan, surface: Surface): Promise<RetrievalResult> {
  const first = await fanOut(request, plan, surface);
  if (first.total > 0 || !hasNarrowingFilters(plan.filters)) return first;

  const relaxedPlan: QueryPlan = { ...plan, filters: relaxFilters(plan.filters) };
  const second = await fanOut(request, relaxedPlan, surface);
  return second.total > 0 ? { ...second, relaxed: true } : first;
}

async function fanOut(request: Request, plan: QueryPlan, surface: Surface): Promise<RetrievalResult> {
  const origin = new URL(request.url).origin;
  const queries = plan.queries.slice(0, maxQueriesCap());

  const settled = await Promise.allSettled(
    queries.map(async (q) => {
      const params = buildSearchParams(q, plan);
      const res = await fetch(`${origin}/api/justice-matrix/search?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Matrix search failed: ${res.status}`);
      return (await res.json()) as SearchPayload;
    }),
  );

  const payloads: SearchPayload[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') payloads.push(s.value);
  }

  // No query succeeded -> empty result, keyword mode.
  if (payloads.length === 0) {
    return { citations: [], mode: 'keyword', total: 0, bestDistance: null, fusedHits: [] };
  }

  // Any non-keyword payload means at least one leg returned embedding-ranked
  // hits (distances present), so the fused set is treated as the richer mode.
  const mode: 'keyword' | 'semantic' | 'hybrid' = payloads.some((p) => p.mode !== 'keyword')
    ? 'hybrid'
    : 'keyword';

  // FUSION: per-kind, keyed by id, keep the MIN effective distance across queries.
  const fuse = <T extends RawHit>(lists: T[][]): T[] => {
    const byId = new Map<string, T>();
    for (const list of lists) {
      for (const hit of list) {
        const eff = effectiveDistance(hit);
        const existing = byId.get(hit.id);
        if (!existing) {
          byId.set(hit.id, { ...hit, distance: eff });
        } else {
          const prev = existing.distance;
          const next =
            eff === null ? prev : prev === null ? eff : Math.min(prev, eff);
          byId.set(hit.id, { ...existing, distance: next });
        }
      }
    }
    // Sort by distance ascending (nulls last — keyword mode has no distance).
    return [...byId.values()].sort((a, b) => {
      const da = a.distance ?? Number.POSITIVE_INFINITY;
      const db = b.distance ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  };

  const fusedCases = fuse(payloads.map((p) => p.cases ?? []));
  const fusedCampaigns = fuse(payloads.map((p) => p.campaigns ?? []));
  const fusedEvidence = surface === 'refugee' ? [] : fuse(payloads.map((p) => p.evidence ?? []));

  // RETRIEVAL_MIX quotas: lead with cases, keep campaigns + evidence visible.
  const QUOTA = { case: 6, campaign: 3, evidence: 3 } as const;
  const quotaPayload: SearchPayload = {
    mode,
    cases: fusedCases.slice(0, QUOTA.case),
    campaigns: fusedCampaigns.slice(0, QUOTA.campaign),
    evidence: fusedEvidence.slice(0, QUOTA.evidence),
  };

  let hits = orderedHits(quotaPayload, surface);

  // SOFT year post-filter: drop out-of-range hits only when >=6 survive.
  const yf = plan.filters.yearFrom;
  const yt = plan.filters.yearTo;
  if (yf !== null || yt !== null) {
    const inRange = hits.filter((h) => {
      const y = 'year' in h ? h.year : 'start_year' in h ? h.start_year : null;
      if (y === null || y === undefined) return true; // keep undated rather than drop
      if (yf !== null && y < yf) return false;
      if (yt !== null && y > yt) return false;
      return true;
    });
    if (inRange.length >= 6) hits = inRange;
  }

  hits = hits.slice(0, 10);

  // bestDistance = min effective distance across the fused hits in this answer.
  let bestDistance: number | null = null;
  for (const h of hits) {
    if (h.distance !== null && h.distance !== undefined) {
      bestDistance = bestDistance === null ? h.distance : Math.min(bestDistance, h.distance);
    }
  }

  const total =
    (fusedCases.length || 0) + (fusedCampaigns.length || 0) + (fusedEvidence.length || 0);

  return {
    citations: hits.map(toCitation),
    mode,
    total,
    bestDistance,
    fusedHits: hits,
  };
}

// ---------------------------------------------------------------------------
// Confidence (pure, computed AFTER retrieval, model value discarded)
// ---------------------------------------------------------------------------

function deriveConfidence(
  citations: Citation[],
  bestDistance: number | null,
): 'strong' | 'partial' | 'thin' {
  const count = citations.length;
  const caseCites = citations.filter((c) => c.kind === 'case');
  const verifiedCases = caseCites.filter((c) => c.verified === true).length;
  const verifiedShare = caseCites.length > 0 ? verifiedCases / caseCites.length : 0;
  // Human-confirmed is the stronger signal (a person checked the case, not just a
  // pipeline flag). 'strong' now requires at least one human-confirmed case among
  // the cited records, so an answer built entirely on unreviewed, machine-extracted
  // cases cannot read as strong even on a close semantic match. With only 7% of the
  // corpus human-confirmed this makes 'strong' honestly rare.
  const humanConfirmedCases = caseCites.filter((c) => c.humanConfirmed === true).length;
  const close = bestDistance !== null && bestDistance <= 0.32;
  const loose = bestDistance !== null && bestDistance > 0.5;

  if (count === 0) return 'thin';
  if (count >= 4 && close && verifiedShare >= 0.25 && humanConfirmedCases >= 1) return 'strong';
  if (count <= 2 || loose) return 'thin';
  return 'partial';
}

function clampToPartial(c: 'strong' | 'partial' | 'thin'): 'partial' | 'thin' {
  return c === 'strong' ? 'partial' : c;
}

// ---------------------------------------------------------------------------
// Faithfulness (post-hoc NLI check) — cache + limits helper
// ---------------------------------------------------------------------------

// Module-level, best-effort cache. Persists only within a warm serverless
// instance; a cold start starts empty. Keyed on (question + citation-set +
// answer) so a hit means the identical answer is being re-checked, never a
// stale verdict for a different one. Stores null too, so a transient provider
// failure is not retried for the same answer.
const faithCache = new Map<string, MatrixFaithfulness | null>();
const FAITH_CACHE_MAX = 200;
function faithCachePut(key: string, value: MatrixFaithfulness | null): void {
  if (faithCache.size >= FAITH_CACHE_MAX) {
    const oldest = faithCache.keys().next().value;
    if (oldest !== undefined) faithCache.delete(oldest);
  }
  faithCache.set(key, value);
}

function appendLimit(existing: string, note: string): string {
  const e = existing.trim();
  return e ? `${e} ${note}` : note;
}

// Surfaced on the response so a later UI phase (and the team) can see what the
// post-hoc check did. checked=false means the NLI half was skipped or failed.
interface FaithfulnessMeta {
  checked: boolean;
  verdict: 'entailed' | 'partial' | 'contradicted' | 'unchecked';
  unsupportedClaims: string[];
}

// ---------------------------------------------------------------------------
// Provider call (route-local, preserves provider name). JSON grounding prompt.
// ---------------------------------------------------------------------------

function buildContext(citations: Citation[]): string {
  return citations
    .map((c) =>
      [
        `[${c.label}] ${c.kind.toUpperCase()}: ${c.title}`,
        `Route: ${c.href}`,
        c.externalUrl ? `Source: ${c.externalUrl}` : null,
        c.meta ? `Meta: ${c.meta}` : null,
        c.kind === 'case'
          ? c.humanConfirmed === true
            ? 'Provenance: human-confirmed case (a reviewer checked it).'
            : c.verified === true
              ? 'Provenance: verified, not yet human-confirmed.'
              : 'Provenance: unreviewed, machine-extracted. Treat with extra caution and do not state its holding as settled.'
          : null,
        c.restricted ? 'Consent: restricted evidence, title and provenance only.' : null,
        c.excerpt ? `Excerpt: ${c.excerpt}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
}

// Returns the raw provider string (parsed downstream). Sends the JSON system
// prompt + response_format json_object so the model returns parseable JSON.
async function askProvider(
  provider: Provider,
  question: string,
  citations: Citation[],
  surface: Surface,
  confidence: 'strong' | 'partial' | 'thin',
): Promise<string> {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      // 1100 truncated the JSON mid-object on multi-record answers (verified live
      // 2026-06-13), which sank the parse into salvage. Sized for a full answer:
      // directAnswer + up to 6 keyRecords + whatHeld + limits in pretty JSON.
      // 2500 still clipped 6-record answers; 3200 covers them (salvage stays the
      // net if a provider runs even longer).
      max_tokens: 3200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(citations.length, surface, confidence) },
        {
          role: 'user',
          content: [
            `Question: ${question}`,
            '',
            'Retrieved Matrix records:',
            buildContext(citations),
          ].join('\n'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${provider.name} failed: ${res.status} ${text.slice(0, 160)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${provider.name} returned no answer`);
  }
  return content.trim();
}

// Parse the structured answer from a raw provider string. Strip code fences,
// slice first { .. last }, JSON.parse, Zod-validate. null on any failure.
function parseStructured(raw: string): { directAnswer: string; keyRecords: { label: string; point: string }[]; whatHeld: string[]; limits: string } | null {
  try {
    let text = raw.trim();
    // strip ``` fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    const sliced = text.slice(first, last + 1);
    const parsed = JSON.parse(sliced);
    const validated = validateLLMOutput(parsed, AskMatrixAnswerSchema);
    if (!validated.success) return null;
    const d = validated.data;
    return {
      directAnswer: d.directAnswer,
      keyRecords: d.keyRecords,
      whatHeld: d.whatHeld,
      limits: d.limits,
    };
  } catch {
    return null;
  }
}

// Loose salvage: when the strict parse fails (e.g. the model wrote more than the
// schema cap, or a stray field), pull the prose out of the JSON instead of
// leaking raw braces to the UI. Returns clean prose, or null when there is none.
function looseProse(raw: string): { directAnswer: string; keyRecords: { label: string; point: string }[] } | null {
  try {
    const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    // 1. Best case: the whole JSON object parses.
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last > first) {
      try {
        const obj = JSON.parse(text.slice(first, last + 1)) as Record<string, unknown>;
        if (obj && typeof obj.directAnswer === 'string' && obj.directAnswer.trim()) {
          const kr = Array.isArray(obj.keyRecords)
            ? (obj.keyRecords as unknown[])
                .filter(
                  (r): r is { label: string; point: string } =>
                    !!r &&
                    typeof (r as { label?: unknown }).label === 'string' &&
                    typeof (r as { point?: unknown }).point === 'string',
                )
                .slice(0, 6)
                .map((r) => ({ label: r.label, point: r.point.slice(0, 500) }))
            : [];
          return { directAnswer: obj.directAnswer.trim().slice(0, 2600), keyRecords: kr };
        }
      } catch {
        /* truncated or malformed JSON — fall through to regex recovery */
      }
    }
    // 2. JSON-shaped but unparseable (e.g. truncated by max_tokens): pull the
    //    directAnswer string value out with a regex. A complete string value
    //    recovers as prose; a half-written one fails to match and we fall back
    //    to the clean record-list message. We NEVER return the raw braces.
    if (text.includes('"directAnswer"')) {
      const m = text.match(/"directAnswer"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (m && m[1].trim()) {
        const prose = m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\\\/g, '\\').trim();
        return prose ? { directAnswer: prose.slice(0, 2600), keyRecords: [] } : null;
      }
      return null;
    }
    // 3. Genuinely plain prose (no JSON markers at all): safe to use as-is.
    if (!text.startsWith('{')) return text ? { directAnswer: text.slice(0, 2600), keyRecords: [] } : null;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Structured fallbacks (no-provider, provider-threw, parse-failed, salvage)
// ---------------------------------------------------------------------------

// Deterministic structured answer over the retrieved records. Used when no
// provider is configured or a provider/parse path failed. Never fabricates: it
// summarises counts and lists the real records, nothing more.
function buildStructuredFallback(
  question: string,
  citations: Citation[],
  confidence: 'strong' | 'partial' | 'thin',
): StructuredAnswer {
  if (!citations.length) {
    return {
      directAnswer: `The Matrix did not return a strong match for "${question}". Try a case or campaign name, or one of the issue phrases such as non-refoulement at sea, third country transfer, offshore detention, or raise the age.`,
      keyRecords: [],
      whatHeld: [],
      limits:
        'No records matched closely enough to answer. The corpus may not hold material on this question yet.',
      confidence: 'thin',
      boundaryNote: BOUNDARY_NOTE,
    };
  }

  const keyRecords = citations.slice(0, 6).map((c) => ({
    label: c.label,
    point: `${c.title}${c.meta ? ` (${c.meta})` : ''}`,
  }));

  return {
    directAnswer: `The Matrix returned ${citations.length} record${citations.length === 1 ? '' : 's'} for "${question}". This is a cited research packet of the closest matches, not generated synthesis, because no chat provider answered. Use the records below to move from question to source.`,
    keyRecords,
    whatHeld: [],
    limits:
      'These are the closest matches by retrieval, not a confirmed legal position. Read each linked source before relying on it.',
    confidence,
    boundaryNote: BOUNDARY_NOTE,
  };
}

// Flatten a StructuredAnswer to the back-compat `answer` prose string.
function flattenAnswer(s: StructuredAnswer): string {
  const parts: string[] = [s.directAnswer.trim()];

  if (s.keyRecords.length) {
    parts.push('');
    parts.push('Key records:');
    parts.push(...s.keyRecords.map((r) => `- [${r.label}] ${r.point}`));
  }
  if (s.whatHeld.length) {
    parts.push('');
    parts.push('What the records held:');
    parts.push(...s.whatHeld.map((w) => `- ${w}`));
  }
  if (s.limits.trim()) {
    parts.push('');
    parts.push(`Limits: ${s.limits.trim()}`);
  }
  parts.push('');
  parts.push(s.boundaryNote);
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Issues read + follow-ups (the one DB read; everything else is in-memory)
// ---------------------------------------------------------------------------

async function loadPublishedIssues(): Promise<IssueRow[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('justice_matrix_issues')
      .select('slug,title,surface,category_tags,question')
      .eq('is_published', true);
    return ((data ?? []) as IssueRow[]).map((r) => ({
      slug: r.slug,
      title: r.title,
      surface: r.surface,
      category_tags: Array.isArray(r.category_tags) ? r.category_tags : [],
      question: r.question ?? '',
    }));
  } catch {
    return [];
  }
}

async function buildFollowups(
  provider: Provider | null,
  question: string,
  citations: Citation[],
  related: RelatedIssue[],
  cats: string[],
  surface: Surface,
): Promise<Followup[]> {
  // Template first — always guaranteed.
  const template = templateFollowups(question, related, cats, surface);
  if (!provider || citations.length === 0) return template;

  // One optional provider call; any failure falls back to the template.
  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: followupSystemPrompt() },
          {
            role: 'user',
            content: followupUserPrompt(
              question,
              citations.map((c) => c.title),
              related.map((r) => r.title),
            ),
          },
        ],
      }),
    });
    if (!res.ok) return template;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return template;
    const parsed = parseFollowups(content, surface);
    return parsed && parsed.length >= 1 ? parsed.slice(0, 5) : template;
  } catch {
    return template;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AskRequest;
    const question = cleanQuestion(body.question);
    const uiSurface = normaliseSurface(body.surface);

    if (question.length < 3) {
      return NextResponse.json({ error: 'Question must be at least 3 characters.' }, { status: 400 });
    }

    // 1. Plan the query (intent / surface / filters / expanded queries).
    const plan = await planQuery(question, uiSurface);
    const surface: Surface = plan.surface;

    // 2. Multi-query retrieval + distance-min fusion.
    const retrieved = await retrievePlan(request, plan, surface);
    const citations = retrieved.citations;
    const cats = citationCategories(citations);

    // 3. Confidence (computed in TS, overwritten in every branch below).
    const baseConfidence = deriveConfidence(citations, retrieved.bestDistance);
    const weak =
      citations.length === 0 ||
      (retrieved.bestDistance !== null && retrieved.bestDistance > WEAK_MATCH);

    // 4. Structured answer through the existing provider chain.
    const provider = chooseProvider();
    let providerName = 'retrieval-only';
    let structured: StructuredAnswer;

    // Faithfulness: the mechanical pass runs synchronously in the parsed branch;
    // the NLI half (gated) runs as a promise resolved after amplification so it
    // overlaps the issues read + follow-ups instead of adding serial latency.
    const validLabels = new Set(citations.map((c) => c.label));
    let nliPromise: Promise<MatrixFaithfulness | null> | null = null;
    let faithfulness: FaithfulnessMeta | null = null;

    if (provider && citations.length) {
      try {
        const raw = await askProvider(provider, question, citations, surface, baseConfidence);
        const parsed = parseStructured(raw);
        if (parsed) {
          // MECHANICAL faithfulness pass (pure): strip [C#] not in the retrieved
          // set from the prose + whatHeld, drop unlabelled whatHeld entries, keep
          // only real keyRecords. Ungrounded prose (no surviving citation) cannot
          // read as strong or partial, so clamp it to thin.
          const mech = mechanicalFaithfulness(parsed, validLabels);
          structured = {
            directAnswer: mech.directAnswer,
            keyRecords: mech.keyRecords,
            whatHeld: mech.whatHeld,
            limits: parsed.limits,
            confidence: mech.directAnswerHadCitation ? baseConfidence : 'thin',
            boundaryNote: BOUNDARY_NOTE,
          };
          providerName = provider.name;

          // NLI half: gated to grounded answers with >=3 citations. Cached by
          // (question + citation-set + answer) within a warm instance.
          if (mech.directAnswerHadCitation && citations.length >= 3) {
            const records = citations.map((c) => ({
              label: c.label,
              title: c.title,
              excerpt: c.excerpt,
            }));
            const cacheKey = faithCacheKey(
              question,
              citations.map((c) => `${c.kind}:${c.id}`),
              structured.directAnswer,
            );
            if (faithCache.has(cacheKey)) {
              nliPromise = Promise.resolve(faithCache.get(cacheKey) ?? null);
            } else {
              nliPromise = checkFaithfulness(question, structured.directAnswer, records).then(
                (v) => {
                  faithCachePut(cacheKey, v);
                  return v;
                },
              );
            }
          }
        } else {
          // SALVAGE: JSON/Zod validation failed. Pull clean prose out of the raw
          // (never leak the JSON braces to the UI); clamp confidence to 'partial'.
          const loose = looseProse(raw);
          // Salvage prose is still model output: strip any [C#] it invented so
          // the degraded path never leaks a fabricated citation either.
          const looseDirect = loose?.directAnswer
            ? stripInvalidCitations(loose.directAnswer, validLabels).text
            : '';
          const looseRecords = (loose?.keyRecords ?? []).filter((r) =>
            citations.some((c) => c.label === r.label),
          );
          structured = {
            directAnswer:
              looseDirect ||
              `The Matrix returned ${citations.length} record${citations.length === 1 ? '' : 's'} for "${question}". Use the cited records below to move from question to source.`,
            keyRecords: looseRecords.length
              ? looseRecords
              : citations.slice(0, 6).map((c) => ({
                  label: c.label,
                  point: `${c.title}${c.meta ? ` (${c.meta})` : ''}`,
                })),
            whatHeld: [],
            limits:
              'The provider answer ran past the structured limit, so this shows the retrieved records. Read each source before relying on it.',
            confidence: clampToPartial(baseConfidence),
            boundaryNote: BOUNDARY_NOTE,
          };
          providerName = provider.name;
        }
      } catch (error) {
        console.warn('[Ask the Matrix] provider failed, falling back:', error);
        structured = buildStructuredFallback(question, citations, baseConfidence);
      }
    } else {
      structured = buildStructuredFallback(question, citations, baseConfidence);
    }

    // OVERWRITE the boundary note server-side in EVERY branch, no exceptions.
    // Confidence is already the derived value (or the salvage-clamped value) set
    // when `structured` was built; the model's own confidence is never read.
    structured.boundaryNote = BOUNDARY_NOTE;

    // 5. Amplification block.
    const issues = await loadPublishedIssues();
    const relatedIssues = buildRelatedIssues(issues, cats, citations, surface);
    const gaps: Gap[] =
      weak || citations.length < 3 ? buildGaps(citations, { weak, mode: retrieved.mode }, surface) : [];
    const researchTrail: TrailMove[] = buildResearchTrail(question, cats, citations, surface);
    const actions: Action[] = buildActions(cats, surface, relatedIssues, citations);
    // export action: thread the real keyword from the question.
    const exportAction = actions.find((a) => a.id === 'export');
    if (exportAction && exportAction.enabled) {
      const url = new URL(exportAction.href, 'https://x');
      url.searchParams.set('q', question.replace(/[,()*%]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120));
      exportAction.href = `${url.pathname}?${url.searchParams.toString()}`;
    }
    const followups = await buildFollowups(provider, question, citations, relatedIssues, cats, surface);

    // 5b. Resolve the post-hoc NLI verdict (overlapped the amplification above).
    // It only ever DOWN-ranks: a 'contradicted' answer drops to thin, a 'partial'
    // one is clamped, and a null/entailed verdict leaves confidence untouched.
    // Applied before flattenAnswer so the limits note lands in the prose too.
    if (nliPromise) {
      const verdict = await nliPromise;
      if (verdict) {
        faithfulness = {
          checked: true,
          verdict: verdict.verdict,
          unsupportedClaims: verdict.unsupportedClaims,
        };
        if (verdict.verdict === 'contradicted') {
          structured.confidence = 'thin';
          structured.limits = appendLimit(
            structured.limits,
            'A faithfulness check flagged a claim the cited records do not support. Treat this with caution and read each linked source.',
          );
        } else if (verdict.verdict === 'partial') {
          structured.confidence = clampToPartial(structured.confidence);
          structured.limits = appendLimit(
            structured.limits,
            'A faithfulness check found claims the cited records do not fully support. Lean on the linked records below.',
          );
        }
      } else {
        faithfulness = { checked: false, verdict: 'unchecked', unsupportedClaims: [] };
      }
    }

    // 5c. Corpus gap sensor. A THIN answer (confidence is now final after the
    // faithfulness clamp) means the Matrix could not confidently answer, so log
    // the question as an acquisition demand signal. Awaited for durability but
    // fully defensive: it never throws and no-ops before the migration lands.
    if (shouldRecordGap(structured.confidence, citations.length)) {
      await recordGap({
        question,
        surface,
        intent: plan.intent,
        confidence: structured.confidence,
        citationCount: citations.length,
        bestDistance: retrieved.bestDistance,
        relaxed: retrieved.relaxed ?? false,
        planSource: plan.source,
        categories: plan.filters.cat,
      });
    }

    // 6. Back-compat prose + public citations.
    const answer = flattenAnswer(structured);
    const publicCitations = citations.map(publicCitation);

    return NextResponse.json({
      question,
      surface,
      answer,
      answerStructured: structured,
      citations: publicCitations,
      retrieval: {
        mode: retrieved.mode,
        total: retrieved.total,
        provider: providerName,
        bestDistance: retrieved.bestDistance,
        verifiedShare: verifiedShareOf(citations),
        intent: plan.intent as QueryIntent,
        queries: plan.queries.length,
        planSource: plan.source,
        weak,
        // True when the planner's narrow facets zeroed the first pass and a
        // broadened retry was used. The records are real but less tightly
        // scoped to the original facets.
        relaxed: retrieved.relaxed ?? false,
      },
      // Additive + nullable. Present only when the answer cleared the >=3-citation
      // gate; null otherwise (no UI consumes it yet, surfaced for the next phase).
      faithfulness,
      followups,
      relatedIssues,
      gaps,
      researchTrail,
      actions,
    });
  } catch (error) {
    console.error('[Ask the Matrix] failed:', error);
    return NextResponse.json({ error: 'Ask the Matrix could not answer right now.' }, { status: 500 });
  }
}

function verifiedShareOf(citations: Citation[]): number {
  const cases = citations.filter((c) => c.kind === 'case');
  if (cases.length === 0) return 0;
  const verified = cases.filter((c) => c.verified === true).length;
  return verified / cases.length;
}
