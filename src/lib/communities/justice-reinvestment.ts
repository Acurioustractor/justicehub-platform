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
