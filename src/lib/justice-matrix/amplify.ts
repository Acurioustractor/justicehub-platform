/**
 * Ask the Matrix — amplification layer.
 *
 * Turns a single grounded answer into real next moves: follow-up questions,
 * related issue pages, gap signals when the corpus is thin, a research trail of
 * pre-built /explore URLs, and typed actions. Every output is deterministic
 * string/URL construction over REAL records plus the real justice_matrix_issues
 * table. Only `followups` MAY use a provider (template fallback is computed
 * first, always). Zero DB writes. No fabrication: every href points at a REAL
 * route or names an authority as plain text (href:null).
 *
 * Copy rules: no em-dash, no AI-vocab, keep the not-legal-advice boundary.
 */

export type Surface = 'all' | 'refugee' | 'youth';
type SourceKind = 'case' | 'campaign' | 'evidence';

// Citation shape this module reads. The ask route threads categories +
// jurisdiction/country_code onto each citation (see route toCitation); only the
// fields used here are declared. id/label/title/kind are always present.
export interface Citation {
  id: string;
  label: string;
  kind: SourceKind;
  title: string;
  meta?: string;
  categories?: string[] | null;
  jurisdiction?: string | null;
  country_code?: string | null;
}

// A published row from justice_matrix_issues. Slugs are REAL; never invented.
export interface IssueRow {
  slug: string;
  title: string;
  surface: string;
  category_tags: string[];
  question: string;
}

export interface Followup {
  id: string;
  text: string;
  askPayload: { question: string; surface: Surface };
  origin: 'issue' | 'category' | 'llm' | 'template';
}

export interface RelatedIssue {
  slug: string;
  title: string;
  surface: string;
  href: string;
  matchedCategories: string[];
  recordCount: number;
}

export interface GapRoute {
  label: string;
  href: string | null; // null => name-only external authority, never a fabricated deep link
  external: boolean;
}

export interface Gap {
  kind: 'no-records' | 'thin-records' | 'no-australian' | 'no-evidence' | 'consent-restricted';
  message: string;
  routes: GapRoute[];
}

export interface TrailMove {
  label: string;
  move: 'broaden' | 'narrow' | 'adjacent-jurisdiction' | 'same-tactic';
  href: string;
}

