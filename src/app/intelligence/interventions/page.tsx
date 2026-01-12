import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { InterventionCard } from '@/components/alma';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type Intervention = Database['public']['Tables']['alma_interventions']['Row'];

interface InterventionsPageProps {
  searchParams: {
    state?: string;
    type?: string;
    consent?: string;
    search?: string;
    sort?: string;
    page?: string;
  };
}

async function getInterventions(filters: InterventionsPageProps['searchParams']) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const page = parseInt(filters.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('alma_interventions')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.state) {
    query = query.eq('metadata->>state', filters.state);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.consent) {
    query = query.eq('consent_level', filters.consent);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply sorting
  switch (filters.sort) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('name', { ascending: true });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching interventions:', error);
    return { interventions: [], total: 0 };
  }

  return { interventions: data || [], total: count || 0 };
}

async function getFilterOptions() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('metadata, type, consent_level');

  const states = new Set<string>();
  const types = new Set<string>();
  const consentLevels = new Set<string>();

  interventions?.forEach((intervention) => {
    const metadata = intervention.metadata as any;
    if (metadata?.state) states.add(metadata.state);
    if (intervention.type) types.add(intervention.type);
    if (intervention.consent_level) consentLevels.add(intervention.consent_level);
  });

  return {
    states: Array.from(states).sort(),
    types: Array.from(types).sort(),
    consentLevels: Array.from(consentLevels).sort(),
  };
}

export default async function InterventionsPage({ searchParams }: InterventionsPageProps) {
  const [{ interventions, total }, filterOptions] = await Promise.all([
    getInterventions(searchParams),
    getFilterOptions(),
  ]);

  const currentPage = parseInt(searchParams.page || '1');
  const totalPages = Math.ceil(total / 20);
  const hasFilters = searchParams.state || searchParams.type || searchParams.consent || searchParams.search;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="section-padding border-b-2 border-black">
        <div className="container-justice">
          <h1 className="text-4xl font-bold text-black mb-4">
            Youth Justice Interventions
          </h1>
          <p className="text-lg text-gray-700">
            <strong>{total} programs</strong> documented across Australia. Filter by state, type, or consent level.
          </p>
        </div>
      </section>

      <div className="section-padding">
        <div className="container-justice">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <div className="border-2 border-black p-6 sticky top-24">
                <h2 className="text-xl font-bold text-black mb-6">
                  Filter Programs
                </h2>

                <form method="get" className="space-y-6">
                  {/* Search */}
                  <div>
                    <label htmlFor="search" className="block text-sm font-bold text-black mb-2 uppercase tracking-wider">
                      Search
                    </label>
                    <input
                      type="text"
                      id="search"
                      name="search"
                      defaultValue={searchParams.search}
                      placeholder="Search programs..."
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* State Filter */}
                  <div>
                    <label htmlFor="state" className="block text-sm font-bold text-black mb-2 uppercase tracking-wider">
                      State
                    </label>
                    <select
                      id="state"
                      name="state"
                      defaultValue={searchParams.state || ''}
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="">All States</option>
                      {filterOptions.states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-bold text-black mb-2 uppercase tracking-wider">
                      Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      defaultValue={searchParams.type || ''}
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="">All Types</option>
                      {filterOptions.types.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Consent Level Filter */}
                  <div>
                    <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wider">
                      Consent Level
                    </label>
                    <div className="space-y-2">
                      {filterOptions.consentLevels.map((level) => (
                        <label key={level} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="consent"
                            value={level}
                            defaultChecked={searchParams.consent === level}
                            className="h-4 w-4 border-2 border-black text-black focus:ring-black"
                          />
                          <span className="ml-2 text-sm text-gray-800">{level}</span>
                        </label>
                      ))}
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="consent"
                          value=""
                          defaultChecked={!searchParams.consent}
                          className="h-4 w-4 border-2 border-black text-black focus:ring-black"
                        />
                        <span className="ml-2 text-sm text-gray-800">All Levels</span>
                      </label>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label htmlFor="sort" className="block text-sm font-bold text-black mb-2 uppercase tracking-wider">
                      Sort By
                    </label>
                    <select
                      id="sort"
                      name="sort"
                      defaultValue={searchParams.sort || 'name'}
                      className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="recent">Recently Added</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 px-4 font-bold uppercase tracking-wider hover:bg-gray-800 transition"
                  >
                    Apply Filters
                  </button>

                  {/* Clear Filters */}
                  {hasFilters && (
                    <Link
                      href="/intelligence/interventions"
                      className="block w-full text-center border-2 border-black py-3 px-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition text-sm"
                    >
                      Clear Filters
                    </Link>
                  )}
                </form>
              </div>
            </aside>

            {/* Results */}
            <main className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
                <p className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  {interventions.length === 0 ? '0' : `${((currentPage - 1) * 20) + 1}–${Math.min(currentPage * 20, total)}`} of {total}
                </p>
              </div>

              {/* Interventions Grid */}
              {interventions.length === 0 ? (
                <div className="border-2 border-black p-12 text-center">
                  <p className="text-xl font-bold text-black mb-4">
                    No programs found
                  </p>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search terms.
                  </p>
                  {hasFilters && (
                    <Link
                      href="/intelligence/interventions"
                      className="inline-block bg-black text-white px-6 py-3 font-bold uppercase tracking-wider hover:bg-gray-800"
                    >
                      Clear All Filters
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {interventions.map((intervention) => (
                    <InterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      showEvidenceBadge
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 pt-8 border-t-2 border-black">
                  <div className="flex items-center justify-center gap-2">
                    {/* Previous Button */}
                    {currentPage > 1 && (
                      <Link
                        href={`/intelligence/interventions?${new URLSearchParams({
                          ...searchParams,
                          page: (currentPage - 1).toString(),
                        })}`}
                        className="px-4 py-2 border-2 border-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition"
                      >
                        ← Prev
                      </Link>
                    )}

                    {/* Page Numbers */}
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Link
                            key={pageNum}
                            href={`/intelligence/interventions?${new URLSearchParams({
                              ...searchParams,
                              page: pageNum.toString(),
                            })}`}
                            className={`px-4 py-2 border-2 font-bold ${pageNum === currentPage
                                ? 'bg-black text-white border-black'
                                : 'border-black hover:bg-gray-100'
                              }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    {currentPage < totalPages && (
                      <Link
                        href={`/intelligence/interventions?${new URLSearchParams({
                          ...searchParams,
                          page: (currentPage + 1).toString(),
                        })}`}
                        className="px-4 py-2 border-2 border-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition"
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
