import { createServiceClient } from '@/lib/supabase/service';
import sitesData from '@/data/justice-reinvestment/sites.json';
import { slugifyBase } from '@/lib/communities/jr-profile-helpers';

/**
 * Server-only data access for the justice reinvestment network view.
 *
 * Reads existing tables only. The `alma_interventions` read is guarded with
 * `.neq('verification_status', 'ai_generated')` per the ALMA data rules.
 *
 * `alma_interventions` has NO `location_state` column. Place comes from the
 * lead organisation via `operating_organization_id`, joined in JavaScript
 * (two queries) so the join shape stays explicit and the state-grouping logic
 * lives in one place.
 *
 * Verified against the live database 2026-06-10: the query returns ~55 rows
 * (54 `verified`, 1 `community_verified`), 53 carry a lead organisation id,
 * and the states present are NSW, NT, SA, QLD, VIC, with the remainder having
 * no recorded state.
 */

export interface JrInitiative {
  id: string;
  name: string;
  verificationStatus: string | null;
  /** Lead organisation name, or null when no organisation is recorded. */
  orgName: string | null;
  /** State derived from the lead organisation, or null when unknown. */
  state: string | null;
  isIndigenousOrg: boolean;
}

export interface JrStateGroup {
  /** Group key used for ordering and the heading. */
  key: string;
  /** Human heading for the section. */
  label: string;
  initiatives: JrInitiative[];
}

export interface JrNetworkData {
  initiatives: JrInitiative[];
  groups: JrStateGroup[];
  counts: {
    total: number;
    withLeadOrg: number;
    states: number;
    placeToConfirm: number;
    communityVerified: number;
  };
}

/**
 * Ordering for the state sections. Real states first in a deliberate order,
 * then National, then the honesty bucket for rows with no recorded place.
 */
const STATE_ORDER: { key: string; label: string }[] = [
  { key: 'NSW', label: 'New South Wales' },
  { key: 'NT', label: 'Northern Territory' },
  { key: 'QLD', label: 'Queensland' },
  { key: 'SA', label: 'South Australia' },
  { key: 'WA', label: 'Western Australia' },
  { key: 'VIC', label: 'Victoria' },
  { key: 'ACT', label: 'Australian Capital Territory' },
  { key: 'TAS', label: 'Tasmania' },
  { key: 'National', label: 'National' },
];

const PLACE_TO_CONFIRM = 'place-to-confirm';

/** Normalise a raw state value onto a known group key, or the confirm bucket. */
function groupKeyForState(state: string | null): string {
  if (!state) return PLACE_TO_CONFIRM;
  const upper = state.trim().toUpperCase();
  const match = STATE_ORDER.find((s) => s.key.toUpperCase() === upper);
  return match ? match.key : PLACE_TO_CONFIRM;
}

