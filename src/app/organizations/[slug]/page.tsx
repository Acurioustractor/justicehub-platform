import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

async function getOrganization(slug: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

async function getOrganizationPrograms(orgId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .from('community_programs')
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

  const programs = await getOrganizationPrograms(org.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-50 to-white page-content">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-sand-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-earth-600">
            <Link href="/" className="hover:text-ochre-600">
              Home
            </Link>
            <span>/</span>
            <Link href="/organizations" className="hover:text-ochre-600">
              Organizations
            </Link>
            <span>/</span>
            <span className="text-earth-900">{org.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            {/* Verification Badge */}
            {org.verification_status === 'verified' && (
              <div className="inline-flex items-center gap-2 bg-eucalyptus-100 text-eucalyptus-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Organization
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-earth-900 mb-4">
              {org.name}
            </h1>

            {/* Location & Type */}
            <div className="flex flex-wrap gap-4 mb-6">
              {org.city && org.state && (
                <div className="flex items-center gap-2 text-earth-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {org.city}, {org.state}
                </div>
              )}
              {org.type && (
                <div className="flex items-center gap-2 text-earth-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {org.type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              )}
            </div>

            {/* Description */}
            {org.description && (
              <p className="text-lg text-earth-700 mb-6 leading-relaxed">
                {org.description}
              </p>
            )}

            {/* Contact & Links */}
            <div className="flex flex-wrap gap-4">
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-ochre-600 hover:bg-ochre-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  Visit Website
                </a>
              )}
            </div>

            {/* Tags */}
            {org.tags && org.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {org.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/60 text-earth-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-earth-900 mb-2">Programs</h2>
          <p className="text-earth-600">
            {programs.length} program{programs.length !== 1 ? 's' : ''} offered by this organization
          </p>
        </div>

        {programs.length === 0 ? (
          <div className="bg-sand-50 rounded-lg p-8 text-center">
            <p className="text-earth-600">No programs listed yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((program) => (
              <Link
                key={program.id}
                href={`/community-programs/${program.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-sand-200 overflow-hidden group"
              >
                {/* Featured Badge */}
                {program.is_featured && (
                  <div className="bg-ochre-600 text-white px-4 py-2 text-sm font-medium">
                    ⭐ Featured Program
                  </div>
                )}

                <div className="p-6">
                  {/* Approach Badge */}
                  <div className="inline-flex items-center gap-2 bg-eucalyptus-50 text-eucalyptus-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {program.approach}
                  </div>

                  <h3 className="text-xl font-semibold text-earth-900 mb-3 group-hover:text-ochre-600 transition-colors">
                    {program.name}
                  </h3>

                  <p className="text-earth-600 mb-4 line-clamp-3">
                    {program.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    {program.success_rate && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-eucalyptus-600 rounded-full"></div>
                        <span className="text-earth-700">
                          <strong className="text-earth-900">{program.success_rate}%</strong> success rate
                        </span>
                      </div>
                    )}
                    {program.participants_served && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-ochre-600 rounded-full"></div>
                        <span className="text-earth-700">
                          <strong className="text-earth-900">{program.participants_served}</strong> participants
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {program.tags && program.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {program.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-sand-100 text-earth-700 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {program.tags.length > 3 && (
                        <span className="text-earth-500 text-xs py-1">
                          +{program.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
