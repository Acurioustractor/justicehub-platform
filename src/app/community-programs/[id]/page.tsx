'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Users,
  Phone,
  Mail,
  Globe,
  Award,
  Calendar,
  TrendingUp,
  Heart,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Mountain
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ProfileCard from '@/components/ProfileCard';

interface ProfileData {
  profile: {
    id: string;
    name?: string;
    preferred_name?: string;
    bio?: string;
    profile_picture_url?: string;
    organization?: {
      name: string;
    };
  };
  appearanceRole?: string;
  appearanceExcerpt?: string;
  isFeatured?: boolean;
}

// Founding Basecamps - Centre of Excellence network
const FOUNDING_BASECAMP_SLUGS = ['oonchiumpa', 'bg-fit', 'bg fit', 'mounty-yarns', 'mounty yarns', 'picc'];

interface CommunityProgram {
  id: string;
  name: string;
  organization: string;
  organization_id?: string | null;
  organization_slug?: string | null;
  location: string;
  state: string;
  approach: string;
  description: string;
  impact_summary: string;
  success_rate: number;
  participants_served: number;
  years_operating: number;
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
  is_featured: boolean;
  indigenous_knowledge: boolean;
  community_connection_score: number;
  tags: string[];
  founded_year: number;
  alma_intervention_id?: string | null;
}

type ProgramApiRecord = {
  id?: string | null;
  name?: string | null;
  organization_name?: string | null;
  organization?: string | null;
  organization_id?: string | null;
  organization_slug?: string | null;
  location?: string | null;
  state?: string | null;
  approach?: string | null;
  description?: string | null;
  impact_summary?: string | null;
  success_rate?: number | null;
  participants_served?: number | null;
  years_operating?: number | null;
  founded_year?: number | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
  is_featured?: boolean | null;
  indigenous_knowledge?: boolean | null;
  community_connection_score?: number | null;
  tags?: string[] | null;
  alma_intervention_id?: string | null;
};

function toNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeProgram(record: unknown): CommunityProgram | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const raw = record as ProgramApiRecord;
  const id = asNullableString(raw.id);
  if (!id) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const yearsOperating = toNumber(raw.years_operating, 0);
  const foundedYear = toNumber(
    raw.founded_year,
    yearsOperating > 0 ? Math.max(1900, currentYear - yearsOperating) : currentYear
  );

  return {
    id,
    name: asNullableString(raw.name) || 'Unnamed Program',
    organization: asNullableString(raw.organization_name) || asNullableString(raw.organization) || 'Community Program',
    organization_id: asNullableString(raw.organization_id),
    organization_slug: asNullableString(raw.organization_slug),
    location: asNullableString(raw.location) || 'Australia',
    state: asNullableString(raw.state) || 'National',
    approach: asNullableString(raw.approach) || 'Community-based',
    description: asNullableString(raw.description) || 'No description available yet.',
    impact_summary: asNullableString(raw.impact_summary) || 'No impact summary available yet.',
    success_rate: toNumber(raw.success_rate, 0),
    participants_served: toNumber(raw.participants_served, 0),
    years_operating: yearsOperating,
    contact_phone: asNullableString(raw.contact_phone),
    contact_email: asNullableString(raw.contact_email),
    website: asNullableString(raw.website),
    is_featured: asNullableBoolean(raw.is_featured) ?? false,
    indigenous_knowledge: asNullableBoolean(raw.indigenous_knowledge) ?? false,
    community_connection_score: toNumber(raw.community_connection_score, 0),
    tags: asStringArray(raw.tags),
    founded_year: foundedYear,
    alma_intervention_id: asNullableString(raw.alma_intervention_id),
  };
}