export interface Action {
  id: 'export' | 'follow-issue' | 'contribute' | 'open-map';
  label: string;
  href: string;
  method: 'GET' | 'POST' | 'link';
  enabled: boolean;
  payloadHint?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// A short keyword string for facet URLs / export. The original question, scrubbed
// of the characters /search and /export already strip, capped so URLs stay sane.
function keywordFor(question: string): string {
  return question.replace(/[,()*%]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isAuText(text: string | null | undefined): boolean {
  return /australia/i.test(text ?? '');
}

// Surface label in plain prose (no em-dash, no AI-vocab).
function surfaceLabel(surface: Surface): string {
  if (surface === 'refugee') return 'refugee and asylum';
  if (surface === 'youth') return 'youth justice';
  return 'this area';
}

// ---------------------------------------------------------------------------
// citationCategories — union of categories across all citations
// ---------------------------------------------------------------------------

export function citationCategories(citations: Citation[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of citations) {
    for (const cat of c.categories ?? []) {
      const key = cat.toLowerCase();
      if (cat && !seen.has(key)) {
        seen.add(key);
        out.push(cat);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// buildRelatedIssues — issues whose category_tags overlap this answer's records
// ---------------------------------------------------------------------------

export function buildRelatedIssues(
  issues: IssueRow[],
  cats: string[],
  citations: Citation[],
  surface: Surface,
): RelatedIssue[] {
  const catSet = new Set(cats.map((c) => c.toLowerCase()));
  if (catSet.size === 0) return [];

  const scored = issues
    .map((issue) => {
      const tags = (issue.category_tags ?? []).filter(Boolean);
      const matched = tags.filter((t) => catSet.has(t.toLowerCase()));
      if (matched.length === 0) return null;
      // recordCount = THIS answer's citations whose categories intersect the
      // issue's tags. Real overlap only; no inflation.
      const tagSet = new Set(tags.map((t) => t.toLowerCase()));
      const recordCount = citations.filter((c) =>
        (c.categories ?? []).some((cc) => tagSet.has((cc ?? '').toLowerCase())),
      ).length;
      const related: RelatedIssue = {
        slug: issue.slug,
        title: issue.title,
        surface: issue.surface,
        href: `/justice-matrix/issues/${issue.slug}`,
        matchedCategories: matched,
        recordCount,
      };
      return related;
    })
    .filter((x): x is RelatedIssue => x !== null);

  // Rank: same-surface first, then more matched categories, then more records.
  scored.sort((a, b) => {
    const sa = a.surface === surface ? 0 : 1;
    const sb = b.surface === surface ? 0 : 1;
    if (sa !== sb) return sa - sb;
    if (b.matchedCategories.length !== a.matchedCategories.length) {
      return b.matchedCategories.length - a.matchedCategories.length;
    }
    return b.recordCount - a.recordCount;
  });

  return scored.slice(0, 3);
}

// ---------------------------------------------------------------------------
// buildGaps — only when retrieval is thin. Names what the Matrix does NOT cover.
// ---------------------------------------------------------------------------

export function buildGaps(
  citations: Citation[],
  retrieval: { weak: boolean; mode: string },
  surface: Surface,
): Gap[] {
  const gaps: Gap[] = [];
  const count = citations.length;
  const cases = citations.filter((c) => c.kind === 'case');
  const evidence = citations.filter((c) => c.kind === 'evidence');

  // External authorities are name-only (href:null) — never a fabricated deep link.
  const refugeeAuthorities: GapRoute[] = [
    { label: 'HUDOC (European Court of Human Rights case-law)', href: null, external: true },
    { label: 'UNHCR Refworld', href: null, external: true },
  ];
  const auAuthorities: GapRoute[] = [
    { label: 'AustLII (Australasian Legal Information Institute)', href: null, external: true },
  ];
  const contributeRoute: GapRoute = {
    label: 'Contribute a record you know about',
    href: '/justice-matrix/contribute',
    external: false,
  };

  if (count === 0) {
    gaps.push({
      kind: 'no-records',
      message: `The Matrix returned no records for this question in ${surfaceLabel(surface)}. The corpus may not hold material on this yet.`,
      routes: [
        ...(surface === 'refugee' ? refugeeAuthorities : auAuthorities),
        contributeRoute,
      ],
    });
    return gaps;
  }

  if ((retrieval.weak || count < 3) && count > 0) {
    gaps.push({
      kind: 'thin-records',
      message: `Only ${count} record${count === 1 ? '' : 's'} matched closely. Treat this as a starting point and confirm against a primary source before relying on it.`,
      routes: [contributeRoute],
    });
  }

  // No Australian case material when the lens or question is Australian.
  if (surface === 'youth' && cases.length > 0) {
    const hasAu = cases.some((c) => isAuText(c.jurisdiction) || c.country_code === 'AU');
    if (!hasAu) {
      gaps.push({
        kind: 'no-australian',
        message:
          'No Australian case was retrieved for this youth-justice question. The Matrix may hold relevant evidence studies but not litigation on point.',
        routes: [...auAuthorities, contributeRoute],
      });
    }
  }

  // Youth lens with no evidence study returned — the evidence lane is the point.
  if (surface === 'youth' && evidence.length === 0) {
    gaps.push({
      kind: 'no-evidence',
      message:
        'No Australian evidence study matched this question. The 595 evidence records are research and evaluations, not legal outcomes.',
      routes: [contributeRoute],
    });
  }

  return gaps.slice(0, 3);
}

// ---------------------------------------------------------------------------
// buildResearchTrail — pre-built /explore URLs over REAL facet params only
// ---------------------------------------------------------------------------

const EXPLORE = '/justice-matrix/explore';

function trailHref(params: Record<string, string>): string {
  const sp = new URLSearchParams();
  // Only REAL facet params: q, mode, type, cat, scope, region, country, outcome, strength.
  const allowed = ['q', 'mode', 'type', 'cat', 'scope', 'region', 'country', 'outcome', 'strength'];
  for (const key of allowed) {
    const v = params[key];
    if (v) sp.set(key, v);
  }
  return `${EXPLORE}?${sp.toString()}`;
}

export function buildResearchTrail(
  question: string,
  cats: string[],
  citations: Citation[],
  surface: Surface,
): TrailMove[] {
  const moves: TrailMove[] = [];
  const kw = keywordFor(question);
  const hasCase = citations.some((c) => c.kind === 'case');
  const hasCampaign = citations.some((c) => c.kind === 'campaign');
  const scope = surface === 'youth' ? 'au' : surface === 'refugee' ? 'global' : 'all';

  // broaden: always. Drop the category filter, keep the keyword.
  moves.push({
    label: 'Broaden: search the keyword across every record type',
    move: 'broaden',
    href: trailHref({ q: kw, mode: 'semantic', type: 'all', scope: scope === 'all' ? '' : scope }),
  });

  // narrow: only when there is at least one category to narrow by.
  if (cats.length > 0) {
    moves.push({
      label: `Narrow: filter to ${cats.slice(0, 3).join(', ')}`,
      move: 'narrow',
      href: trailHref({
        q: kw,
        mode: 'semantic',
        type: 'all',
        cat: cats.slice(0, 3).join(','),
        scope: scope === 'all' ? '' : scope,
      }),
    });
  }

  // adjacent-jurisdiction: only when at least one case citation exists. Flip the
  // AU/global lens to find comparable cases in the other jurisdiction set.
  if (hasCase) {
    const flipped = scope === 'au' ? 'global' : 'au';
    moves.push({
      label:
        flipped === 'au'
          ? 'Adjacent jurisdiction: look for Australian cases on the same point'
          : 'Adjacent jurisdiction: look for international cases on the same point',
      move: 'adjacent-jurisdiction',
      href: trailHref({ q: kw, mode: 'semantic', type: 'case', scope: flipped }),
    });
  }

  // same-tactic: only when at least one campaign citation exists.
  if (hasCampaign) {
    moves.push({
      label: 'Same tactic: find campaigns using a similar approach',
      move: 'same-tactic',
      href: trailHref({ q: kw, mode: 'semantic', type: 'campaign', scope: scope === 'all' ? '' : scope }),
    });
  }

  return moves.slice(0, 4);
}

// ---------------------------------------------------------------------------
// buildActions — up to 4 typed links / hints over REAL routes
// ---------------------------------------------------------------------------

export function buildActions(
  cats: string[],
  surface: Surface,
  related: RelatedIssue[],
  citations: Citation[],
): Action[] {
  const actions: Action[] = [];
  const kw = ''; // export uses q from the explore keyword; left blank here, the caller fills via question
  const hasCaseOrCampaign = citations.some((c) => c.kind === 'case' || c.kind === 'campaign');

  // export: covers case|campaign (NOT evidence). Enabled only with a case/campaign hit.
  const exportType = citations.some((c) => c.kind === 'case') ? 'case' : 'campaign';
  const exportParams = new URLSearchParams({ type: exportType, format: 'csv' });
  if (cats.length) exportParams.set('cat', cats.slice(0, 3).join(','));
  actions.push({
    id: 'export',
    label: 'Export these records as CSV',
    href: `/api/justice-matrix/export?${exportParams.toString()}`,
    method: 'GET',
    enabled: hasCaseOrCampaign,
  });

  // follow-issue: POST /follow, enabled only when there is a related issue to follow.
  const followEnabled = related.length > 0;
  const followAction: Action = {
    id: 'follow-issue',
    label: followEnabled ? `Follow updates on "${related[0].title}"` : 'Follow an issue for updates',
    href: '/api/justice-matrix/follow',
    method: 'POST',
    enabled: followEnabled,
  };
  if (followEnabled) {
    followAction.payloadHint = { issue_slug: related[0].slug, issue_title: related[0].title };
  }
  actions.push(followAction);

  // contribute: always enabled.
  actions.push({
    id: 'contribute',
    label: 'Contribute a record',
    href: '/justice-matrix/contribute',
    method: 'link',
    enabled: true,
  });

  // open-map: youth -> au, refugee -> global, all -> no scope param.
  const mapHref =
    surface === 'youth'
      ? '/justice-matrix/map?scope=au'
      : surface === 'refugee'
        ? '/justice-matrix/map?scope=global'
        : '/justice-matrix/map';
  actions.push({
    id: 'open-map',
    label: 'Open the map',
    href: mapHref,
    method: 'link',
    enabled: true,
  });

  void kw;
  return actions.slice(0, 4);
}

// ---------------------------------------------------------------------------
// templateFollowups — guaranteed, deterministic. Computed BEFORE any LLM call.
// ---------------------------------------------------------------------------

export function templateFollowups(
  question: string,
  related: RelatedIssue[],
  cats: string[],
  surface: Surface,
): Followup[] {
  const out: Followup[] = [];
  const push = (text: string, origin: Followup['origin']) => {
    if (out.length >= 5) return;
    if (out.some((f) => f.text.toLowerCase() === text.toLowerCase())) return;
    out.push({ id: cryptoId(), text, askPayload: { question: text, surface }, origin });
  };

  // From real related issues. The issue title is a REAL editorial framing, so a
  // follow-up that points at it is corpus-answerable and never fabricated.
  for (const issue of related.slice(0, 2)) {
    if (issue.title && issue.title.length >= 4) {
      push(`What does the Matrix hold on ${issue.title}?`.slice(0, 160), 'issue');
    }
  }

  // From categories present in the retrieved records.
  for (const cat of cats.slice(0, 2)) {
    const readable = cat.replace(/-/g, ' ');
    push(`What does the Matrix hold on ${readable}?`, 'category');
  }

  // Surface-aware defaults so we always return 3-5.
  const defaults =
    surface === 'refugee'
      ? [
          'Which cases address non-refoulement at sea?',
          'What campaigns challenge offshore detention and third-country transfer?',
          'How have courts treated immigration detention oversight?',
        ]
      : surface === 'youth'
        ? [
            'What evidence supports raising the age of criminal responsibility?',
            'Which justice reinvestment programs show results in Australia?',
            'What do inquiries say about children in detention?',
          ]
        : [
            'Which cases set the strongest precedent in this area?',
            'What campaigns work alongside the litigation?',
            'What evidence backs the strategy?',
          ];
  for (const d of defaults) push(d, 'template');

  return out.slice(0, 5);
}

// crypto.randomUUID, with a non-throwing fallback for older runtimes.
function cryptoId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `fu-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Follow-up prompt + parser for the optional one-shot LLM path.
// ---------------------------------------------------------------------------

export function followupSystemPrompt(): string {
  return [
    'You suggest follow-up questions for a legal research index.',
    'The index holds strategic-litigation cases, advocacy campaigns, and Australian youth-justice evidence studies.',
    'Suggest 3 to 5 short follow-up questions the index can plausibly answer, building on the records already shown.',
    'Each question is one line, under 160 characters, plain language, no legal advice.',
    'Return ONLY JSON: {"followups": ["...", "..."]}. Never invent a case, campaign, or outcome.',
  ].join('\n');
}

export function followupUserPrompt(
  question: string,
  citationTitles: string[],
  issueTitles: string[],
): string {
  return [
    `Original question: ${question}`,
    '',
    'Records already shown:',
    ...citationTitles.slice(0, 8).map((t) => `- ${t}`),
    issueTitles.length ? '' : '',
    issueTitles.length ? 'Related issue pages:' : '',
    ...issueTitles.slice(0, 4).map((t) => `- ${t}`),
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

// Parse the LLM follow-up payload. JSON.parse + per-item string guard (<=160
// chars). Returns null on any failure -> caller uses templateFollowups.
export function parseFollowups(raw: string, surface: Surface): Followup[] | null {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return null;
      parsed = JSON.parse(m[0]);
    }
    const arr = (parsed as { followups?: unknown })?.followups;
    if (!Array.isArray(arr)) return null;
    const out: Followup[] = [];
    for (const item of arr) {
      if (typeof item !== 'string') continue;
      const text = item.replace(/\s+/g, ' ').trim();
      if (text.length < 6 || text.length > 160) continue;
      if (out.some((f) => f.text.toLowerCase() === text.toLowerCase())) continue;
      out.push({ id: cryptoId(), text, askPayload: { question: text, surface }, origin: 'llm' });
      if (out.length >= 5) break;
    }
    return out.length >= 1 ? out : null;
  } catch {
    return null;
  }
}
