import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { Building2, ListFilter, Map as MapIcon, MapPin, Network } from 'lucide-react';
import { DetentionCentreMap } from '@/components/organizations/DetentionCentreMap';
import { OrganizationsPageContent } from './page-content';

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

interface DetentionFacility {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity_beds: number | null;
  operational_status: string | null;
  government_department: string | null;
  security_level: string | null;
  partnership_count?: number;
}

type CountRow = { organization_id: string | null };

interface OrganizationsData {
  organizations: Organization[];
  totalOrgCount: number;
  grantScopeLinkedCount: number;
  abnBackedCount: number;
  programCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  detentionFacilities: DetentionFacility[];
  claimedOrgIds: string[];
}

type RelatedData = [DetentionFacility[], CountRow[], CountRow[], CountRow[], string[]];

// Hard cap for the SSR payload and all supporting relationship queries.
// Keep the public directory fast; deeper discovery happens through search/claim flows.
const MAX_BROWSABLE = 120;
const RELATED_ROWS_LIMIT = 5000;
const RELATED_ORG_ID_LIMIT = 80;
const SSR_DATA_TIMEOUT_MS = 2500;
const COUNT_TIMEOUT_MS = 900;

function emptyOrganizationsData(): OrganizationsData {
  return {
    organizations: [] as Organization[],
    totalOrgCount: 0,
    grantScopeLinkedCount: 0,
    abnBackedCount: 0,
    programCounts: {},
    serviceCounts: {},
    teamCounts: {},
    detentionFacilities: [] as DetentionFacility[],
    claimedOrgIds: [] as string[],
  };
}

