import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Link2,
  MapPin,
  Shield,
  Users,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { DetentionCentreMap } from '@/components/organizations/DetentionCentreMap';
import { WhyClaimOrganizationPanel } from '@/components/organizations/OrganizationJourneyPanels';
import { FALLBACK_DETENTION_FACILITIES } from '@/lib/organizations/fallback-detention-centres';

export const dynamic = 'force-dynamic';

interface Centre {
  id: string;
  name: string;
  slug: string | null;
  facility_type: string;
  street_address: string | null;
  suburb: string | null;
  city: string;
  state: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  operational_status: string | null;
  opened_date: string | null;
  closed_date: string | null;
  capacity_beds: number | null;
  current_population: number | null;
  age_range_min: number | null;
  age_range_max: number | null;
  government_department: string;
  managing_agency: string | null;
  website: string | null;
  security_level: string | null;
  has_remand_section: boolean | null;
  has_sentenced_section: boolean | null;
  has_therapeutic_programs: boolean | null;
  has_education_programs: boolean | null;
  has_cultural_programs: boolean | null;
  has_indigenous_liaison: boolean | null;
  indigenous_population_percentage: number | null;
  data_source: string | null;
  data_source_url: string | null;
  last_data_update: string | null;
}

interface PartnershipRow {
  id: string;
  partner_type: string;
  partnership_type: string;
  description: string | null;
  participants_served: number | null;
  organization_id: string | null;
  program_id: string | null;
  service_id: string | null;
}

interface PartnerSummary {
  id: string;
  type: string;
  name: string;
  href: string;
  meta: string;
  partnershipType: string;
  description: string | null;
  participantsServed: number | null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function formatLabel(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ') : 'Not recorded';
}

function fallbackCentre(slugOrId: string): Centre | null {
  const facility = FALLBACK_DETENTION_FACILITIES.find(
    (item) => item.slug === slugOrId || item.id === slugOrId
  );

  if (!facility) return null;

  return {
    ...facility,
    facility_type: 'youth_detention',
    street_address: null,
    suburb: null,
    postcode: null,
    opened_date: null,
    closed_date: null,
    current_population: null,
    age_range_min: 10,
    age_range_max: 18,
    managing_agency: null,
    website: null,
    has_remand_section: true,
    has_sentenced_section: true,
    has_therapeutic_programs: null,
    has_education_programs: true,
    has_cultural_programs: null,
    has_indigenous_liaison: null,
    indigenous_population_percentage: null,
    data_source: 'Local baseline',
    data_source_url: null,
    last_data_update: null,
  };
}

async function getCentre(slugOrId: string): Promise<Centre | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('youth_detention_facilities')
    .select('*')
    .eq(isUuid(slugOrId) ? 'id' : 'slug', slugOrId)
    .single();

  if (error) {
    console.error('Error fetching centre:', error);
    return fallbackCentre(slugOrId);
  }

  return data as Centre;
}

