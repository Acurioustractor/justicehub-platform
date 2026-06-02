import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  description: string | null;
  verification_status: string | null;
  city: string | null;
  state: string | null;
  tags: string[] | null;
}

type CountRow = { organization_id: string | null };
type DirectoryQuickFilter = 'all' | 'linked' | 'claimed' | 'with-services' | 'centre-partners' | 'needs-profile';
type DirectoryVerificationFilter = 'all' | 'verified' | 'claimed' | 'unverified';
type PartnerLookupRow = {
  facility_id: string | null;
  organization_id: string | null;
  program_id: string | null;
  service_id: string | null;
  partnership_type: string | null;
};
type OrgLookupRow = { id: string; organization_id: string | null };
type FacilityLookupRow = { id: string; name: string; slug: string | null; state: string | null; city: string | null };
type CentrePartnershipSummary = { count: number; centres: string[]; types: string[] };

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 100;
const RELATED_ROWS_LIMIT = 5000;
const PREFILTER_ORG_LIMIT = 1000;
// Keep PostgREST .in() URLs bounded for quick filters that start from relationship tables.
const MAX_PREFILTER_IN_IDS = 150;
const VERIFIED_STATUSES = ['verified', 'acnc_verified'];

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function cleanSearchQuery(value: string | null) {
  return (value || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s'&.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

function getEnumParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function uniqueOrgIds(rows: CountRow[] | null | undefined) {
  return Array.from(
    new Set(
      (rows || [])
        .map((row) => row.organization_id)
        .filter((id: string | null): id is string => Boolean(id))
    )
  );
}

function buildCountMap(rows: CountRow[] | null): Record<string, number> {
  const counts: Record<string, number> = {};
  rows?.forEach((row) => {
    if (row.organization_id) {
      counts[row.organization_id] = (counts[row.organization_id] || 0) + 1;
    }
  });
  return counts;
}

function addCentrePartnership(
  summaries: Record<string, CentrePartnershipSummary>,
  orgId: string,
  row: PartnerLookupRow,
  facilities: Map<string, FacilityLookupRow>
) {
  const current = summaries[orgId] || { count: 0, centres: [], types: [] };
  current.count += 1;

  if (row.facility_id) {
    const facility = facilities.get(row.facility_id);
    const label = facility ? [facility.name, facility.state].filter(Boolean).join(', ') : null;
    if (label && !current.centres.includes(label)) current.centres.push(label);
  }

  if (row.partnership_type && !current.types.includes(row.partnership_type)) {
    current.types.push(row.partnership_type);
  }

  summaries[orgId] = current;
}

async function fetchRelationshipRows(service: any, table: string, orgIds: string[]) {
  if (orgIds.length === 0) return [] as CountRow[];

  try {
    const { data, error } = await service
      .from(table)
      .select('organization_id')
      .in('organization_id', orgIds)
      .limit(RELATED_ROWS_LIMIT);

    if (error) {
      console.error(`Error fetching ${table} directory counts:`, error);
      return [] as CountRow[];
    }

    return (data || []) as CountRow[];
  } catch (error) {
    console.error(`Error fetching ${table} directory counts:`, error);
    return [] as CountRow[];
  }
}

async function fetchOrgIdsWithRows(service: any, table: string) {
  try {
    const { data, error } = await service
      .from(table)
      .select('organization_id')
      .not('organization_id', 'is', null)
      .limit(PREFILTER_ORG_LIMIT);

    if (error) {
      console.error(`Error prefiltering organizations from ${table}:`, error);
      return [] as string[];
    }

    return uniqueOrgIds(data as CountRow[]);
  } catch (error) {
    console.error(`Error prefiltering organizations from ${table}:`, error);
    return [] as string[];
  }
}

async function fetchCentrePartnerOrgIds(service: any) {
  try {
    const { data, error } = await service
      .from('facility_partnerships')
      .select('organization_id, program_id, service_id')
      .eq('is_active', true)
      .limit(PREFILTER_ORG_LIMIT);

    if (error) {
      console.error('Error prefiltering centre partner organizations:', error);
      return [] as string[];
    }

    const rows = (data || []) as Pick<PartnerLookupRow, 'organization_id' | 'program_id' | 'service_id'>[];
    const orgIds = new Set(rows.map((row) => row.organization_id).filter((id): id is string => Boolean(id)));
    const programIds = Array.from(new Set(rows.map((row) => row.program_id).filter((id): id is string => Boolean(id))));
    const serviceIds = Array.from(new Set(rows.map((row) => row.service_id).filter((id): id is string => Boolean(id))));

    const [programRows, serviceRows] = await Promise.all([
      programIds.length
        ? service
            .from('registered_services')
            .select('id, organization_id')
            .in('id', programIds.slice(0, PREFILTER_ORG_LIMIT))
            .limit(PREFILTER_ORG_LIMIT)
            .then(({ data: programData, error: programError }: { data: OrgLookupRow[] | null; error: any }) => {
              if (programError) {
                console.error('Error resolving centre partner programs:', programError);
                return [] as OrgLookupRow[];
              }
              return programData || [];
            })
            .catch((error: unknown) => {
              console.error('Error resolving centre partner programs:', error);
              return [] as OrgLookupRow[];
            })
        : Promise.resolve([] as OrgLookupRow[]),
      serviceIds.length
        ? service
            .from('services')
            .select('id, organization_id')
            .in('id', serviceIds.slice(0, PREFILTER_ORG_LIMIT))
            .limit(PREFILTER_ORG_LIMIT)
            .then(({ data: serviceData, error: serviceError }: { data: OrgLookupRow[] | null; error: any }) => {
              if (serviceError) {
                console.error('Error resolving centre partner services:', serviceError);
                return [] as OrgLookupRow[];
              }
              return serviceData || [];
            })
            .catch((error: unknown) => {
              console.error('Error resolving centre partner services:', error);
              return [] as OrgLookupRow[];
            })
        : Promise.resolve([] as OrgLookupRow[]),
    ]);

    [...programRows, ...serviceRows].forEach((row) => {
      if (row.organization_id) orgIds.add(row.organization_id);
    });

    return Array.from(orgIds).slice(0, MAX_PREFILTER_IN_IDS);
  } catch (error) {
    console.error('Error prefiltering centre partner organizations:', error);
    return [] as string[];
  }
}

async function fetchClaimedOrgIds(service: any, orgIds?: string[]) {
  if (orgIds && orgIds.length === 0) return [] as string[];

  let query = service
    .from('organization_claims')
    .select('organization_id')
    .eq('status', 'verified')
    .limit(PREFILTER_ORG_LIMIT);

  if (orgIds?.length) {
    query = query.in('organization_id', orgIds);
  }

  try {
    const { data, error } = await query;

    if (error) {
      if (error.code !== 'PGRST205' && error.code !== 'PGRST002') {
        console.error('Error fetching claimed organization ids for directory:', error);
      }
      return [] as string[];
    }

    return uniqueOrgIds(data as CountRow[]);
  } catch (error) {
    console.error('Error fetching claimed organization ids for directory:', error);
    return [] as string[];
  }
}

async function fetchCentrePartnershipSummaries(service: any, orgIds: string[]) {
  if (orgIds.length === 0) return {} as Record<string, CentrePartnershipSummary>;

  try {
    const [programRows, serviceRows] = await Promise.all([
      service
        .from('registered_services')
        .select('id, organization_id')
        .in('organization_id', orgIds)
        .limit(RELATED_ROWS_LIMIT)
        .then(({ data, error }: { data: OrgLookupRow[] | null; error: any }) => {
          if (error) {
            console.error('Error resolving organization programs for centre partnerships:', error);
            return [] as OrgLookupRow[];
          }
          return data || [];
        })
        .catch((error: unknown) => {
          console.error('Error resolving organization programs for centre partnerships:', error);
          return [] as OrgLookupRow[];
        }),
      service
        .from('services')
        .select('id, organization_id')
        .in('organization_id', orgIds)
        .limit(RELATED_ROWS_LIMIT)
        .then(({ data, error }: { data: OrgLookupRow[] | null; error: any }) => {
          if (error) {
            console.error('Error resolving organization services for centre partnerships:', error);
            return [] as OrgLookupRow[];
          }
          return data || [];
        })
        .catch((error: unknown) => {
          console.error('Error resolving organization services for centre partnerships:', error);
          return [] as OrgLookupRow[];
        }),
    ]);

    const programToOrg = new Map(programRows.map((row) => [row.id, row.organization_id]));
    const serviceToOrg = new Map(serviceRows.map((row) => [row.id, row.organization_id]));
    const programIds = Array.from(programToOrg.keys()).slice(0, RELATED_ROWS_LIMIT);
    const serviceIds = Array.from(serviceToOrg.keys()).slice(0, RELATED_ROWS_LIMIT);

    const [directRows, programPartnerRows, servicePartnerRows] = await Promise.all([
      service
        .from('facility_partnerships')
        .select('facility_id, organization_id, program_id, service_id, partnership_type')
        .eq('is_active', true)
        .in('organization_id', orgIds)
        .limit(RELATED_ROWS_LIMIT)
        .then(({ data, error }: { data: PartnerLookupRow[] | null; error: any }) => {
          if (error) {
            console.error('Error fetching direct centre partnerships:', error);
            return [] as PartnerLookupRow[];
          }
          return data || [];
        })
        .catch((error: unknown) => {
          console.error('Error fetching direct centre partnerships:', error);
          return [] as PartnerLookupRow[];
        }),
      programIds.length
        ? service
            .from('facility_partnerships')
            .select('facility_id, organization_id, program_id, service_id, partnership_type')
            .eq('is_active', true)
            .in('program_id', programIds)
            .limit(RELATED_ROWS_LIMIT)
            .then(({ data, error }: { data: PartnerLookupRow[] | null; error: any }) => {
              if (error) {
                console.error('Error fetching program centre partnerships:', error);
                return [] as PartnerLookupRow[];
              }
              return data || [];
            })
            .catch((error: unknown) => {
              console.error('Error fetching program centre partnerships:', error);
              return [] as PartnerLookupRow[];
            })
        : Promise.resolve([] as PartnerLookupRow[]),
      serviceIds.length
        ? service
            .from('facility_partnerships')
            .select('facility_id, organization_id, program_id, service_id, partnership_type')
            .eq('is_active', true)
            .in('service_id', serviceIds)
            .limit(RELATED_ROWS_LIMIT)
            .then(({ data, error }: { data: PartnerLookupRow[] | null; error: any }) => {
              if (error) {
                console.error('Error fetching service centre partnerships:', error);
                return [] as PartnerLookupRow[];
              }
              return data || [];
            })
            .catch((error: unknown) => {
              console.error('Error fetching service centre partnerships:', error);
              return [] as PartnerLookupRow[];
            })
        : Promise.resolve([] as PartnerLookupRow[]),
    ]);

    const allRows = [...directRows, ...programPartnerRows, ...servicePartnerRows];
    const facilityIds = Array.from(new Set(allRows.map((row) => row.facility_id).filter((id): id is string => Boolean(id))));
    const { data: facilityRows, error: facilityError } = facilityIds.length
      ? await service
          .from('youth_detention_facilities')
          .select('id, name, slug, state, city')
          .in('id', facilityIds)
          .limit(RELATED_ROWS_LIMIT)
      : { data: [], error: null };

    if (facilityError) {
      console.error('Error fetching centre names for partnerships:', facilityError);
    }

    const facilities = new Map(((facilityRows || []) as FacilityLookupRow[]).map((facility) => [facility.id, facility]));
    const summaries: Record<string, CentrePartnershipSummary> = {};

    directRows.forEach((row) => {
      if (row.organization_id) addCentrePartnership(summaries, row.organization_id, row, facilities);
    });
    programPartnerRows.forEach((row) => {
      const orgId = row.program_id ? programToOrg.get(row.program_id) : null;
      if (orgId) addCentrePartnership(summaries, orgId, row, facilities);
    });
    servicePartnerRows.forEach((row) => {
      const orgId = row.service_id ? serviceToOrg.get(row.service_id) : null;
      if (orgId) addCentrePartnership(summaries, orgId, row, facilities);
    });

    return summaries;
  } catch (error) {
    console.error('Error fetching centre partnership summaries:', error);
    return {} as Record<string, CentrePartnershipSummary>;
  }
}

async function resolvePrefilterOrgIds(service: any, quick: DirectoryQuickFilter, verification: DirectoryVerificationFilter) {
  const idSets: string[][] = [];

  if (quick === 'claimed' || verification === 'claimed') {
    idSets.push(await fetchClaimedOrgIds(service));
  }

  if (quick === 'with-services') {
    const [programOrgIds, serviceOrgIds] = await Promise.all([
      fetchOrgIdsWithRows(service, 'registered_services'),
      fetchOrgIdsWithRows(service, 'services'),
    ]);
    idSets.push(Array.from(new Set([...programOrgIds, ...serviceOrgIds])));
  }

  if (quick === 'centre-partners') {
    idSets.push(await fetchCentrePartnerOrgIds(service));
  }

  if (idSets.length === 0) return null;
  if (idSets.some((ids) => ids.length === 0)) return [];

  return idSets
    .reduce((matching, ids) => matching.filter((id) => ids.includes(id)))
    .slice(0, MAX_PREFILTER_IN_IDS);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = createServiceClient() as any;

  const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 250000);
  const limit = parseBoundedInteger(searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const q = cleanSearchQuery(searchParams.get('q'));
  const cleanAbn = q.replace(/\s/g, '');
  const isAbn = /^\d{11}$/.test(cleanAbn);
  const state = searchParams.get('state') || 'all';
  const type = searchParams.get('type') || 'all';
  const sort = searchParams.get('sort') || 'name-asc';
  const quick = getEnumParam<DirectoryQuickFilter>(
    searchParams.get('quick'),
    ['all', 'linked', 'claimed', 'with-services', 'centre-partners', 'needs-profile'],
    'all'
  );
  const verification = getEnumParam<DirectoryVerificationFilter>(
    searchParams.get('verification'),
    ['all', 'verified', 'claimed', 'unverified'],
    'all'
  );
  const hasSelectiveFilter =
    Boolean(q) ||
    state !== 'all' ||
    type !== 'all' ||
    quick !== 'all' ||
    verification !== 'all';

  try {
    const prefilterOrgIds = await resolvePrefilterOrgIds(service, quick, verification);

    if (prefilterOrgIds && prefilterOrgIds.length === 0) {
      return NextResponse.json({
        organizations: [] as Organization[],
        total: 0,
        limit,
        offset,
        hasMore: false,
        programCounts: {},
        serviceCounts: {},
        teamCounts: {},
        centrePartnerships: {},
        claimedOrgIds: [],
      });
    }

    let query = service
      .from('organizations')
      .select('id, name, slug, type, abn, gs_entity_id, description, verification_status, city, state, tags', {
        count: hasSelectiveFilter ? 'exact' : 'planned',
      })
      .eq('is_active', true)
      .not('name', 'is', null)
      .neq('name', '')
      .neq('name', '(blank)');

    if (prefilterOrgIds) {
      query = query.in('id', prefilterOrgIds);
    }

    if (q) {
      query = isAbn
        ? query.eq('abn', cleanAbn)
        : query.or(
            [
              `name.ilike.%${q}%`,
              `description.ilike.%${q}%`,
              `city.ilike.%${q}%`,
              `state.ilike.%${q}%`,
              `type.ilike.%${q}%`,
              `abn.ilike.%${q}%`,
            ].join(',')
          );
    }

    if (state !== 'all') {
      query = query.eq('state', state);
    }

    if (type !== 'all') {
      query = query.eq('type', type);
    }

    if (verification === 'verified') {
      query = query.in('verification_status', VERIFIED_STATUSES);
    }

    if (verification === 'unverified') {
      query = query.not('verification_status', 'in', `(${VERIFIED_STATUSES.join(',')})`);
    }

    if (quick === 'linked') {
      query = query.or('gs_entity_id.not.is.null,abn.not.is.null');
    }

    if (quick === 'needs-profile') {
      query = query.is('description', null);
    }

    query = query.order('name', { ascending: sort !== 'name-desc', nullsFirst: false });

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching organization directory page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const organizations = ((data || []) as Organization[]).filter((org) => org.name && org.name !== '(blank)');
    const orgIds = organizations.map((org) => org.id);

    const [programRows, serviceRows, teamRows, centrePartnerships, claimedOrgIds] = await Promise.all([
      fetchRelationshipRows(service, 'registered_services', orgIds),
      fetchRelationshipRows(service, 'services', orgIds),
      orgIds.length === 0
        ? Promise.resolve([] as CountRow[])
        : service
            .from('organizations_profiles')
            .select('organization_id')
            .in('organization_id', orgIds)
            .eq('is_current', true)
            .limit(RELATED_ROWS_LIMIT)
            .then(({ data: teamData, error: teamError }: { data: CountRow[] | null; error: any }) => {
              if (teamError) {
                console.error('Error fetching team counts for directory:', teamError);
                return [] as CountRow[];
              }
              return teamData || [];
            })
            .catch((teamError: unknown) => {
              console.error('Error fetching team counts for directory:', teamError);
              return [] as CountRow[];
            }),
      fetchCentrePartnershipSummaries(service, orgIds),
      fetchClaimedOrgIds(service, orgIds),
    ]);

    const total = count ?? offset + organizations.length;

    return NextResponse.json({
      organizations,
      total,
      limit,
      offset,
      hasMore: offset + organizations.length < total,
      programCounts: buildCountMap(programRows),
      serviceCounts: buildCountMap(serviceRows),
      teamCounts: buildCountMap(teamRows),
      centrePartnerships,
      claimedOrgIds,
    });
  } catch (error) {
    console.error('Organization directory route failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Organization directory unavailable',
        organizations: [] as Organization[],
        total: 0,
        limit,
        offset,
        hasMore: false,
        programCounts: {},
        serviceCounts: {},
        teamCounts: {},
        centrePartnerships: {},
        claimedOrgIds: [],
      },
      { status: 500 }
    );
  }
}