async function withTimeout<T>(label: string, promise: Promise<T>, fallback: T, timeoutMs = SSR_DATA_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.error(`${label} timed out after ${timeoutMs}ms`);
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchAllOrgs(supabase: ReturnType<typeof createServiceClient>) {
  // Keep this page as a fast browser over active records. Do not serialize the
  // whole CivicGraph-sized table into SSR; search/claim handles deeper lookup.
  const svc = supabase as any;
  const { data: orgs, error } = await svc
    .from('organizations')
    .select('id, name, slug, type, abn, gs_entity_id, description, verification_status, city, state, tags')
    .eq('is_active', true)
    .not('name', 'is', null)
    .neq('name', '')
    .neq('name', '(blank)')
    .order('name')
    .limit(MAX_BROWSABLE);

  if (error) throw error;
  const rows = (orgs || []) as Organization[];

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows.slice(0, MAX_BROWSABLE);
}

async function fetchFacilitiesWithPartners(supabase: ReturnType<typeof createServiceClient>) {
  const { data: facilities, error } = await supabase
    .from('youth_detention_facilities')
    .select('id, name, slug, city, state, latitude, longitude, capacity_beds, operational_status, government_department, security_level')
    .order('state')
    .order('name');

  if (error || !facilities?.length) return [];

  const { data: partnerships } = await supabase
    .from('facility_partnerships')
    .select('facility_id')
    .in('facility_id', facilities.map(f => f.id))
    .eq('is_active', true);

  const counts: Record<string, number> = {};
  partnerships?.forEach((p: any) => {
    if (p.facility_id) counts[p.facility_id] = (counts[p.facility_id] || 0) + 1;
  });

  return facilities.map(f => ({ ...f, partnership_count: counts[f.id] || 0 }));
}

function buildCountMap(rows: CountRow[] | null): Record<string, number> {
  const counts: Record<string, number> = {};
  rows?.forEach(r => {
    if (r.organization_id) counts[r.organization_id] = (counts[r.organization_id] || 0) + 1;
  });
  return counts;
}

async function fetchRelationshipRows(
  supabase: ReturnType<typeof createServiceClient>,
  table: string,
  orgIds: string[]
): Promise<{ organization_id: string | null }[]> {
  if (orgIds.length === 0) return [];

  const svc = supabase as any;
  const { data, error } = await svc
    .from(table)
    .select('organization_id')
    .in('organization_id', orgIds)
    .limit(RELATED_ROWS_LIMIT);

  if (error) {
    console.error(`Error fetching ${table} organization counts:`, error);
    return [];
  }

  return data || [];
}

async function fetchClaimedOrgIds(supabase: ReturnType<typeof createServiceClient>, orgIds: string[]) {
  if (orgIds.length === 0) return [];

  const svc = supabase as any;
  const { data: orgClaims, error: orgClaimsError } = await svc
    .from('organization_claims')
    .select('organization_id')
    .eq('status', 'verified')
    .in('organization_id', orgIds);

  if (!orgClaimsError) {
    return Array.from(new Set(
      (orgClaims || [])
        .map((claim: { organization_id: string | null }) => claim.organization_id)
        .filter((id: string | null): id is string => Boolean(id))
    ));
  }

  if (orgClaimsError?.code !== 'PGRST205' && orgClaimsError?.code !== 'PGRST002') {
    console.error('Error fetching claimed organization ids:', orgClaimsError);
  }
  return [];
}

async function fetchOrganizationsMetrics(supabase: ReturnType<typeof createServiceClient>, orgs: Organization[]) {
  const svc = supabase as any;

  const totalOrgCount = await withTimeout(
    'Counting active organizations',
    svc
      .from('organizations')
      .select('id', { count: 'planned', head: true })
      .eq('is_active', true)
      .then(({ count, error }: { count: number | null; error: any }) => {
        if (error) throw error;
        return count || orgs.length;
      })
      .catch((error: unknown) => {
        console.error('Error counting active organizations:', error);
        return orgs.length;
      }),
    orgs.length,
    COUNT_TIMEOUT_MS
  );

  return {
    totalOrgCount,
    grantScopeLinkedCount: orgs.filter(org => Boolean(org.gs_entity_id)).length,
    abnBackedCount: orgs.filter(org => Boolean(org.abn)).length,
  };
}

async function getOrganizationsData(): Promise<OrganizationsData> {
  const supabase = createServiceClient();

  try {
    const orgs = await withTimeout(
      'Fetching organizations directory',
      fetchAllOrgs(supabase).catch(err => {
        console.error('Error fetching organizations:', err);
        return [] as Organization[];
      }),
      [] as Organization[]
    );

    if (orgs.length === 0) {
      return emptyOrganizationsData();
    }

    const orgIds = orgs.map(org => org.id);
    const relatedOrgIds = orgIds.slice(0, RELATED_ORG_ID_LIMIT);

    const relatedData = await withTimeout<RelatedData>(
      'Fetching organizations related counts',
      Promise.all([
        fetchFacilitiesWithPartners(supabase).catch(err => {
          console.error('Error fetching detention facilities:', err);
          return [] as DetentionFacility[];
        }),
        fetchRelationshipRows(supabase, 'registered_services', relatedOrgIds),
        fetchRelationshipRows(supabase, 'services', relatedOrgIds),
        (supabase as any)
          .from('organizations_profiles')
          .select('organization_id')
          .in('organization_id', relatedOrgIds)
          .eq('is_current', true)
          .limit(RELATED_ROWS_LIMIT)
          .then(({ data, error }: { data: { organization_id: string | null }[] | null; error: any }) => {
            if (error) {
              console.error('Error fetching team member counts:', error);
              return [] as { organization_id: string | null }[];
            }
            return data || [];
          }),
        fetchClaimedOrgIds(supabase, relatedOrgIds),
      ]),
      [
        [] as DetentionFacility[],
        [] as CountRow[],
        [] as CountRow[],
        [] as CountRow[],
        [] as string[],
      ]
    );

    const [facilitiesWithPartners, programs, services, teamMembers, claimedOrgIds] = relatedData;
    const metrics = await fetchOrganizationsMetrics(supabase, orgs);

    return {
      organizations: orgs,
      totalOrgCount: metrics.totalOrgCount,
      grantScopeLinkedCount: metrics.grantScopeLinkedCount,
      abnBackedCount: metrics.abnBackedCount,
      programCounts: buildCountMap(programs),
      serviceCounts: buildCountMap(services),
      teamCounts: buildCountMap(teamMembers),
      detentionFacilities: facilitiesWithPartners,
      claimedOrgIds,
    };
  } catch (error) {
    console.error('Error fetching organizations data:', error);
    return emptyOrganizationsData();
  }
}

export default async function OrganizationsPage() {
  const { organizations, totalOrgCount, grantScopeLinkedCount, abnBackedCount, programCounts, serviceCounts, teamCounts, detentionFacilities, claimedOrgIds } = await getOrganizationsData();

  const verifiedCount = organizations.filter(
    (org: Organization) => org.verification_status === 'verified'
  ).length;

  const operationalFacilities = detentionFacilities.filter(f => f.operational_status === 'operational');
  const totalCapacity = operationalFacilities.reduce((sum, f) => sum + (f.capacity_beds || 0), 0);
  const facilityStateCounts = detentionFacilities.reduce<Record<string, number>>((counts, facility) => {
    const state = facility.state || 'Unknown';
    counts[state] = (counts[state] || 0) + 1;
    return counts;
  }, {});

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-gradient-to-b from-sand-50 to-white page-content">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-16 border-b-2 border-black">
          <div className="container-justice">
            <h1 className="text-5xl md:text-6xl font-bold text-earth-900 mb-4">
              Organization Directory
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mb-8">
              Browse the loaded JusticeHub and CivicGraph records, then follow ABN and GrantScope links into the wider funding graph.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-6 border-t-2 border-black/10">
              <div>
                <div className="text-4xl font-bold text-ochre-600 mb-1">
                  {totalOrgCount.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Source Records
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-ochre-600 mb-1">
                  {organizations.length.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Loaded Profiles
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-eucalyptus-600 mb-1">
                  {verifiedCount}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Verified Profiles
                </p>
              </div>
              {claimedOrgIds.length > 0 && (
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {claimedOrgIds.length}
                  </div>
                  <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                    Claimed by Orgs
                  </p>
                </div>
              )}
              <div>
                <div className="text-4xl font-bold text-blue-700 mb-1">
                  {grantScopeLinkedCount.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Loaded GrantScope
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-earth-600 mb-1">
                  {abnBackedCount.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Loaded ABN
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-600 mb-1">
                  {operationalFacilities.length}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Detention Centres
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-earth-600 mb-1">
                  {totalCapacity.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Total Beds
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#centre-map" className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors">
                <MapIcon className="w-4 h-4" />
                Map view
              </a>
              <a href="#centre-list" className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors">
                <Building2 className="w-4 h-4" />
                Centre cards
              </a>
              <a href="#organization-directory" className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors">
                <ListFilter className="w-4 h-4" />
                Organization directory
              </a>
              <a href="/hub" className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors">
                <Network className="w-4 h-4" />
                Claim pathway
              </a>
            </div>
          </div>
        </section>

        <section id="centre-map" className="py-12 border-b-2 border-black bg-gradient-to-br from-blue-50 via-green-50 to-sand-50">
          <div className="container-justice">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-earth-900 mb-2 flex items-center gap-3">
                <MapIcon className="w-8 h-8 text-blue-600" />
                Ecosystem Map
              </h2>
              <p className="text-earth-600">
                Detention centres are fixed points in the system. The organization directory below is the working layer for claims, services, ABNs, and CivicGraph links.
              </p>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] gap-6 items-stretch">
              <DetentionCentreMap facilities={detentionFacilities} height="500px" />

              <aside className="border-2 border-black bg-white p-5">
                <h3 className="text-xl font-bold mb-4">System Snapshot</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="border border-black p-3">
                    <div className="text-2xl font-bold text-red-600">{operationalFacilities.length}</div>
                    <div className="text-xs uppercase tracking-wide">operational</div>
                  </div>
                  <div className="border border-black p-3">
                    <div className="text-2xl font-bold">{totalCapacity.toLocaleString()}</div>
                    <div className="text-xs uppercase tracking-wide">beds</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.entries(facilityStateCounts).sort().map(([state, count]) => (
                    <div key={state} className="flex items-center justify-between border-b border-earth-200 pb-2 text-sm">
                      <span className="font-bold">{state}</span>
                      <span>{count} centre{count === 1 ? '' : 's'}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="centre-list" className="py-12 border-b-2 border-black bg-white">
          <div className="container-justice">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-earth-900 mb-2 flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-red-600" />
                  Centre Cards
                </h2>
                <p className="text-earth-600">Operational status, beds, location, and partner count at scan speed.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {detentionFacilities.map((facility) => (
                <article key={facility.id} className="bg-white border-2 border-black p-4 min-h-[180px] flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-lg leading-tight text-earth-900">{facility.name}</h3>
                    <span className={`shrink-0 text-[10px] uppercase tracking-wide font-bold px-2 py-1 border ${
                      facility.operational_status === 'operational'
                        ? 'bg-red-50 text-red-700 border-red-600'
                        : 'bg-gray-100 text-gray-600 border-gray-400'
                    }`}>
                      {facility.operational_status || 'unknown'}
                    </span>
                  </div>
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-1 text-sm text-earth-600">
                      <MapPin className="w-4 h-4" />
                      {facility.city || 'Unknown'}, {facility.state || 'AU'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-earth-800">
                      <div className="border border-earth-200 p-2">{facility.capacity_beds || 0} beds</div>
                      <div className="border border-earth-200 p-2">{facility.partnership_count || 0} partners</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="organization-directory">
          <OrganizationsPageContent
            organizations={organizations}
            programCounts={programCounts}
            serviceCounts={serviceCounts}
            teamCounts={teamCounts}
            detentionFacilities={detentionFacilities}
            claimedOrgIds={claimedOrgIds}
          />
        </section>

        {organizations.length === 0 && (
          <section className="py-16">
            <div className="container-justice text-center">
              <p className="text-xl text-earth-600">No organizations found.</p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
