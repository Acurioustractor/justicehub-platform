'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  verification_status: string;
  city: string;
  state: string;
  tags: string[];
}

export default function OrganizationsPage() {
  const supabase = createClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [programCounts, setProgramCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!orgsError && orgs) {
        setOrganizations(orgs);
      }

      // Fetch program counts
      const { data: programs } = await supabase
        .from('community_programs')
        .select('organization_id');

      if (programs) {
        const counts: Record<string, number> = {};
        programs.forEach((program) => {
          if (program.organization_id) {
            counts[program.organization_id] = (counts[program.organization_id] || 0) + 1;
          }
        });
        setProgramCounts(counts);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const verifiedOrgs = organizations.filter(
    (org) => org.verification_status === 'verified'
  );
  const otherOrgs = organizations.filter(
    (org) => org.verification_status !== 'verified'
  );

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-sand-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ochre-600 mx-auto mb-4"></div>
            <p className="text-earth-600">Loading organizations...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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
                  Total Organizations
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
            </div>
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
                {verifiedOrgs.map((org) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug}`}
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

                      {/* Program Count */}
                      {programCounts[org.id] && (
                        <div className="pt-4 mt-4 border-t-2 border-black">
                          <div className="flex items-center gap-2 text-sm font-bold text-ochre-700 uppercase tracking-wide">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            {programCounts[org.id]} program{programCounts[org.id] !== 1 ? 's' : ''}
                          </div>
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
                </p>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherOrgs.map((org) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug}`}
                    className="block bg-white border-2 border-black p-4 hover:bg-sand-50 transition-colors"
                  >
                    <h3 className="font-bold text-earth-900 mb-1">{org.name}</h3>
                    {org.city && org.state && (
                      <p className="text-sm text-earth-600">
                        {org.city}, {org.state}
                      </p>
                    )}
                  </Link>
                ))}
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