function normalizeProfileData(input: unknown): ProfileData | null {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const row = input as Record<string, unknown>;
  const rawProfile = row.profile;
  if (!rawProfile || typeof rawProfile !== 'object') {
    return null;
  }

  const profileRecord = rawProfile as Record<string, unknown>;
  const profileId = asNullableString(profileRecord.id);
  if (!profileId) {
    return null;
  }

  const organizationValue = profileRecord.organization;
  let organization: { name: string } | undefined;
  if (organizationValue && typeof organizationValue === 'object') {
    const orgName = asNullableString((organizationValue as Record<string, unknown>).name);
    if (orgName) {
      organization = { name: orgName };
    }
  }

  return {
    profile: {
      id: profileId,
      name: asNullableString(profileRecord.name) ?? undefined,
      preferred_name: asNullableString(profileRecord.preferred_name) ?? undefined,
      bio: asNullableString(profileRecord.bio) ?? undefined,
      profile_picture_url: asNullableString(profileRecord.profile_picture_url) ?? undefined,
      organization,
    },
    appearanceRole: asNullableString(row.appearanceRole) ?? undefined,
    appearanceExcerpt: asNullableString(row.appearanceExcerpt) ?? undefined,
    isFeatured: asNullableBoolean(row.isFeatured) ?? undefined,
  };
}

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const programId = params?.id;
  const [program, setProgram] = useState<CommunityProgram | null>(null);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [relatedPrograms, setRelatedPrograms] = useState<CommunityProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [isBasecampAffiliated, setIsBasecampAffiliated] = useState(false);

  useEffect(() => {
    async function fetchProgram() {
      setLoading(true);
      try {
        const response = await fetch(`/api/programs/${encodeURIComponent(programId)}`, { cache: 'no-store' });
        if (!response.ok) {
          console.error('Error fetching program:', response.status, response.statusText);
          setProgram(null);
          return;
        }

        const payload = await response.json();
        if (!payload || typeof payload !== 'object') {
          setProgram(null);
          return;
        }
        const payloadRecord = payload as Record<string, unknown>;
        if (!payloadRecord.success || !payloadRecord.program) {
          setProgram(null);
          return;
        }

        const normalizedProgram = normalizeProgram(payloadRecord.program);
        if (!normalizedProgram) {
          setProgram(null);
          return;
        }
        setProgram(normalizedProgram);

        // Check if affiliated with a founding basecamp
        const orgSlug = normalizedProgram.organization_slug?.toLowerCase() || '';
        const orgName = normalizedProgram.organization.toLowerCase();
        const isBasecamp = FOUNDING_BASECAMP_SLUGS.some(
          (basecamp) => orgSlug.includes(basecamp) || orgName.includes(basecamp)
        );
        setIsBasecampAffiliated(isBasecamp);

        // Fetch related programs from canonical API, then filter by approach/state.
        const relatedResponse = await fetch('/api/programs?limit=200', { cache: 'no-store' });
        if (!relatedResponse.ok) {
          return;
        }

        const relatedPayload = await relatedResponse.json();
        const relatedPayloadRecord = relatedPayload && typeof relatedPayload === 'object'
          ? (relatedPayload as Record<string, unknown>)
          : null;
        const relatedRecords = Array.isArray(relatedPayloadRecord?.programs)
          ? (relatedPayloadRecord.programs as unknown[])
          : [];
        const related = relatedRecords
          .map(normalizeProgram)
          .filter((item): item is CommunityProgram => item !== null)
          .filter((item) => {
            if (item.id === normalizedProgram.id) return false;
            return item.approach === normalizedProgram.approach || item.state === normalizedProgram.state;
          })
          .slice(0, 3);

        setRelatedPrograms(related);
      } catch (error) {
        console.error('Error fetching program:', error);
        setProgram(null);
      } finally {
        setLoading(false);
      }
    }

    async function fetchProfiles() {
      setProfilesLoading(true);
      try {
        const response = await fetch(`/api/programs/${encodeURIComponent(programId)}/profiles`);
        if (response.ok) {
          const data = await response.json();
          const dataRecord = data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : null;
          const profileRows = Array.isArray(dataRecord?.profiles)
            ? (dataRecord.profiles as unknown[])
            : [];
          const normalizedProfiles = profileRows
            .map(normalizeProfileData)
            .filter((row): row is ProfileData => row !== null);
          setProfiles(normalizedProfiles);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setProfilesLoading(false);
      }
    }

    if (typeof programId === 'string' && programId.length > 0) {
      fetchProgram();
      fetchProfiles();
    }
  }, [programId]);

  const getApproachColor = (approach: string) => {
    switch (approach) {
      case 'Indigenous-led': return 'bg-orange-600 text-white';
      case 'Community-based': return 'bg-blue-800 text-white';
      case 'Grassroots': return 'bg-blue-600 text-white';
      case 'Culturally-responsive': return 'bg-orange-700 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-12 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-6">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Program Not Found</h1>
          <p className="text-gray-600 mb-8">The program you're looking for doesn't exist.</p>
          <Link href="/community-programs" className="cta-primary">
            ← Back to Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Breadcrumb */}
        <section className="header-offset pb-6 border-b">
          <div className="container-justice">
            <Link
              href="/community-programs"
              className="inline-flex items-center gap-2 text-blue-800 hover:text-blue-600 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Programs
            </Link>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-2 text-sm font-bold uppercase tracking-wider ${getApproachColor(program.approach)}`}>
                    {program.approach}
                  </span>
                  {program.indigenous_knowledge && (
                    <span className="px-4 py-2 bg-orange-100 text-orange-800 text-sm font-bold uppercase tracking-wider">
                      ✦ Indigenous Knowledge
                    </span>
                  )}
                  {program.is_featured && (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold uppercase tracking-wider">
                      ★ Featured
                    </span>
                  )}
                  {isBasecampAffiliated && (
                    <Link
                      href="/centre-of-excellence"
                      className="px-4 py-2 bg-ochre-600 text-white text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-ochre-700 transition-colors"
                    >
                      <Mountain className="w-4 h-4" />
                      Centre of Excellence
                    </Link>
                  )}
                  {program.alma_intervention_id && (
                    <Link
                      href={`/intelligence/interventions/${program.alma_intervention_id}`}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Evidence Context
                    </Link>
                  )}
                </div>

                <h1 className="text-5xl font-bold mb-4">{program.name}</h1>
                {program.organization_slug ? (
                  <Link
                    href={`/organizations/${program.organization_slug}`}
                    className="text-2xl text-blue-700 hover:text-blue-600 mb-4 inline-flex items-center gap-2 font-medium"
                  >
                    {program.organization}
                    <ExternalLink className="h-5 w-5" />
                  </Link>
                ) : (
                  <p className="text-2xl text-gray-700 mb-4">{program.organization}</p>
                )}
                <p className="text-xl text-gray-600 flex items-center gap-2 mt-4">
                  <MapPin className="h-5 w-5" />
                  {program.location}, {program.state}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-800 p-6 mb-8">
              <p className="text-xl leading-relaxed text-gray-800">
                {program.impact_summary}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="data-card text-center">
                <div className="font-mono text-4xl font-bold text-blue-800 mb-2">
                  {program.success_rate}%
                </div>
                <p className="font-medium text-gray-700">Success Rate</p>
                <p className="text-sm text-gray-600 mt-1">Community-driven results</p>
              </div>

              <div className="data-card text-center">
                <div className="font-mono text-4xl font-bold text-orange-600 mb-2">
                  {program.participants_served}+
                </div>
                <p className="font-medium text-gray-700">Lives Transformed</p>
                <p className="text-sm text-gray-600 mt-1">Young people served</p>
              </div>

              <div className="data-card text-center">
                <div className="font-mono text-4xl font-bold text-blue-600 mb-2">
                  {program.years_operating}
                </div>
                <p className="font-medium text-gray-700">Years Operating</p>
                <p className="text-sm text-gray-600 mt-1">Since {program.founded_year}</p>
              </div>

              <div className="data-card text-center">
                <div className="font-mono text-4xl font-bold text-green-600 mb-2">
                  {program.community_connection_score}
                </div>
                <p className="font-medium text-gray-700">Community Score</p>
                <p className="text-sm text-gray-600 mt-1">Out of 100</p>
              </div>
            </div>
          </div>
        </section>

        {/* Program Details */}
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold mb-6">About This Program</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed text-gray-800 mb-6">
                    {program.description}
                  </p>

                  <h3 className="text-2xl font-bold mt-8 mb-4">Our Approach</h3>
                  <p className="text-lg leading-relaxed text-gray-800 mb-6">
                    {program.approach === 'Indigenous-led' && (
                      <>
                        This program is led by Indigenous community members and grounded in traditional knowledge and cultural practices.
                        We prioritize connection to country, elder wisdom, and cultural healing as pathways to transformation.
                      </>
                    )}
                    {program.approach === 'Community-based' && (
                      <>
                        Rooted in local community strengths and relationships, this program connects young people with
                        trusted mentors, practical skills, and meaningful opportunities. We believe change happens through
                        authentic community connection and tailored support.
                      </>
                    )}
                    {program.approach === 'Grassroots' && (
                      <>
                        Built from the ground up by community members who understand the challenges firsthand, this program
                        empowers young people to become agents of change in their own communities. We prioritize youth voice,
                        leadership, and collective action.
                      </>
                    )}
                    {program.approach === 'Culturally-responsive' && (
                      <>
                        Designed to honor and respond to the cultural backgrounds and experiences of participants, this program
                        integrates cultural knowledge, family connections, and community values into every aspect of support.
                      </>
                    )}
                  </p>

                  <h3 className="text-2xl font-bold mt-8 mb-4">What Makes Us Effective</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <Heart className="h-6 w-6 text-blue-800 flex-shrink-0 mt-1" />
                      <span className="text-lg">Relationship-centered approach with intensive mentoring and wraparound support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Users className="h-6 w-6 text-blue-800 flex-shrink-0 mt-1" />
                      <span className="text-lg">Deep community connections and locally-driven solutions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-6 w-6 text-blue-800 flex-shrink-0 mt-1" />
                      <span className="text-lg">Evidence-based practices combined with cultural wisdom</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Award className="h-6 w-6 text-blue-800 flex-shrink-0 mt-1" />
                      <span className="text-lg">Proven track record of {program.success_rate}% success rate over {program.years_operating} years</span>
                    </li>
                  </ul>

                  <h3 className="text-2xl font-bold mt-8 mb-4">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {program.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-2 bg-gray-100 border-2 border-black text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="data-card sticky top-24">
                  <h3 className="text-xl font-bold mb-6">Get In Touch</h3>

                  <div className="space-y-4">
                    {program.contact_phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-blue-800 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                          <a
                            href={`tel:${program.contact_phone}`}
                            className="text-blue-800 hover:text-blue-600 font-medium"
                          >
                            {program.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {program.contact_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-800 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                          <a
                            href={`mailto:${program.contact_email}`}
                            className="text-blue-800 hover:text-blue-600 font-medium break-all"
                          >
                            {program.contact_email}
                          </a>
                        </div>
                      </div>
                    )}

                    {program.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-blue-800 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Website</p>
                          <a
                            href={program.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-800 hover:text-blue-600 font-medium inline-flex items-center gap-1"
                          >
                            Visit website
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 pt-4 border-t">
                      <MapPin className="h-5 w-5 text-blue-800 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                        <p className="font-medium">{program.location}, {program.state}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-800 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Established</p>
                        <p className="font-medium">{program.founded_year}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t">
                    <Link
                      href="/services"
                      className="block w-full text-center cta-secondary mb-3"
                    >
                      Find Immediate Help
                    </Link>
                    <Link
                      href="/community-programs"
                      className="block w-full text-center text-blue-800 hover:text-blue-600 font-bold text-sm"
                    >
                      ← Explore More Programs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Participant Stories */}
        {profiles.length > 0 && (
          <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 border-t-2 border-b-2 border-black">
            <div className="container-justice">
              <h2 className="text-4xl font-bold mb-6 flex items-center gap-3">
                <Users className="h-10 w-10" />
                Hear from Participants
              </h2>
              <p className="text-xl text-gray-700 mb-10">
                Real stories from young people who have been part of this transformative program.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profileData, index) => (
                  <ProfileCard
                    key={profileData.profile.id + index}
                    profile={profileData.profile}
                    role={profileData.appearanceRole}
                    storyExcerpt={profileData.appearanceExcerpt}
                    isFeatured={profileData.isFeatured}
                  />
                ))}
              </div>

              <div className="mt-8 text-sm text-gray-700 p-6 bg-white/80 border-2 border-black">
                <p>
                  <strong>About these stories:</strong> Shared through <strong>Empathy Ledger</strong>,
                  an Indigenous-led storytelling platform. All stories honor cultural protocols,
                  maintain data sovereignty, and are shared with explicit consent from storytellers.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Related Evidence & Research */}
        <section className="py-16 border-b-2 border-black bg-sand-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4">Related Evidence & Research</h2>
            <p className="text-lg text-gray-700 mb-8">
              Explore the evidence base supporting programs like this one.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href={`/youth-justice-report/interventions?approach=${encodeURIComponent(program.approach)}`}
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-ochre-600 font-bold text-sm uppercase tracking-wider mb-2">
                  ALMA Interventions
                </div>
                <h3 className="text-xl font-bold mb-2">Evidence-Based Approaches</h3>
                <p className="text-gray-600 mb-4">
                  View interventions rated by our ALMA system that align with {program.approach} programs.
                </p>
                <span className="text-ochre-600 font-bold inline-flex items-center gap-1">
                  Explore <ChevronRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href={`/centre-of-excellence/best-practice?state=${program.state}`}
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-eucalyptus-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Best Practice
                </div>
                <h3 className="text-xl font-bold mb-2">State-Based Research</h3>
                <p className="text-gray-600 mb-4">
                  Best practice frameworks and case studies from {program.state}.
                </p>
                <span className="text-eucalyptus-600 font-bold inline-flex items-center gap-1">
                  Learn More <ChevronRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/centre-of-excellence/global-insights"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Global Insights
                </div>
                <h3 className="text-xl font-bold mb-2">International Models</h3>
                <p className="text-gray-600 mb-4">
                  See how similar programs work in other countries around the world.
                </p>
                <span className="text-blue-600 font-bold inline-flex items-center gap-1">
                  Discover <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Programs */}
        {relatedPrograms.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container-justice">
              <h2 className="text-3xl font-bold mb-8 text-center">More Programs Like This</h2>
              <p className="text-center text-gray-600 mb-8">
                Similar programs by approach or location
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPrograms.map((relatedProgram) => (
                  <div key={relatedProgram.id} className="data-card bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${getApproachColor(relatedProgram.approach)}`}>
                        {relatedProgram.approach}
                      </span>
                      {relatedProgram.indigenous_knowledge && (
                        <span className="text-orange-600 text-xs font-bold">✦ Indigenous</span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg mb-2">{relatedProgram.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{relatedProgram.organization}</p>
                    <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {relatedProgram.location}, {relatedProgram.state}
                    </p>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{relatedProgram.description}</p>

                    <Link
                      href={`/community-programs/${relatedProgram.id}`}
                      className="text-sm font-bold underline text-blue-800 hover:text-blue-600 inline-flex items-center gap-1"
                    >
                      Learn more
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link href="/community-programs" className="cta-secondary">
                  VIEW ALL PROGRAMS
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
