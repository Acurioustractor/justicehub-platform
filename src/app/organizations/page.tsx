import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { Map as MapIcon } from 'lucide-react';
import { SimpleEcosystemMap } from '@/components/SimpleEcosystemMap';
import { OrganizationsPageContent } from './page-content';

export const revalidate = 300; // ISR: regenerate every 5 minutes

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
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
  capacity_beds: number | null;
  operational_status: string | null;
  government_department: string | null;
  security_level: string | null;
  partnership_count?: number;
}

async function fetchLinkedOrgIds(supabase: ReturnType<typeof createServiceClient>) {
  // Only ALMA-linked orgs bypass the browse filter — funding linkage alone is too broad
  // (includes construction companies, catering firms, etc. that receive govt money)
  const svc = supabase as any;
  const { data: almaRes } = await svc
    .from('alma_interventions')
    .select('operating_organization_id')
    .neq('verification_status', 'ai_generated')
    .not('operating_organization_id', 'is', null);

  const ids = new Set<string>();
  almaRes?.forEach((r: any) => { if (r.operating_organization_id) ids.add(r.operating_organization_id); });
  return ids;
}

async function fetchAllOrgs(supabase: ReturnType<typeof createServiceClient>) {
  const PAGE_SIZE = 1000;
  const allOrgs: Organization[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, type, description, verification_status, city, state, tags')
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allOrgs.push(...data);
    hasMore = data.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  // Get orgs linked to ALMA interventions or justice funding
  const linkedIds = await fetchLinkedOrgIds(supabase);

  // Filter out skeleton orgs. An org is "browsable" if it has:
  // - A type (even without description), OR
  // - A description (even without type), OR
  // - Tags, OR
  // - Is linked to an ALMA intervention (directly justice-related)
  // Having only a city or only funding linkage is NOT enough.
  return allOrgs.filter(org =>
    org.type || org.description || (org.tags && org.tags.length > 0) || linkedIds.has(org.id)
  );
}

async function fetchFacilitiesWithPartners(supabase: ReturnType<typeof createServiceClient>) {
  const { data: facilities, error } = await supabase
    .from('youth_detention_facilities')
    .select('id, name, slug, city, state, capacity_beds, operational_status, government_department, security_level')
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

function buildCountMap(rows: { organization_id: string | null }[] | null): Record<string, number> {
  const counts: Record<string, number> = {};
  rows?.forEach(r => {
    if (r.organization_id) counts[r.organization_id] = (counts[r.organization_id] || 0) + 1;
  });
  return counts;
}

async function getOrganizationsData() {
  const supabase = createServiceClient();

  try {
    // Run ALL independent queries in parallel for ~3x speedup
    const [
      orgs,
      facilitiesWithPartners,
      { data: programs },
      { data: services },
      { data: teamMembers },
      { data: verifiedClaims },
      { count: totalOrgCount },
    ] = await Promise.all([
      fetchAllOrgs(supabase).catch(err => {
        console.error('Error fetching organizations:', err);
        return [] as Organization[];
      }),
      fetchFacilitiesWithPartners(supabase),
      supabase.from('registered_services').select('organization_id'),
      supabase.from('services').select('organization_id'),
      supabase.from('organizations_profiles').select('organization_id').eq('is_current', true),
      (supabase as any).from('organization_claims').select('organization_id').eq('status', 'verified'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    if (orgs.length === 0) {
      return { organizations: [], totalOrgCount: 0, programCounts: {}, serviceCounts: {}, teamCounts: {}, detentionFacilities: [], claimedOrgIds: [] };
    }

    const claimedOrgIds = new Set<string>();
    verifiedClaims?.forEach((c: { organization_id: string }) => claimedOrgIds.add(c.organization_id));

    return {
      organizations: orgs,
      totalOrgCount: totalOrgCount || orgs.length,
      programCounts: buildCountMap(programs),
      serviceCounts: buildCountMap(services),
      teamCounts: buildCountMap(teamMembers),
      detentionFacilities: facilitiesWithPartners,
      claimedOrgIds: Array.from(claimedOrgIds),
    };
  } catch (error) {
    console.error('Error fetching organizations data:', error);
    return { organizations: [], totalOrgCount: 0, programCounts: {}, serviceCounts: {}, teamCounts: {}, detentionFacilities: [], claimedOrgIds: [] };
  }
}

export default async function OrganizationsPage() {
  const { organizations, totalOrgCount, programCounts, serviceCounts, teamCounts, detentionFacilities, claimedOrgIds } = await getOrganizationsData();

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
              Youth Justice Organizations
            </h1>
            <p className="text-xl text-earth-700 max-w-3xl mb-8">
              Browse verified organizations delivering youth justice programs across Australia
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-6 border-t-2 border-black/10">
              <div>
                <div className="text-4xl font-bold text-ochre-600 mb-1">
                  {totalOrgCount.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  In Ecosystem
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-ochre-600 mb-1">
                  {organizations.length.toLocaleString()}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Browsable
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-eucalyptus-600 mb-1">
                  {verifiedCount}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Verified
                </p>
              </div>
              {claimedOrgIds.length > 0 && (
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {claimedOrgIds.length}
                  </div>
                  <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                    Active
                  </p>
                </div>
              )}
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
            <SimpleEcosystemMap height="520px" />
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
