import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  Heart,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Play,
  Quote,
  Target,
  Sparkles,
  Shield,
  TrendingDown,
  GraduationCap,
  Mountain,
  Calendar,
  Dumbbell,
  FileText,
  Mic,
  Eye,
  Home,
  Award,
  Link2,
  ImageIcon
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  verification_status: string;
  is_active: boolean;
  city: string;
  state: string;
  website: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  created_at: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  impact_summary: string;
  success_rate: number;
  participants_served: number;
  approach: string;
  is_featured: boolean;
  tags: string[];
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  location_city: string | null;
  location_state: string | null;
}

interface TeamMember {
  id: string;
  role: string;
  role_description: string | null;
  is_featured: boolean;
  public_profiles: {
    id: string;
    full_name: string;
    slug: string;
    photo_url: string | null;
    tagline: string | null;
    role_tags: string[];
  };
}

// Partner enrichment interfaces
interface Storyteller {
  id: string;
  display_name: string;
  role_at_org: string | null;
  bio_excerpt: string | null;
  quote: string | null;
  avatar_url: string | null;
  is_featured: boolean;
  display_order: number;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  platform: string;
  video_type: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_featured: boolean;
}

interface Story {
  id: string;
  title: string;
  quote: string | null;
  summary: string | null;
  excerpt: string | null;
  story_type: string | null;
  tags: string[] | null;
  is_featured: boolean;
}

interface PartnerGoal {
  id: string;
  goal_type: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

interface ImpactMetric {
  id: string;
  metric_name: string;
  metric_value: string;
  metric_context: string | null;
  icon: string | null;
  is_featured: boolean;
  display_order: number;
}

interface ExternalLink {
  id: string;
  title: string;
  url: string;
  link_type: string;
  description: string | null;
  display_order: number;
}

interface PartnerContact {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
}

interface Photo {
  id: string;
  title: string | null;
  description: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  photo_type: string;
  is_featured: boolean;
  display_order: number;
}

async function getOrganization(slugOrId: string): Promise<Organization | null> {
  const supabase = createServiceClient();

  // Check if it's a UUID (ID) or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  // Try by slug first, then by ID
  let { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq(isUUID ? 'id' : 'slug', slugOrId)
    .eq('is_active', true)
    .single();

  // If not found by slug and it wasn't a UUID, try by ID anyway
  if (error && !isUUID) {
    const result = await supabase
      .from('organizations')
      .select('*')
      .eq('id', slugOrId)
      .eq('is_active', true)
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

async function getOrganizationPrograms(orgId: string): Promise<Program[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('registered_services')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_featured', { ascending: false })
    .order('name');

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return data || [];
}

async function getOrganizationServices(orgId: string): Promise<Service[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, slug, category, description, location_city, location_state')
    .eq('organization_id', orgId)
    .order('name');

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}

async function getOrganizationTeam(orgId: string): Promise<TeamMember[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('organizations_profiles')
    .select(`
      id,
      role,
      role_description,
      is_featured,
      public_profiles (
        id,
        full_name,
        slug,
        photo_url,
        tagline,
        role_tags
      )
    `)
    .eq('organization_id', orgId)
    .eq('is_current', true)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching team:', error);
    return [];
  }

  return (data || []) as TeamMember[];
}

// Partner enrichment fetch functions
async function getStorytellers(orgId: string): Promise<Storyteller[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_storytellers')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching storytellers:', error);
    return [];
  }
  return data || [];
}

async function getVideos(orgId: string): Promise<Video[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_videos')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
  return data || [];
}

async function getStories(orgId: string): Promise<Story[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_stories')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
  return data || [];
}

async function getGoals(orgId: string): Promise<PartnerGoal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_goals')
    .select('*')
    .eq('organization_id', orgId)
    .order('display_order');

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return data || [];
}

async function getImpactMetrics(orgId: string): Promise<ImpactMetric[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_impact_metrics')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching impact metrics:', error);
    return [];
  }
  return data || [];
}

async function getExternalLinks(orgId: string): Promise<ExternalLink[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_external_links')
    .select('*')
    .eq('organization_id', orgId)
    .order('display_order');

  if (error) {
    console.error('Error fetching external links:', error);
    return [];
  }
  return data || [];
}

async function getContacts(orgId: string): Promise<PartnerContact[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_contacts')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_primary', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data || [];
}

async function getPhotos(orgId: string): Promise<Photo[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_photos')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
  return data || [];
}

