import { createServiceClient } from '@/lib/supabase/service';

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
