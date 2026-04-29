import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { Map as MapIcon } from 'lucide-react';
import { SimpleEcosystemMap } from '@/components/SimpleEcosystemMap';
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

function facilityCoordinates(facility: DetentionFacility) {
  if (facility.latitude && facility.longitude) {
    return { latitude: facility.latitude, longitude: facility.longitude };
  }

  const name = facility.name.toLowerCase();
  const city = (facility.city || '').toLowerCase();
  const state = (facility.state || '').toUpperCase();

  if (name.includes('brisbane') || name.includes('west moreton') || city.includes('wacol')) {
    return { latitude: -27.591, longitude: 152.924 };
  }
  if (name.includes('cleveland') || city.includes('townsville')) {
    return { latitude: -19.259, longitude: 146.817 };
  }
  if (name.includes('banksia') || city.includes('canning vale')) {
    return { latitude: -32.069, longitude: 115.919 };
  }
  if (name.includes('ashley') || city.includes('deloraine')) {
    return { latitude: -41.525, longitude: 146.657 };
  }
  if (name.includes('holtze') || name.includes('don dale') || city.includes('darwin')) {
    return { latitude: -12.444, longitude: 130.945 };
  }
  if (name.includes('alice springs')) {
    return { latitude: -23.698, longitude: 133.881 };
  }
  if (name.includes('cobham') || city.includes('st marys')) {
    return { latitude: -33.766, longitude: 150.775 };
  }
  if (name.includes('frank baxter') || city.includes('kariong')) {
    return { latitude: -33.439, longitude: 151.293 };
  }
  if (name.includes('reiby') || city.includes('airds')) {
    return { latitude: -34.085, longitude: 150.827 };
  }
  if (name.includes('malmsbury')) {
    return { latitude: -37.188, longitude: 144.384 };
  }
  if (name.includes('parkville')) {
    return { latitude: -37.784, longitude: 144.947 };
  }
  if (name.includes('kurlana') || city.includes('cavan')) {
    return { latitude: -34.829, longitude: 138.599 };
  }

  const stateCentres: Record<string, { latitude: number; longitude: number }> = {
    ACT: { latitude: -35.281, longitude: 149.13 },
    NSW: { latitude: -33.868, longitude: 151.209 },
    NT: { latitude: -12.463, longitude: 130.845 },
    QLD: { latitude: -27.47, longitude: 153.026 },
    SA: { latitude: -34.928, longitude: 138.6 },
    TAS: { latitude: -42.882, longitude: 147.327 },
    VIC: { latitude: -37.814, longitude: 144.963 },
    WA: { latitude: -31.952, longitude: 115.861 },
  };

  return stateCentres[state] || null;
}

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
          </div>
        </section>

        {/* Interactive Map Section */}
        <section className="py-12 border-b-2 border-black bg-gradient-to-br from-blue-50 via-green-50 to-sand-50">
          <div className="container-justice">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-earth-900 mb-2 flex items-center gap-3">
                <MapIcon className="w-8 h-8 text-blue-600" />
                Ecosystem Map
              </h2>
              <p className="text-earth-600">
                Explore detention facilities, community programs, and support services.
                Use fullscreen mode for detailed filtering and exploration.
              </p>
            </div>
            <SimpleEcosystemMap
              height="520px"
              data={{
                facilities: detentionFacilities
                  .map(facility => {
                    const coordinates = facilityCoordinates(facility);
                    if (!coordinates) return null;
                    return {
                      id: facility.id,
                      name: facility.name,
                      slug: facility.slug || undefined,
                      city: facility.city || '',
                      state: facility.state || '',
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      capacity_beds: facility.capacity_beds || undefined,
                      partnership_count: facility.partnership_count,
                      operational_status: facility.operational_status || undefined,
                    };
                  })
                  .filter((facility): facility is NonNullable<typeof facility> => Boolean(facility)),
                services: [],
                programs: [],
                organizations: [],
              }}
            />
          </div>
        </section>

        {/* Filterable Organizations + Detention Facilities */}
        <OrganizationsPageContent
          organizations={organizations}
          programCounts={programCounts}
          serviceCounts={serviceCounts}
          teamCounts={teamCounts}
          detentionFacilities={detentionFacilities}
          claimedOrgIds={claimedOrgIds}
        />

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