async function getPartnerships(centreId: string): Promise<PartnerSummary[]> {
  const supabase = createServiceClient();
  const { data: partnershipRows, error } = await supabase
    .from('facility_partnerships')
    .select('id, partner_type, partnership_type, description, participants_served, organization_id, program_id, service_id')
    .eq('facility_id', centreId)
    .eq('is_active', true)
    .order('partnership_type');

  if (error) {
    console.error('Error fetching centre partnerships:', error);
    return [];
  }

  const rows = (partnershipRows || []) as PartnershipRow[];
  const organizationIds = rows.map((row) => row.organization_id).filter((id): id is string => Boolean(id));
  const programIds = rows.map((row) => row.program_id).filter((id): id is string => Boolean(id));
  const serviceIds = rows.map((row) => row.service_id).filter((id): id is string => Boolean(id));

  const [organizationsResult, programsResult, servicesResult] = await Promise.all([
    organizationIds.length
      ? (supabase as any)
        .from('organizations')
        .select('id, name, slug, type, city, state')
        .in('id', organizationIds)
      : Promise.resolve({ data: [] }),
    programIds.length
      ? (supabase as any)
        .from('registered_services')
        .select('id, name, slug, organization, location, state')
        .in('id', programIds)
      : Promise.resolve({ data: [] }),
    serviceIds.length
      ? (supabase as any)
        .from('services')
        .select('id, name, slug, category, location_city, location_state')
        .in('id', serviceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const organizations = new Map((organizationsResult.data || []).map((org: any) => [org.id, org]));
  const programs = new Map((programsResult.data || []).map((program: any) => [program.id, program]));
  const services = new Map((servicesResult.data || []).map((service: any) => [service.id, service]));

  return rows.map((row) => {
    if (row.organization_id && organizations.has(row.organization_id)) {
      const org = organizations.get(row.organization_id);
      return {
        id: row.id,
        type: 'Organization',
        name: org.name,
        href: `/organizations/${org.slug || org.id}`,
        meta: [org.type?.replace('-', ' '), org.city, org.state].filter(Boolean).join(' · '),
        partnershipType: row.partnership_type,
        description: row.description,
        participantsServed: row.participants_served,
      };
    }

    if (row.program_id && programs.has(row.program_id)) {
      const program = programs.get(row.program_id);
      return {
        id: row.id,
        type: 'Program',
        name: program.name,
        href: `/community-programs/${program.slug || program.id}`,
        meta: [program.organization, program.location, program.state].filter(Boolean).join(' · '),
        partnershipType: row.partnership_type,
        description: row.description,
        participantsServed: row.participants_served,
      };
    }

    if (row.service_id && services.has(row.service_id)) {
      const service = services.get(row.service_id);
      return {
        id: row.id,
        type: 'Service',
        name: service.name,
        href: `/services/${service.slug || service.id}`,
        meta: [service.category, service.location_city, service.location_state].filter(Boolean).join(' · '),
        partnershipType: row.partnership_type,
        description: row.description,
        participantsServed: row.participants_served,
      };
    }

    return {
      id: row.id,
      type: formatLabel(row.partner_type),
      name: 'Linked record',
      href: '/organizations',
      meta: 'Record needs enrichment',
      partnershipType: row.partnership_type,
      description: row.description,
      participantsServed: row.participants_served,
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const centre = await getCentre(params.slug);

  if (!centre) {
    return { title: 'Centre Not Found' };
  }

  return {
    title: `${centre.name} | JusticeHub`,
    description: `Centre profile for ${centre.name} in ${centre.city}, ${centre.state}.`,
  };
}

export default async function CentrePage({
  params,
}: {
  params: { slug: string };
}) {
  const centre = await getCentre(params.slug);
  if (!centre) notFound();

  const partnerships = await getPartnerships(centre.id);
  const location = [centre.street_address, centre.suburb || centre.city, centre.state, centre.postcode]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-sand-50 to-white page-content">
        <section className="border-b-2 border-black bg-white py-6">
          <div className="container-justice">
            <Link href="/organizations#centre-list" className="inline-flex items-center gap-2 text-sm font-bold text-earth-600 hover:text-ochre-700">
              <ArrowLeft className="h-4 w-4" />
              Back to centres
            </Link>
          </div>
        </section>

        <section className="border-b-2 border-black bg-gradient-to-br from-red-50 via-sand-50 to-white py-12">
          <div className="container-justice">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="border-2 border-red-600 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                    {formatLabel(centre.operational_status)}
                  </span>
                  <span className="border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
                    {formatLabel(centre.facility_type)}
                  </span>
                </div>
                <h1 className="text-5xl font-bold leading-tight text-earth-900">{centre.name}</h1>
                <p className="mt-4 flex items-center gap-2 text-lg text-earth-700">
                  <MapPin className="h-5 w-5" />
                  {location || `${centre.city}, ${centre.state}`}
                </p>
                <p className="mt-6 max-w-3xl text-lg text-earth-700">
                  Centre profiles connect custody places to the organizations, services, funding records, and stories around them. The goal is to make the system legible enough for better support, better accountability, and better reinvestment decisions.
                </p>
              </div>

              <div className="border-2 border-black bg-white p-5">
                <h2 className="mb-4 text-xl font-bold">Centre Snapshot</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-black p-3">
                    <div className="text-2xl font-bold text-red-600">{centre.capacity_beds || 0}</div>
                    <div className="text-xs uppercase tracking-wide">beds</div>
                  </div>
                  <div className="border border-black p-3">
                    <div className="text-2xl font-bold">{partnerships.length}</div>
                    <div className="text-xs uppercase tracking-wide">active links</div>
                  </div>
                  <div className="border border-black p-3">
                    <div className="text-lg font-bold capitalize">{formatLabel(centre.security_level)}</div>
                    <div className="text-xs uppercase tracking-wide">security</div>
                  </div>
                  <div className="border border-black p-3">
                    <div className="text-lg font-bold">{centre.age_range_min || 10}-{centre.age_range_max || 18}</div>
                    <div className="text-xs uppercase tracking-wide">age range</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black py-10">
          <div className="container-justice">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <DetentionCentreMap facilities={[centre]} height="380px" showControls={false} />

              <div className="border-2 border-black bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Shield className="h-6 w-6 text-red-600" />
                  Operating Context
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-earth-200 pb-2">
                    <span className="text-earth-500">Department</span>
                    <span className="text-right font-bold">{centre.government_department}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-earth-200 pb-2">
                    <span className="text-earth-500">Managing agency</span>
                    <span className="text-right font-bold">{centre.managing_agency || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-earth-200 pb-2">
                    <span className="text-earth-500">Education programs</span>
                    <span className="font-bold">{centre.has_education_programs ? 'Recorded' : 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-earth-200 pb-2">
                    <span className="text-earth-500">Cultural programs</span>
                    <span className="font-bold">{centre.has_cultural_programs ? 'Recorded' : 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-earth-200 pb-2">
                    <span className="text-earth-500">Therapeutic programs</span>
                    <span className="font-bold">{centre.has_therapeutic_programs ? 'Recorded' : 'Not recorded'}</span>
                  </div>
                  {centre.website && (
                    <a href={centre.website} className="inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900">
                      Official website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <WhyClaimOrganizationPanel claimHref="/hub" variant="centre" />

        <section className="py-12">
          <div className="container-justice">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-3 text-3xl font-bold text-earth-900">
                  <Link2 className="h-8 w-8 text-blue-700" />
                  Linked Organizations, Programs, and Services
                </h2>
                <p className="mt-2 text-earth-600">
                  These links are the useful layer: who is inside, who supports transition, who can tell stories, and where funding can be traced.
                </p>
              </div>
              <Link href="/hub" className="border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white">
                Claim or enrich an organization
              </Link>
            </div>

            {partnerships.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {partnerships.map((partner) => (
                  <Link
                    key={partner.id}
                    href={partner.href}
                    className="border-2 border-black bg-white p-5 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">{partner.type}</div>
                        <h3 className="text-xl font-bold text-earth-900">{partner.name}</h3>
                      </div>
                      <span className="shrink-0 border border-black bg-sand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                        {formatLabel(partner.partnershipType)}
                      </span>
                    </div>
                    {partner.meta && <p className="text-sm text-earth-600">{partner.meta}</p>}
                    {partner.description && <p className="mt-3 text-sm text-earth-700">{partner.description}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-earth-200 pt-3 text-xs font-bold text-earth-700">
                      {partner.participantsServed ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {partner.participantsServed} participants served
                        </span>
                      ) : (
                        <span>Impact data open</span>
                      )}
                      <span className="text-blue-700">Open record →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-2 border-black bg-white p-8">
                <Building2 className="mb-4 h-10 w-10 text-earth-500" />
                <h3 className="text-2xl font-bold text-earth-900">No active partnerships recorded yet.</h3>
                <p className="mt-2 max-w-2xl text-earth-600">
                  This is the gap the directory is meant to close: centres need visible links to community programs, services, story partners, and funding pathways.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