export async function loadJusticeReinvestmentNetwork(): Promise<JrNetworkData> {
  const supabase = createServiceClient() as any;

  const { data: rows, error } = await supabase
    .from('alma_interventions')
    .select('id, name, verification_status, operating_organization_id')
    .or('name.ilike.%reinvest%,description.ilike.%justice reinvestment%')
    .neq('verification_status', 'ai_generated')
    .order('name');

  if (error || !rows) {
    return {
      initiatives: [],
      groups: [],
      counts: {
        total: 0,
        withLeadOrg: 0,
        states: 0,
        placeToConfirm: 0,
        communityVerified: 0,
      },
    };
  }

  const orgIds = Array.from(
    new Set(
      rows
        .map((r: any) => r.operating_organization_id)
        .filter((id: string | null): id is string => !!id)
    )
  );

  const orgMap = new Map<
    string,
    { name: string; state: string | null; isIndigenousOrg: boolean }
  >();

  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, state, is_indigenous_org')
      .in('id', orgIds);
    (orgs || []).forEach((o: any) => {
      orgMap.set(o.id, {
        name: o.name,
        state: o.state ?? null,
        isIndigenousOrg: !!o.is_indigenous_org,
      });
    });
  }

  const initiatives: JrInitiative[] = rows.map((r: any) => {
    const org = r.operating_organization_id
      ? orgMap.get(r.operating_organization_id)
      : undefined;
    return {
      id: r.id,
      name: r.name,
      verificationStatus: r.verification_status ?? null,
      orgName: org?.name ?? null,
      state: org?.state ?? null,
      isIndigenousOrg: org?.isIndigenousOrg ?? false,
    };
  });

  // Bucket by state group key.
  const buckets = new Map<string, JrInitiative[]>();
  for (const initiative of initiatives) {
    const key = groupKeyForState(initiative.state);
    const list = buckets.get(key) ?? [];
    list.push(initiative);
    buckets.set(key, list);
  }

  const groups: JrStateGroup[] = [];
  for (const { key, label } of STATE_ORDER) {
    const list = buckets.get(key);
    if (list && list.length > 0) {
      groups.push({ key, label, initiatives: list });
    }
  }
  const confirmList = buckets.get(PLACE_TO_CONFIRM);
  if (confirmList && confirmList.length > 0) {
    groups.push({
      key: PLACE_TO_CONFIRM,
      label: 'Place to confirm',
      initiatives: confirmList,
    });
  }

  const realStateKeys = new Set(
    groups
      .filter((g) => g.key !== PLACE_TO_CONFIRM)
      .map((g) => g.key)
  );

  return {
    initiatives,
    groups,
    counts: {
      total: initiatives.length,
      withLeadOrg: initiatives.filter((i) => i.orgName).length,
      states: realStateKeys.size,
      placeToConfirm: confirmList?.length ?? 0,
      communityVerified: initiatives.filter(
        (i) => i.verificationStatus === 'community_verified'
      ).length,
    },
  };
}

/**
 * A justice reinvestment site from the curated sites.json layer. This is the
 * hand-sourced map dataset, kept separate from the DB-driven list above so the
 * list still renders DB rows that have no curated enrichment yet.
 */
export interface JrSite {
  matchName: string;
  displayName: string;
  org: string;
  state: string;
  town: string;
  lat: number | null;
  lng: number | null;
  website: string | null;
  logoUrl: string | null;
  blurb: string;
  profileSlug: string | null;
  /**
   * Stable public URL key for the per-site detail page at
   * /communities/justice-reinvestment/[siteSlug]. Derived from the display name
   * with a deterministic uniqueness guard so two sites never collide.
   */
  siteSlug: string;
}

/** A curated site shaped for enriching a DB list row, joined by match_name. */
export interface JrSiteEnrichment {
  website: string | null;
  blurb: string;
  town: string;
}

/**
 * Maps a curated site to an anchor profile slug, only for the four founding
 * profiles. Matched by a stable substring of the site's org / display name so
 * a wording change does not silently break the link.
 */
const PROFILE_SLUG_RULES: { slug: string; needle: string }[] = [
  { slug: 'oonchiumpa', needle: 'oonchiumpa' },
  { slug: 'palm-island-community-company', needle: 'palm island' },
  { slug: 'bg-fit', needle: 'bg fit' },
  { slug: 'mmeic', needle: 'minjerribah moorgumpin' },
];

function profileSlugFor(displayName: string, org: string): string | null {
  const haystack = `${displayName} ${org}`.toLowerCase();
  for (const rule of PROFILE_SLUG_RULES) {
    if (haystack.includes(rule.needle)) return rule.slug;
  }
  return null;
}

interface RawSite {
  match_name: string;
  display_name: string;
  org: string;
  state: string;
  town: string;
  lat: number | null;
  lng: number | null;
  website: string | null;
  logo_url: string | null;
  blurb: string;
}

/**
 * Builds a stable, unique site slug from the display name. On a collision the
 * town (then a numeric suffix) is appended so the URL stays deterministic and
 * one site never shadows another.
 */
