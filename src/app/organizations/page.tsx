import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { Map as MapIcon } from 'lucide-react';
import { SimpleEcosystemMap } from '@/components/SimpleEcosystemMap';
import { OrganizationsPageContent } from './page-content';

export const dynamic = 'force-dynamic';

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

async function getOrganizationsData() {
  const supabase = createServiceClient();

  try {
    // Fetch organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return { organizations: [], programCounts: {}, serviceCounts: {}, teamCounts: {}, detentionFacilities: [] };
    }

    // Fetch detention facilities
    const { data: facilities, error: facilitiesError } = await supabase
      .from('youth_detention_facilities')
      .select('id, name, slug, city, state, capacity_beds, operational_status, government_department, security_level')
      .order('state')
      .order('name');

    if (facilitiesError) {
      console.error('Error fetching detention facilities:', facilitiesError);
    }

    // Fetch partnership counts for facilities
    const facilityIds = facilities?.map(f => f.id) || [];
    let facilitiesWithPartners: DetentionFacility[] = facilities || [];

    if (facilityIds.length > 0) {
      const { data: partnerships } = await supabase
        .from('facility_partnerships')
        .select('facility_id')
        .in('facility_id', facilityIds)
        .eq('is_active', true);

      const partnershipCounts: Record<string, number> = {};
      partnerships?.forEach((p: any) => {
        if (p.facility_id) {
          partnershipCounts[p.facility_id] = (partnershipCounts[p.facility_id] || 0) + 1;
        }
      });

      facilitiesWithPartners = facilities?.map(f => ({
        ...f,
        partnership_count: partnershipCounts[f.id] || 0,
      })) || [];
    }

    // Fetch program counts
    const { data: programs } = await supabase
      .from('registered_services')
      .select('organization_id');

    const programCounts: Record<string, number> = {};
    if (programs) {
      programs.forEach((program: any) => {
        if (program.organization_id) {
          programCounts[program.organization_id] = (programCounts[program.organization_id] || 0) + 1;
        }
      });
    }

    // Fetch service counts
    const { data: services } = await supabase
      .from('services')
      .select('organization_id');

    const serviceCounts: Record<string, number> = {};
    if (services) {
      services.forEach((service: { organization_id: string | null }) => {
        if (service.organization_id) {
          serviceCounts[service.organization_id] = (serviceCounts[service.organization_id] || 0) + 1;
        }
      });
    }

    // Fetch team member counts
    const { data: teamMembers } = await supabase
      .from('organizations_profiles')
      .select('organization_id')
      .eq('is_current', true);

    const teamCounts: Record<string, number> = {};
    if (teamMembers) {
      teamMembers.forEach((member: { organization_id: string | null }) => {
        if (member.organization_id) {
          teamCounts[member.organization_id] = (teamCounts[member.organization_id] || 0) + 1;
        }
      });
    }

    return {
      organizations: orgs || [],
      programCounts,
      serviceCounts,
      teamCounts,
      detentionFacilities: facilitiesWithPartners,
    };
  } catch (error) {
    console.error('Error fetching organizations data:', error);
    return { organizations: [], programCounts: {}, serviceCounts: {}, teamCounts: {}, detentionFacilities: [] };
  }
}

export default async function OrganizationsPage() {
  const { organizations, programCounts, serviceCounts, teamCounts, detentionFacilities } = await getOrganizationsData();

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
                  {organizations.length}
                </div>
                <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">
                  Organizations
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