// Icon mapping helper
function getIcon(iconName: string | null) {
  const icons: Record<string, any> = {
    Target, Heart, Sparkles, Users, Shield, TrendingDown, GraduationCap,
    Mountain, Calendar, Dumbbell, FileText, Mic, Eye, Home, Award, Star,
    Globe, CheckCircle, Building2, Briefcase
  };
  return icons[iconName || ''] || Star;
}

// Founding Basecamps - the 4 anchor organizations of the Centre of Excellence
const FOUNDING_BASECAMPS = [
  { slug: 'oonchiumpa', name: 'Oonchiumpa', region: 'Alice Springs, NT' },
  { slug: 'bg-fit', name: 'BG Fit', region: 'Mount Isa, QLD' },
  { slug: 'mounty-yarns', name: 'Mounty Yarns', region: 'Western Sydney, NSW' },
  { slug: 'picc-townsville', name: 'PICC Townsville', region: 'Townsville, QLD' },
];

function isFoundingBasecamp(slug: string): boolean {
  return FOUNDING_BASECAMPS.some(bc => bc.slug === slug);
}

function getOtherBasecamps(currentSlug: string) {
  return FOUNDING_BASECAMPS.filter(bc => bc.slug !== currentSlug);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const org = await getOrganization(params.slug);

  if (!org) {
    return {
      title: 'Organization Not Found',
    };
  }

  return {
    title: `${org.name} | JusticeHub`,
    description: org.description || `Learn about ${org.name} and their programs`,
  };
}