function buildSiteSlug(displayName: string, town: string, seen: Set<string>): string {
  let base = slugifyBase(displayName);
  if (seen.has(base)) {
    const withTown = slugifyBase(`${displayName} ${town}`);
    base = withTown !== base ? withTown : base;
  }
  let slug = base;
  let n = 2;
  while (seen.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  seen.add(slug);
  return slug;
}

/** Loads and shapes the curated sites.json layer for the map and enrichment. */
export function loadJusticeReinvestmentSites(): JrSite[] {
  const raw = (sitesData as { sites: RawSite[] }).sites;
  const seenSlugs = new Set<string>();
  return raw.map((s) => ({
    matchName: s.match_name,
    displayName: s.display_name,
    org: s.org,
    state: s.state,
    town: s.town,
    lat: s.lat,
    lng: s.lng,
    website: s.website,
    logoUrl: s.logo_url,
    blurb: s.blurb,
    profileSlug: profileSlugFor(s.display_name, s.org),
    siteSlug: buildSiteSlug(s.display_name, s.town, seenSlugs),
  }));
}

/**
 * Builds a match_name -> enrichment index so a DB list row can be enriched with
 * the curated website and blurb when its name matches a curated site exactly.
 */
export function buildSiteEnrichmentIndex(
  sites: JrSite[]
): Map<string, JrSiteEnrichment> {
  const index = new Map<string, JrSiteEnrichment>();
  for (const site of sites) {
    index.set(site.matchName.trim().toLowerCase(), {
      website: site.website,
      blurb: site.blurb,
      town: site.town,
    });
  }
  return index;
}

/* ------------------------------------------------------------------ */
/* Per-site organisation detail index (for the full-screen sidebar)    */
/* ------------------------------------------------------------------ */

/** One program an organisation runs, trimmed for the sidebar. */
export interface JrSiteProgram {
  id: string | null;
  name: string;
  description: string | null;
  type: string | null;
  evidenceLevel: string | null;
}

/** One funding record for an organisation. */
export interface JrSiteFunding {
  amountDollars: number | null;
  source: string | null;
}

/**
 * Everything the sidebar needs for one site, keyed by the curated site's
 * `match_name`. Built once on the server and passed to the client as a plain,
 * serialisable record. No per-click fetches.
 */
export interface JrSiteDetail {
  /** Lead organisation name as recorded in the database. */
  orgName: string | null;
  /** Canonical organisation slug when there is a matched profile page. */
  orgSlug: string | null;
  /** Current organisation verification status. */
  orgVerificationStatus: string | null;
  /** Latest community claim status for the lead organisation. */
  claimStatus:
    | 'pending'
    | 'verified'
    | 'community_verified'
    | 'rejected'
    | 'revoked'
    | null;
  /** Latest claimant name, used only for a small trust signal. */
  claimContactName: string | null;
  /** The matching DB intervention's description, trimmed. */
  description: string | null;
  /** The exact intervention record that matches this curated site. */
  siteProgram: JrSiteProgram | null;
  /** Other verified rows the lead organisation runs, shown as secondary context. */
  programs: JrSiteProgram[];
  /** Funding records for the lead organisation, largest first. */
  funding: JrSiteFunding[];
}

/** A plain record keyed by `match_name`, safe to serialise to the client. */
export type JrSiteDetailIndex = Record<string, JrSiteDetail>;

const DESCRIPTION_MAX = 300;
/** Keep the funding list focused; the largest figures carry the argument. */
const FUNDING_MAX = 12;

/** Trim a string to a maximum length, appending an ellipsis when cut. */
function trimText(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Builds the per-site organisation detail index for the full-screen sidebar.
 *
 * Strategy, all server-side:
 *   1. Find every justice reinvestment intervention (same guarded query as the
 *      network loader) and key it by lowercased name.
 *   2. Resolve each curated site to its lead organisation id by exact name
 *      match against `match_name`.
 *   3. For the distinct set of organisation ids, fetch their verified
 *      programs, claim state, and funding records in batched queries.
 *   4. Assemble a record keyed by `match_name`.
 *
 * On any database error this returns an empty index, so the map still renders
 * with the curated blurb alone.
 */
export async function buildSiteOrgIndex(
  sites: JrSite[]
): Promise<JrSiteDetailIndex> {
  const supabase = createServiceClient() as any;

  const { data: jrRows, error } = await supabase
    .from('alma_interventions')
    .select('id, name, type, description, evidence_level, operating_organization_id, verification_status')
    .or('name.ilike.%reinvest%,description.ilike.%justice reinvestment%')
    .neq('verification_status', 'ai_generated');

  if (error || !jrRows) return {};

  const interventionByName = new Map<
    string,
    {
      id: string | null;
      name: string;
      description: string | null;
      orgId: string | null;
      type: string | null;
      evidenceLevel: string | null;
    }
  >();
  for (const r of jrRows as any[]) {
    interventionByName.set(String(r.name).trim().toLowerCase(), {
      id: r.id ?? null,
      name: r.name,
      description: r.description ?? null,
      orgId: r.operating_organization_id ?? null,
      type: r.type ?? null,
      evidenceLevel: r.evidence_level ?? null,
    });
  }

  // Resolve each curated site to a lead organisation id.
  const siteToOrg = new Map<
    string,
    {
      orgId: string;
      description: string | null;
      siteProgram: JrSiteProgram;
    }
  >();
  const orgIds = new Set<string>();
  for (const site of sites) {
    const hit = interventionByName.get(site.matchName.trim().toLowerCase());
    if (hit?.orgId) {
      siteToOrg.set(site.matchName, {
        orgId: hit.orgId,
        description: hit.description,
        siteProgram: {
          id: hit.id,
          name: hit.name,
          description: trimText(hit.description, DESCRIPTION_MAX),
          type: hit.type,
          evidenceLevel: hit.evidenceLevel,
        },
      });
      orgIds.add(hit.orgId);
    }
  }

  if (orgIds.size === 0) return {};
  const ids = Array.from(orgIds);

  const [
    { data: orgRows },
    { data: programRows },
    { data: fundingRows },
    { data: claimRows },
  ] =
    await Promise.all([
      supabase
        .from('organizations')
        .select('id, name, slug, verification_status')
        .in('id', ids),
      supabase
        .from('alma_interventions')
        .select('id, name, type, description, evidence_level, operating_organization_id, verification_status')
        .in('operating_organization_id', ids)
        .neq('verification_status', 'ai_generated')
        .order('name'),
      supabase
        .from('justice_funding')
        .select('amount_dollars, source, alma_organization_id')
        .in('alma_organization_id', ids)
        .order('amount_dollars', { ascending: false, nullsFirst: false }),
      supabase
        .from('organization_claims')
        .select('organization_id, status, contact_name, verified_at, created_at')
        .in('organization_id', ids)
        .in('status', ['pending', 'verified', 'community_verified'])
        .order('verified_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
    ]);

  const orgById = new Map<
    string,
    { name: string; slug: string | null; verificationStatus: string | null }
  >();
  (orgRows || []).forEach((o: any) =>
    orgById.set(o.id, {
      name: o.name,
      slug: o.slug ?? null,
      verificationStatus: o.verification_status ?? null,
    })
  );

  const claimByOrg = new Map<
    string,
    {
      status:
        | 'pending'
        | 'verified'
        | 'community_verified'
        | 'rejected'
        | 'revoked'
        | null;
      contactName: string | null;
    }
  >();
  (claimRows || []).forEach((claim: any) => {
    if (!claim.organization_id || claimByOrg.has(claim.organization_id)) return;
    claimByOrg.set(claim.organization_id, {
      status: claim.status ?? null,
      contactName: claim.contact_name ?? null,
    });
  });

  const programsByOrg = new Map<string, JrSiteProgram[]>();
  (programRows || []).forEach((p: any) => {
    const list = programsByOrg.get(p.operating_organization_id) ?? [];
    list.push({
      id: p.id ?? null,
      name: p.name,
      description: trimText(p.description, DESCRIPTION_MAX),
      type: p.type ?? null,
      evidenceLevel: p.evidence_level ?? null,
    });
    programsByOrg.set(p.operating_organization_id, list);
  });

  const fundingByOrg = new Map<string, JrSiteFunding[]>();
  (fundingRows || []).forEach((f: any) => {
    const list = fundingByOrg.get(f.alma_organization_id) ?? [];
    if (list.length < FUNDING_MAX) {
      list.push({
        amountDollars: f.amount_dollars != null ? Number(f.amount_dollars) : null,
        source: f.source ?? null,
      });
    }
    fundingByOrg.set(f.alma_organization_id, list);
  });

  const index: JrSiteDetailIndex = {};
  for (const [matchName, { orgId, description, siteProgram }] of siteToOrg.entries()) {
    const org = orgById.get(orgId);
    const claim = claimByOrg.get(orgId);
    const programs = programsByOrg.get(orgId) ?? [];
    const exactName = matchName.trim().toLowerCase();
    const relatedPrograms = programs
      .filter((program) => program.name.trim().toLowerCase() !== exactName)
      .slice(0, 6);

    index[matchName] = {
      orgName: org?.name ?? null,
      orgSlug: org?.slug ?? null,
      orgVerificationStatus: org?.verificationStatus ?? null,
      claimStatus: claim?.status ?? null,
      claimContactName: claim?.contactName ?? null,
      description: trimText(description, DESCRIPTION_MAX),
      siteProgram,
      programs: relatedPrograms,
      funding: fundingByOrg.get(orgId) ?? [],
    };
  }

  return index;
}

/* ------------------------------------------------------------------ */
/* Optional curated connections layer (built by a separate agent)      */
/* ------------------------------------------------------------------ */

/** One curated connections entry, shaped to org-connections.json. */
export interface JrSiteConnection {
  siteMatchName: string;
  orgName: string | null;
  abn: string | null;
  charityStatus: string | null;
  oric: string | null;
  communityControlled: boolean | null;
  latestRevenue: number | null;
  boardLinks: string[];
  relatedSites: string[];
  sources: string[];
}

/** A plain record keyed by `match_name`, or empty when the file is absent. */
export type JrConnectionIndex = Record<string, JrSiteConnection>;

interface RawConnection {
  site_match_name?: string;
  org_name?: string | null;
  abn?: string | null;
  charity_status?: string | null;
  oric?: string | null;
  community_controlled?: boolean | null;
  latest_revenue?: number | null;
  board_links?: string[];
  related_sites?: string[];
  sources?: string[];
}

/**
 * Loads the optional curated connections layer if the file exists. Reads the
 * file from disk with Node `fs` (server-only) wrapped in try/catch so the build
 * never breaks when the file is absent (another agent is producing it). Reading
 * from disk rather than a static `import`/`require` keeps the missing-file case
 * a catchable runtime no-op instead of a webpack build error. Returns an empty
 * index on any failure.
 */
export function loadJrConnectionIndex(): JrConnectionIndex {
  let raw: { connections?: RawConnection[] } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const file = path.join(
      process.cwd(),
      'src/data/justice-reinvestment/org-connections.json'
    );
    if (!fs.existsSync(file)) return {};
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
  const list = raw?.connections;
  if (!Array.isArray(list)) return {};

  const index: JrConnectionIndex = {};
  for (const entry of list) {
    if (!entry?.site_match_name) continue;
    index[entry.site_match_name] = {
      siteMatchName: entry.site_match_name,
      orgName: entry.org_name ?? null,
      abn: entry.abn ?? null,
      charityStatus: entry.charity_status ?? null,
      oric: entry.oric ?? null,
      communityControlled: entry.community_controlled ?? null,
      latestRevenue: entry.latest_revenue ?? null,
      boardLinks: Array.isArray(entry.board_links) ? entry.board_links : [],
      relatedSites: Array.isArray(entry.related_sites) ? entry.related_sites : [],
      sources: Array.isArray(entry.sources) ? entry.sources : [],
    };
  }
  return index;
}

/* ------------------------------------------------------------------ */
/* Research layer (site-research.json) + per-site profile composition  */
/* ------------------------------------------------------------------ */

/**
 * The integrity class of a reported figure. Every public figure carries one so
 * a contextual baseline or an actuarial projection can never read as a
 * community-led justice outcome. `unclassified` is the honest default until a
 * figure has been classified.
 */
export type JrMetricClass =
  | 'outcome'
  | 'process'
  | 'projection'
  | 'context'
  | 'borrowed'
  | 'unclassified';

/** Independent re-check verdict for one figure, when the verify pass has run. */
export type JrMetricVerdict = 'confirmed' | 'unconfirmed' | 'contradicted';

export interface JrResearchMetric {
  metric: string;
  value: string;
  /** The exact quote from the source that contains the figure. */
  asReported: string;
  sourceUrl: string;
  year: number | null;
  metricClass: JrMetricClass;
  /** Verdict from the adversarial verify pass, or null when not yet checked. */
  verdict: JrMetricVerdict | null;
  verifyNote: string | null;
}

export interface JrResearchHistory {
  year: number;
  event: string;
  sourceUrl: string;
}

export interface JrResearchPerson {
  name: string;
  role: string;
  sourceUrl: string;
}

export interface JrResearchNews {
  title: string;
  url: string;
  date: string | null;
  outlet: string | null;
}

/** Everything the per-site page shows from the curated research layer. */
export interface JrResearchRecord {
  matchName: string;
  confirmedWebsite: string | null;
  logoUrl: string | null;
  oneLine: string | null;
  history: JrResearchHistory[];
  programs: string[];
  people: JrResearchPerson[];
  impactMetrics: JrResearchMetric[];
  news: JrResearchNews[];
  partners: string[];
  relatedSites: string[];
  dataQuality: 'rich' | 'moderate' | 'thin' | null;
  notes: string | null;
}

interface RawResearchSite {
  match_name?: string;
  confirmed_website?: string | null;
  logo_url?: string | null;
  one_line?: string | null;
  history?: { year?: number; event?: string; source_url?: string }[];
  programs?: string[];
  people?: { name?: string; role?: string; source_url?: string }[];
  impact_metrics?: {
    metric?: string;
    value?: string;
    as_reported?: string;
    source_url?: string;
    year?: number | null;
    metric_class?: string | null;
  }[];
  news?: { title?: string; url?: string; date?: string | null; outlet?: string | null }[];
  partners?: string[];
  related_sites?: string[];
  data_quality?: string | null;
  notes?: string | null;
  verification?: {
    verified_metrics?: { metric?: string; verdict?: string; note?: string }[];
  } | null;
}

const METRIC_CLASSES: ReadonlySet<string> = new Set([
  'outcome',
  'process',
  'projection',
  'context',
  'borrowed',
]);

/** Shape one raw research row into a typed record, attaching verify verdicts. */
function shapeResearchSite(raw: RawResearchSite): JrResearchRecord {
  // Index verify verdicts by metric text so a figure shows its own re-check.
  const verdictByMetric = new Map<string, { verdict: JrMetricVerdict | null; note: string | null }>();
  for (const vm of raw.verification?.verified_metrics ?? []) {
    if (!vm.metric) continue;
    const verdict =
      vm.verdict === 'confirmed' || vm.verdict === 'unconfirmed' || vm.verdict === 'contradicted'
        ? vm.verdict
        : null;
    verdictByMetric.set(vm.metric.trim().toLowerCase(), {
      verdict,
      note: vm.note ?? null,
    });
  }

  return {
    matchName: raw.match_name ?? '',
    confirmedWebsite: raw.confirmed_website ?? null,
    logoUrl: raw.logo_url ?? null,
    oneLine: raw.one_line ?? null,
    history: (raw.history ?? [])
      .filter((h) => typeof h.year === 'number' && h.event && h.source_url)
      .map((h) => ({ year: h.year as number, event: h.event as string, sourceUrl: h.source_url as string }))
      .sort((a, b) => a.year - b.year),
    programs: (raw.programs ?? []).filter((p): p is string => !!p),
    people: (raw.people ?? [])
      .filter((p) => p.name && p.role && p.source_url)
      .map((p) => ({ name: p.name as string, role: p.role as string, sourceUrl: p.source_url as string })),
    impactMetrics: (raw.impact_metrics ?? [])
      .filter((m) => m.metric && m.value && m.source_url)
      .map((m) => {
        const v = verdictByMetric.get((m.metric as string).trim().toLowerCase());
        const cls = m.metric_class && METRIC_CLASSES.has(m.metric_class) ? (m.metric_class as JrMetricClass) : 'unclassified';
        return {
          metric: m.metric as string,
          value: m.value as string,
          asReported: m.as_reported ?? '',
          sourceUrl: m.source_url as string,
          year: typeof m.year === 'number' ? m.year : null,
          metricClass: cls,
          verdict: v?.verdict ?? null,
          verifyNote: v?.note ?? null,
        };
      }),
    news: (raw.news ?? [])
      .filter((n) => n.title && n.url)
      .map((n) => ({ title: n.title as string, url: n.url as string, date: n.date ?? null, outlet: n.outlet ?? null })),
    partners: (raw.partners ?? []).filter((p): p is string => !!p),
    relatedSites: (raw.related_sites ?? []).filter((p): p is string => !!p),
    dataQuality:
      raw.data_quality === 'rich' || raw.data_quality === 'moderate' || raw.data_quality === 'thin'
        ? raw.data_quality
        : null,
    notes: raw.notes ?? null,
  };
}

/**
 * Loads the curated research layer, keyed by lowercased `match_name`. Reads the
 * file from disk with Node `fs` (server-only) inside try/catch so a missing or
 * malformed file is a no-op, never a build break. Mirrors loadJrConnectionIndex.
 */
export function loadJrResearchIndex(): Map<string, JrResearchRecord> {
  const index = new Map<string, JrResearchRecord>();
  let raw: { sites?: RawResearchSite[] } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const file = path.join(process.cwd(), 'src/data/justice-reinvestment/site-research.json');
    if (!fs.existsSync(file)) return index;
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return index;
  }
  for (const entry of raw?.sites ?? []) {
    if (!entry?.match_name) continue;
    index.set(entry.match_name.trim().toLowerCase(), shapeResearchSite(entry));
  }
  return index;
}

/** Every per-site slug, for the network index and static-params if wanted. */
export function getAllJrSiteSlugs(): { slug: string; matchName: string }[] {
  return loadJusticeReinvestmentSites().map((s) => ({ slug: s.siteSlug, matchName: s.matchName }));
}

/**
 * Resolves one site's organisation detail (lead org, programs, funding, claim)
 * for the per-site page. Focused single-org version of buildSiteOrgIndex so a
 * page renders without building the whole index. Returns null when no lead
 * organisation is on record (the page then renders the curated layer alone).
 */
export async function loadSingleSiteDetail(site: JrSite): Promise<JrSiteDetail | null> {
  const supabase = createServiceClient() as any;

  const { data: jrRows, error } = await supabase
    .from('alma_interventions')
    .select('id, name, type, description, evidence_level, operating_organization_id, verification_status')
    .or('name.ilike.%reinvest%,description.ilike.%justice reinvestment%')
    .neq('verification_status', 'ai_generated');
  if (error || !jrRows) return null;

  const want = site.matchName.trim().toLowerCase();
  const hit = (jrRows as any[]).find((r) => String(r.name).trim().toLowerCase() === want);
  if (!hit?.operating_organization_id) return null;
  const orgId = hit.operating_organization_id as string;

  const siteProgram: JrSiteProgram = {
    id: hit.id ?? null,
    name: hit.name,
    description: trimText(hit.description, DESCRIPTION_MAX),
    type: hit.type ?? null,
    evidenceLevel: hit.evidence_level ?? null,
  };

  const [{ data: orgRows }, { data: programRows }, { data: fundingRows }, { data: claimRows }] =
    await Promise.all([
      supabase.from('organizations').select('id, name, slug, verification_status').eq('id', orgId),
      supabase
        .from('alma_interventions')
        .select('id, name, type, description, evidence_level, operating_organization_id, verification_status')
        .eq('operating_organization_id', orgId)
        .neq('verification_status', 'ai_generated')
        .order('name'),
      supabase
        .from('justice_funding')
        .select('amount_dollars, source, alma_organization_id')
        .eq('alma_organization_id', orgId)
        .order('amount_dollars', { ascending: false, nullsFirst: false }),
      supabase
        .from('organization_claims')
        .select('organization_id, status, contact_name, verified_at, created_at')
        .eq('organization_id', orgId)
        .in('status', ['pending', 'verified', 'community_verified'])
        .order('verified_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
    ]);

  const org = (orgRows || [])[0] as any | undefined;
  const claim = (claimRows || [])[0] as any | undefined;

  const exactName = want;
  const programs: JrSiteProgram[] = (programRows || [])
    .map((p: any) => ({
      id: p.id ?? null,
      name: p.name,
      description: trimText(p.description, DESCRIPTION_MAX),
      type: p.type ?? null,
      evidenceLevel: p.evidence_level ?? null,
    }))
    .filter((p: JrSiteProgram) => p.name.trim().toLowerCase() !== exactName)
    .slice(0, 6);

  const funding: JrSiteFunding[] = (fundingRows || [])
    .slice(0, FUNDING_MAX)
    .map((f: any) => ({
      amountDollars: f.amount_dollars != null ? Number(f.amount_dollars) : null,
      source: f.source ?? null,
    }));

  return {
    orgName: org?.name ?? null,
    orgSlug: org?.slug ?? null,
    orgVerificationStatus: org?.verification_status ?? null,
    claimStatus: claim?.status ?? null,
    claimContactName: claim?.contact_name ?? null,
    description: trimText(hit.description, DESCRIPTION_MAX),
    siteProgram,
    programs,
    funding,
  };
}

/** The full server-composed payload for one per-site detail page. */
export interface JrSiteProfile {
  site: JrSite;
  detail: JrSiteDetail | null;
  connection: JrSiteConnection | null;
  research: JrResearchRecord | null;
  /** match_name -> { slug, displayName } for related-site links. */
  relatedLinks: { matchName: string; slug: string; displayName: string }[];
}

/**
 * Composes everything one per-site page needs, resolved by slug. Returns null
 * when the slug matches no curated site. All reads are guarded and fall back to
 * the curated layer so a database hiccup never blanks the page.
 */
export async function loadJrSiteProfile(slug: string): Promise<JrSiteProfile | null> {
  const sites = loadJusticeReinvestmentSites();
  const site = sites.find((s) => s.siteSlug === slug);
  if (!site) return null;

  const researchIndex = loadJrResearchIndex();
  const connectionIndex = loadJrConnectionIndex();
  const research = researchIndex.get(site.matchName.trim().toLowerCase()) ?? null;
  const connection = connectionIndex[site.matchName] ?? null;

  const detail = await loadSingleSiteDetail(site).catch(() => null);

  // Build related-site links from the connection layer and the research layer.
  const byMatchName = new Map(sites.map((s) => [s.matchName.trim().toLowerCase(), s]));
  const byDisplay = new Map(sites.map((s) => [s.displayName.trim().toLowerCase(), s]));
  const relatedRaw = new Set<string>([
    ...(connection?.relatedSites ?? []),
    ...(research?.relatedSites ?? []),
  ]);
  const relatedLinks: { matchName: string; slug: string; displayName: string }[] = [];
  const seen = new Set<string>();
  for (const r of relatedRaw) {
    const key = r.trim().toLowerCase();
    const match = byMatchName.get(key) ?? byDisplay.get(key);
    if (match && match.matchName !== site.matchName && !seen.has(match.siteSlug)) {
      seen.add(match.siteSlug);
      relatedLinks.push({ matchName: match.matchName, slug: match.siteSlug, displayName: match.displayName });
    }
  }

  return { site, detail, connection, research, relatedLinks };
}
