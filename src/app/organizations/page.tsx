import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { Briefcase, Heart, Users, MapPin, Link2, Building2, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { SimpleEcosystemMap } from '@/components/SimpleEcosystemMap';

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
      partnerships?.forEach(p => {
        partnershipCounts[p.facility_id] = (partnershipCounts[p.facility_id] || 0) + 1;
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
      programs.forEach((program: { organization_id: string | null }) => {
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

  const verifiedOrgs = organizations.filter(
    (org: Organization) => org.verification_status === 'verified'
  );

  // Separate operational and closed facilities
  const operationalFacilities = detentionFacilities.filter(f => f.operational_status === 'operational');
  const closedFacilities = detentionFacilities.filter(f => f.operational_status === 'closed');
  const totalCapacity = operationalFacilities.reduce((sum, f) => sum + (f.capacity_beds || 0), 0);

  // Sort other orgs: those with linked content first
  const otherOrgs = organizations
    .filter((org: Organization) => org.verification_status !== 'verified')
    .sort((a: Organization, b: Organization) => {
      const aHasLinks = (programCounts[a.id] || 0) + (serviceCounts[a.id] || 0) + (teamCounts[a.id] || 0);
      const bHasLinks = (programCounts[b.id] || 0) + (serviceCounts[b.id] || 0) + (teamCounts[b.id] || 0);
      // Sort by total linked content (descending), then by name
      if (bHasLinks !== aHasLinks) return bHasLinks - aHasLinks;
      return a.name.localeCompare(b.name);
    });

  // Count how many orgs have linked content
  const orgsWithLinks = otherOrgs.filter((org: Organization) =>
    programCounts[org.id] || serviceCounts[org.id] || teamCounts[org.id]
  ).length;

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
                  {verifiedOrgs.length}
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

        {/* Verified Organizations Section */}
        {verifiedOrgs.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-earth-900 mb-2">
                  Verified Organizations
                </h2>
                <p className="text-lg text-earth-600">
                  Organizations verified by JusticeHub with detailed program information
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verifiedOrgs.map((org: Organization) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug || org.id}`}
                    className="block bg-white rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden group"
                  >
                    <div className="p-6">
                      {/* Verification Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-2 bg-eucalyptus-100 text-eucalyptus-800 px-3 py-1 border border-black text-xs font-bold uppercase tracking-wider">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      </div>

                      {/* Organization Name */}
                      <h3 className="text-2xl font-bold text-earth-900 mb-3 group-hover:text-ochre-600 transition-colors">
                        {org.name}
                      </h3>

                      {/* Location & Type */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        {org.city && org.state && (
                          <span className="flex items-center gap-1 text-sm text-earth-600 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            {org.city}, {org.state}
                          </span>
                        )}
                        {org.type && (
                          <span className="px-2 py-0.5 bg-sand-100 border border-black text-xs font-bold uppercase tracking-wide">
                            {org.type.replace('-', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {org.description && (
                        <p className="text-earth-600 mb-4 line-clamp-3">
                          {org.description}
                        </p>
                      )}

                      {/* Counts */}
                      {(programCounts[org.id] || serviceCounts[org.id] || teamCounts[org.id]) && (
                        <div className="pt-4 mt-4 border-t-2 border-black flex flex-wrap gap-4">
                          {programCounts[org.id] && (
                            <div className="flex items-center gap-1 text-sm font-bold text-eucalyptus-700">
                              <Heart className="w-4 h-4" />
                              {programCounts[org.id]} program{programCounts[org.id] !== 1 ? 's' : ''}
                            </div>
                          )}
                          {serviceCounts[org.id] && (
                            <div className="flex items-center gap-1 text-sm font-bold text-ochre-700">
                              <Briefcase className="w-4 h-4" />
                              {serviceCounts[org.id]} service{serviceCounts[org.id] !== 1 ? 's' : ''}
                            </div>
                          )}
                          {teamCounts[org.id] && (
                            <div className="flex items-center gap-1 text-sm font-bold text-blue-700">
                              <Users className="w-4 h-4" />
                              {teamCounts[org.id]} team
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {org.tags && org.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {org.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="bg-sand-100 border border-black text-earth-700 px-2 py-1 text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {org.tags.length > 3 && (
                            <span className="text-earth-500 text-xs py-1 font-medium">
                              +{org.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Youth Detention Facilities Section */}
        {detentionFacilities.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-gradient-to-br from-red-50 via-orange-50 to-sand-50">
            <div className="container-justice">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-earth-900 mb-2 flex items-center gap-3">
                  <Building2 className="w-10 h-10 text-red-600" />
                  Youth Detention Facilities
                </h2>
                <p className="text-lg text-earth-600">
                  {operationalFacilities.length} operational detention centres across Australia
                  {closedFacilities.length > 0 && (
                    <span className="ml-2 text-earth-500">
                      ({closedFacilities.length} recently closed)
                    </span>
                  )}
                </p>
              </div>

              {/* Operational Facilities */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {operationalFacilities.map((facility) => (
                  <div
                    key={facility.id}
                    className="block bg-white border-2 border-black p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-lg text-earth-900">
                        {facility.name}
                      </h3>
                      <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 border border-green-600 text-green-800 text-xs font-bold uppercase tracking-wide">
                        Operational
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-earth-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      {facility.city}, {facility.state}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {facility.capacity_beds && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-earth-600">Capacity:</span>
                          <span className="font-bold">{facility.capacity_beds} beds</span>
                        </div>
                      )}
                      {facility.security_level && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-earth-600">Security:</span>
                          <span className="font-bold capitalize">{facility.security_level}</span>
                        </div>
                      )}
                      {facility.government_department && (
                        <div className="text-xs text-earth-500 mt-2">
                          {facility.government_department}
                        </div>
                      )}
                    </div>

                    {/* Partnership count */}
                    {facility.partnership_count !== undefined && facility.partnership_count > 0 && (
                      <div className="pt-3 border-t border-earth-200">
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-700">
                          <Link2 className="w-3 h-3" />
                          {facility.partnership_count} partnership{facility.partnership_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Closed Facilities */}
              {closedFacilities.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-earth-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Recently Closed Facilities
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {closedFacilities.map((facility) => (
                      <div
                        key={facility.id}
                        className="bg-gray-100 border-2 border-gray-300 p-4 opacity-75"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-earth-700">
                            {facility.name}
                          </h4>
                          <span className="flex-shrink-0 px-2 py-0.5 bg-gray-200 border border-gray-400 text-gray-600 text-xs font-bold uppercase tracking-wide">
                            Closed
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-earth-500">
                          <MapPin className="w-4 h-4" />
                          {facility.city}, {facility.state}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Other Organizations Section */}
        {otherOrgs.length > 0 && (
          <section className="py-12 bg-sand-50">
            <div className="container-justice">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-earth-900 mb-2">
                  Other Organizations
                </h2>
                <p className="text-lg text-earth-600">
                  Organizations in our directory awaiting verification
                  {orgsWithLinks > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-ochre-600">
                      <Link2 className="w-4 h-4" />
                      {orgsWithLinks} with linked content
                    </span>
                  )}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherOrgs.map((org: Organization) => {
                  const hasLinks = programCounts[org.id] || serviceCounts[org.id] || teamCounts[org.id];
                  return (
                    <Link
                      key={org.id}
                      href={`/organizations/${org.slug || org.id}`}
                      className={`block bg-white border-2 border-black p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group ${hasLinks ? 'ring-2 ring-ochre-200' : ''}`}
                    >
                      {/* Header with type badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-bold text-lg text-earth-900 group-hover:text-ochre-600 transition-colors">
                          {org.name}
                        </h3>
                        {org.type && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-sand-100 border border-black text-xs font-bold uppercase tracking-wide">
                            {org.type.replace('-', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      {org.city && org.state && (
                        <div className="flex items-center gap-1 text-sm text-earth-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          {org.city}, {org.state}
                        </div>
                      )}

                      {/* Description */}
                      {org.description && (
                        <p className="text-sm text-earth-600 mb-4 line-clamp-2">
                          {org.description}
                        </p>
                      )}

                      {/* Linked Content Counts */}
                      {hasLinks && (
                        <div className="pt-3 mt-auto border-t border-earth-200 flex flex-wrap gap-3">
                          {programCounts[org.id] && (
                            <div className="flex items-center gap-1 text-xs font-bold text-eucalyptus-700">
                              <Heart className="w-3 h-3" />
                              {programCounts[org.id]} program{programCounts[org.id] !== 1 ? 's' : ''}
                            </div>
                          )}
                          {serviceCounts[org.id] && (
                            <div className="flex items-center gap-1 text-xs font-bold text-ochre-700">
                              <Briefcase className="w-3 h-3" />
                              {serviceCounts[org.id]} service{serviceCounts[org.id] !== 1 ? 's' : ''}
                            </div>
                          )}
                          {teamCounts[org.id] && (
                            <div className="flex items-center gap-1 text-xs font-bold text-blue-700">
                              <Users className="w-3 h-3" />
                              {teamCounts[org.id]} team
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {org.tags && org.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {org.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="bg-sand-50 border border-earth-200 text-earth-600 px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {org.tags.length > 2 && (
                            <span className="text-earth-400 text-xs py-0.5">
                              +{org.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

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
