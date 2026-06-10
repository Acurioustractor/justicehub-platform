import { createServiceClient } from '@/lib/supabase/service';
import sitesData from '@/data/justice-reinvestment/sites.json';

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

/** Loads and shapes the curated sites.json layer for the map and enrichment. */
export function loadJusticeReinvestmentSites(): JrSite[] {
  const raw = (sitesData as { sites: RawSite[] }).sites;
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
  name: string;
  description: string | null;
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
  /** The matching DB intervention's description, trimmed. */
  description: string | null;
  /** All programs the lead organisation runs (verified rows only). */
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
 *   3. For the distinct set of organisation ids, fetch ALL their verified
 *      programs and their funding records in two batched queries.
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
    .select('id, name, description, operating_organization_id, verification_status')
    .or('name.ilike.%reinvest%,description.ilike.%justice reinvestment%')
    .neq('verification_status', 'ai_generated');

  if (error || !jrRows) return {};

  const interventionByName = new Map<
    string,
    { description: string | null; orgId: string | null }
  >();
  for (const r of jrRows as any[]) {
    interventionByName.set(String(r.name).trim().toLowerCase(), {
      description: r.description ?? null,
      orgId: r.operating_organization_id ?? null,
    });
  }

  // Resolve each curated site to a lead organisation id.
  const siteToOrg = new Map<string, { orgId: string; description: string | null }>();
  const orgIds = new Set<string>();
  for (const site of sites) {
    const hit = interventionByName.get(site.matchName.trim().toLowerCase());
    if (hit?.orgId) {
      siteToOrg.set(site.matchName, {
        orgId: hit.orgId,
        description: hit.description,
      });
      orgIds.add(hit.orgId);
    }
  }

  if (orgIds.size === 0) return {};
  const ids = Array.from(orgIds);

  const [{ data: orgRows }, { data: programRows }, { data: fundingRows }] =
    await Promise.all([
      supabase.from('organizations').select('id, name').in('id', ids),
      supabase
        .from('alma_interventions')
        .select('name, description, operating_organization_id, verification_status')
        .in('operating_organization_id', ids)
        .neq('verification_status', 'ai_generated')
        .order('name'),
      supabase
        .from('justice_funding')
        .select('amount_dollars, source, alma_organization_id')
        .in('alma_organization_id', ids)
        .order('amount_dollars', { ascending: false, nullsFirst: false }),
    ]);

  const orgNameById = new Map<string, string>();
  (orgRows || []).forEach((o: any) => orgNameById.set(o.id, o.name));

  const programsByOrg = new Map<string, JrSiteProgram[]>();
  (programRows || []).forEach((p: any) => {
    const list = programsByOrg.get(p.operating_organization_id) ?? [];
    list.push({
      name: p.name,
      description: trimText(p.description, DESCRIPTION_MAX),
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
  for (const [matchName, { orgId, description }] of siteToOrg.entries()) {
    index[matchName] = {
      orgName: orgNameById.get(orgId) ?? null,
      description: trimText(description, DESCRIPTION_MAX),
      programs: programsByOrg.get(orgId) ?? [],
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
  abn: string | null;
  charityStatus: string | null;
  boardLinks: string[];
  relatedSites: string[];
  sources: string[];
}

/** A plain record keyed by `match_name`, or empty when the file is absent. */
export type JrConnectionIndex = Record<string, JrSiteConnection>;

interface RawConnection {
  site_match_name?: string;
  abn?: string | null;
  charity_status?: string | null;
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
      abn: entry.abn ?? null,
      charityStatus: entry.charity_status ?? null,
      boardLinks: Array.isArray(entry.board_links) ? entry.board_links : [],
      relatedSites: Array.isArray(entry.related_sites) ? entry.related_sites : [],
      sources: Array.isArray(entry.sources) ? entry.sources : [],
    };
  }
  return index;
}