export default async function OrganizationPage({
  params,
}: {
  params: { slug: string };
}) {
  const org = await getOrganization(params.slug);

  if (!org) {
    notFound();
  }

  // Fetch all related data in parallel
  const [programs, services, team, storytellers, videos, stories, goals, impactMetrics, externalLinks, contacts, photos] = await Promise.all([
    getOrganizationPrograms(org.id),
    getOrganizationServices(org.id),
    getOrganizationTeam(org.id),
    getStorytellers(org.id),
    getVideos(org.id),
    getStories(org.id),
    getGoals(org.id),
    getImpactMetrics(org.id),
    getExternalLinks(org.id),
    getContacts(org.id),
    getPhotos(org.id),
  ]);

  // Separate goals by type
  const mission = goals.find(g => g.goal_type === 'mission');
  const vision = goals.find(g => g.goal_type === 'vision');
  const values = goals.filter(g => g.goal_type === 'value');

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="page-content">
        {/* Breadcrumbs */}
        <div className="bg-white border-b-2 border-black">
          <div className="container-justice py-4">
            <nav className="flex items-center gap-2 text-sm text-earth-600">
              <Link href="/" className="hover:text-ochre-600">
                Home
              </Link>
              <span>/</span>
              <Link href="/organizations" className="hover:text-ochre-600">
                Organizations
              </Link>
              <span>/</span>
              <span className="text-earth-900 font-medium">{org.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl">
              {/* Founding Basecamp Badge */}
              {isFoundingBasecamp(org.slug) && (
                <div className="mb-4">
                  <Link
                    href="/centre-of-excellence/map?category=basecamp"
                    className="inline-flex items-center gap-2 bg-ochre-600 text-white px-4 py-2 border-2 border-black text-sm font-bold uppercase tracking-wider hover:bg-ochre-700 transition-colors"
                  >
                    <Mountain className="w-4 h-4" />
                    Founding Basecamp
                    <span className="text-ochre-200">|</span>
                    <span className="font-normal">Part of Centre of Excellence Network</span>
                  </Link>
                </div>
              )}

              {/* Verification Badge */}
              {org.verification_status === 'verified' && (
                <div className="inline-flex items-center gap-2 bg-eucalyptus-100 text-eucalyptus-800 px-3 py-1 border border-black text-sm font-bold uppercase tracking-wider mb-4">
                  <CheckCircle className="w-4 h-4" />
                  Verified Organization
                </div>
              )}

              <h1 className="text-5xl md:text-6xl font-black text-earth-900 mb-4">
                {org.name}
              </h1>

              {/* Location & Type */}
              <div className="flex flex-wrap gap-4 mb-6">
                {org.city && org.state && (
                  <div className="flex items-center gap-2 text-earth-700 font-medium">
                    <MapPin className="w-5 h-5" />
                    {org.city}, {org.state}
                  </div>
                )}
                {org.type && (
                  <span className="px-3 py-1 bg-black text-white text-sm font-bold uppercase tracking-wider">
                    {org.type.replace('-', ' ')}
                  </span>
                )}
              </div>

              {/* Description */}
              {org.description && (
                <p className="text-xl text-earth-700 mb-8 leading-relaxed max-w-3xl">
                  {org.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 mb-8 pt-6 border-t-2 border-black/10">
                {programs.length > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-eucalyptus-600">{programs.length}</div>
                    <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">Programs</p>
                  </div>
                )}
                {services.length > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-ochre-600">{services.length}</div>
                    <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">Services</p>
                  </div>
                )}
                {team.length > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{team.length}</div>
                    <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">Team Members</p>
                  </div>
                )}
              </div>

              {/* Contact Links */}
              <div className="flex flex-wrap gap-4">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-earth-800 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    Visit Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                )}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                )}
              </div>

              {/* Tags */}
              {org.tags && org.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8">
                  {org.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-white border border-black text-earth-700 px-3 py-1 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Team Section */}
        {team.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Users className="h-8 w-8" />
                <h2 className="text-3xl font-black">Team</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member) => (
                  <Link
                    key={member.id}
                    href={`/people/${member.public_profiles.slug}`}
                    className="group border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {member.public_profiles.photo_url ? (
                        <img
                          src={member.public_profiles.photo_url}
                          alt={member.public_profiles.full_name}
                          className="w-16 h-16 rounded-full border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-black bg-sand-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-earth-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg group-hover:text-ochre-600 transition-colors truncate">
                          {member.public_profiles.full_name}
                        </h3>
                        <p className="text-sm text-ochre-600 font-medium">{member.role}</p>
                        {member.role_description && (
                          <p className="text-sm text-earth-600 mt-1 line-clamp-2">{member.role_description}</p>
                        )}
                      </div>
                    </div>
                    {member.is_featured && (
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ochre-600">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Impact Metrics Section */}
        {impactMetrics.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-eucalyptus-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <TrendingDown className="h-8 w-8 text-eucalyptus-600" />
                <h2 className="text-3xl font-black">Impact</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {impactMetrics.map((metric) => {
                  const IconComponent = getIcon(metric.icon);
                  return (
                    <div key={metric.id} className="bg-white p-6 border-2 border-black">
                      <IconComponent className="w-8 h-8 mb-3 text-eucalyptus-600" />
                      <div className="text-4xl font-black text-eucalyptus-700 mb-1">{metric.metric_value}</div>
                      <div className="font-bold text-sm uppercase tracking-wide text-earth-900">{metric.metric_name}</div>
                      {metric.metric_context && (
                        <div className="text-sm text-earth-600 mt-1">{metric.metric_context}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Mission, Vision & Values Section */}
        {(mission || vision || values.length > 0) && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Mission & Vision */}
                <div className="space-y-6">
                  {mission && (
                    <div className="border-2 border-black p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-6 h-6 text-ochre-600" />
                        <h3 className="font-bold text-lg">{mission.title}</h3>
                      </div>
                      <p className="text-earth-700">{mission.description}</p>
                    </div>
                  )}
                  {vision && (
                    <div className="border-2 border-black p-6 bg-ochre-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-6 h-6 text-ochre-600" />
                        <h3 className="font-bold text-lg">{vision.title}</h3>
                      </div>
                      <p className="text-earth-700">{vision.description}</p>
                    </div>
                  )}
                </div>

                {/* Values */}
                {values.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl mb-4">Our Values</h3>
                    <div className="space-y-4">
                      {values.map((value) => {
                        const IconComponent = getIcon(value.icon);
                        return (
                          <div key={value.id} className="flex items-start gap-3">
                            <div className="p-2 bg-eucalyptus-100 border border-black">
                              <IconComponent className="w-5 h-5 text-eucalyptus-700" />
                            </div>
                            <div>
                              <h4 className="font-bold">{value.title}</h4>
                              {value.description && (
                                <p className="text-sm text-earth-600">{value.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Key People / Storytellers Section */}
        {storytellers.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Mic className="h-8 w-8 text-ochre-600" />
                <h2 className="text-3xl font-black">Key People</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {storytellers.map((person) => (
                  <div key={person.id} className="bg-white border-2 border-black p-6">
                    <div className="flex items-start gap-4">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.display_name}
                          className="w-20 h-20 rounded-full border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-2 border-black bg-ochre-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-ochre-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-xl">{person.display_name}</h3>
                        {person.role_at_org && (
                          <p className="text-ochre-600 font-medium">{person.role_at_org}</p>
                        )}
                        {person.is_featured && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-eucalyptus-600 mt-1">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    {person.bio_excerpt && (
                      <p className="text-earth-700 mt-4">{person.bio_excerpt}</p>
                    )}
                    {person.quote && (
                      <div className="mt-4 border-l-4 border-ochre-500 pl-4 py-2 bg-ochre-50">
                        <Quote className="w-5 h-5 text-ochre-400 mb-1" />
                        <p className="italic text-earth-700">"{person.quote}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Youth Stories Section */}
        {stories.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-black text-white">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Quote className="h-8 w-8 text-ochre-400" />
                <h2 className="text-3xl font-black">Youth Voices</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div key={story.id} className="border-2 border-white/20 p-6 bg-white/5">
                    <h3 className="font-bold text-lg mb-3 text-ochre-400">{story.title}</h3>
                    {story.quote && (
                      <blockquote className="text-xl font-medium mb-4 leading-relaxed">
                        "{story.quote}"
                      </blockquote>
                    )}
                    {(story.summary || story.excerpt) && (
                      <p className="text-gray-400 text-sm">{story.summary || story.excerpt}</p>
                    )}
                    {story.tags && story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {story.tags.map((tag) => (
                          <span key={tag} className="bg-white/10 text-white/80 px-2 py-1 text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Play className="h-8 w-8 text-red-600" />
                <h2 className="text-3xl font-black">Videos</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border-2 border-black overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white/50 text-6xl">▶</div>
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </div>
                      </div>
                      {video.duration_seconds && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 text-xs">
                          {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 border border-black text-xs font-bold uppercase mb-2">
                        {video.video_type}
                      </span>
                      <h3 className="font-bold text-lg group-hover:text-red-600 transition-colors">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-earth-600 text-sm mt-1 line-clamp-2">{video.description}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Photo Gallery Section */}
        {photos.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-eucalyptus-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <ImageIcon className="h-8 w-8 text-eucalyptus-700" />
                <h2 className="text-3xl font-black">Gallery</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative group border-2 border-black overflow-hidden ${
                      photo.is_featured ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <img
                      src={photo.thumbnail_url || photo.photo_url}
                      alt={photo.title || 'Gallery image'}
                      className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
                    />
                    {(photo.title || photo.description) && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end">
                        <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {photo.title && <h4 className="font-bold">{photo.title}</h4>}
                          {photo.description && <p className="text-sm text-white/80 line-clamp-2">{photo.description}</p>}
                        </div>
                      </div>
                    )}
                    {photo.is_featured && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-ochre-500 text-white px-2 py-1 text-xs font-bold uppercase">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* External Links Section */}
        {externalLinks.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Link2 className="h-8 w-8" />
                <h2 className="text-3xl font-black">Resources & Links</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {externalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
                  >
                    <div className="p-2 bg-ochre-100 border border-black">
                      {link.link_type === 'website' && <Globe className="w-5 h-5 text-ochre-700" />}
                      {link.link_type === 'research' && <FileText className="w-5 h-5 text-blue-700" />}
                      {link.link_type === 'documentary' && <Play className="w-5 h-5 text-red-700" />}
                      {link.link_type === 'news' && <FileText className="w-5 h-5 text-earth-700" />}
                      {link.link_type === 'social' && <Users className="w-5 h-5 text-blue-500" />}
                      {link.link_type === 'podcast' && <Mic className="w-5 h-5 text-purple-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold group-hover:text-ochre-600 transition-colors truncate">
                        {link.title}
                      </h4>
                      {link.description && (
                        <p className="text-sm text-earth-600 truncate">{link.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-earth-400 group-hover:text-ochre-600" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Programs Section */}
        {programs.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-eucalyptus-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Heart className="h-8 w-8 text-eucalyptus-600" />
                <div>
                  <h2 className="text-3xl font-black">Community Programs</h2>
                  <p className="text-earth-600">
                    {programs.length} program{programs.length !== 1 ? 's' : ''} making a difference
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`/community-programs/${program.id}`}
                    className="group border-2 border-black bg-white overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {program.is_featured && (
                      <div className="bg-ochre-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Featured Program
                      </div>
                    )}

                    <div className="p-6">
                      {program.approach && (
                        <span className="inline-block px-2 py-1 bg-eucalyptus-100 border border-black text-xs font-bold uppercase mb-3">
                          {program.approach}
                        </span>
                      )}

                      <h3 className="text-xl font-bold mb-3 group-hover:text-eucalyptus-600 transition-colors">
                        {program.name}
                      </h3>

                      <p className="text-earth-600 mb-4 line-clamp-2">
                        {program.description}
                      </p>

                      {/* Metrics */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        {program.success_rate && (
                          <div className="text-sm">
                            <span className="font-bold text-eucalyptus-600">{program.success_rate}%</span>
                            <span className="text-earth-600"> success rate</span>
                          </div>
                        )}
                        {program.participants_served && (
                          <div className="text-sm">
                            <span className="font-bold text-ochre-600">{program.participants_served.toLocaleString()}</span>
                            <span className="text-earth-600"> participants</span>
                          </div>
                        )}
                      </div>

                      {program.tags && program.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {program.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="bg-sand-100 border border-black text-earth-700 px-2 py-1 text-xs">
                              {tag}
                            </span>
                          ))}
                          {program.tags.length > 3 && (
                            <span className="text-earth-500 text-xs py-1">+{program.tags.length - 3}</span>
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

        {/* Services Section */}
        {services.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Briefcase className="h-8 w-8 text-ochre-600" />
                <div>
                  <h2 className="text-3xl font-black">Services</h2>
                  <p className="text-earth-600">
                    {services.length} service{services.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.slug || service.id}`}
                    className="group border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {service.category && (
                      <span className="inline-block px-2 py-1 bg-ochre-100 border border-black text-xs font-bold uppercase mb-3">
                        {service.category}
                      </span>
                    )}

                    <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="text-earth-600 text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {service.location_city && (
                      <div className="flex items-center gap-1 text-sm text-earth-500">
                        <MapPin className="w-4 h-4" />
                        {service.location_city}{service.location_state && `, ${service.location_state}`}
                      </div>
                    )}

                    <span className="mt-4 text-ochre-600 font-bold inline-flex items-center gap-1 text-sm">
                      View Service <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State - No programs or services */}
        {programs.length === 0 && services.length === 0 && (
          <section className="py-16 border-b-2 border-black">
            <div className="container-justice text-center">
              <div className="border-2 border-dashed border-earth-300 p-12 bg-sand-50 max-w-2xl mx-auto">
                <Building2 className="w-16 h-16 text-earth-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-earth-700 mb-2">No Programs or Services Listed Yet</h3>
                <p className="text-earth-600 mb-6">
                  This organization hasn't added their programs and services to JusticeHub yet.
                </p>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-earth-800 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    Visit Their Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Other Basecamps Section - Only for Founding Basecamps */}
        {isFoundingBasecamp(org.slug) && (
          <section className="py-12 bg-ochre-50 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-6">
                <Mountain className="h-8 w-8 text-ochre-600" />
                <div>
                  <h2 className="text-3xl font-black">Other Founding Basecamps</h2>
                  <p className="text-earth-600">Explore the Centre of Excellence network</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {getOtherBasecamps(org.slug).map((basecamp) => (
                  <Link
                    key={basecamp.slug}
                    href={`/organizations/${basecamp.slug}`}
                    className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow group"
                  >
                    <div className="inline-block px-2 py-1 bg-ochre-600 text-white text-xs font-bold uppercase tracking-wider mb-3">
                      Founding Basecamp
                    </div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-ochre-600 transition-colors">
                      {basecamp.name}
                    </h3>
                    <p className="text-sm text-earth-600 mb-4">{basecamp.region}</p>
                    <span className="text-ochre-600 font-bold inline-flex items-center gap-1">
                      View Profile <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/centre-of-excellence/map?category=basecamp"
                  className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  View All Basecamps on Map
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Related Resources */}
        <section className="py-12 bg-sand-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4">Explore More</h2>
            <p className="text-lg text-gray-700 mb-8">
              Discover related resources and information across JusticeHub.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/organizations"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-ochre-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Directory
                </div>
                <h3 className="text-xl font-bold mb-2">All Organizations</h3>
                <p className="text-gray-600 mb-4">
                  Browse all youth justice organizations in our verified directory.
                </p>
                <span className="text-ochre-600 font-bold inline-flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/community-programs"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-eucalyptus-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Programs
                </div>
                <h3 className="text-xl font-bold mb-2">Community Programs</h3>
                <p className="text-gray-600 mb-4">
                  Find community-led programs making a difference across Australia.
                </p>
                <span className="text-eucalyptus-600 font-bold inline-flex items-center gap-1">
                  Browse <ChevronRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/services"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Service Finder
                </div>
                <h3 className="text-xl font-bold mb-2">Support Services</h3>
                <p className="text-gray-600 mb-4">
                  Locate legal, health, and support services in your area.
                </p>
                <span className="text-blue-600 font-bold inline-flex items-center gap-1">
                  Find Services <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
