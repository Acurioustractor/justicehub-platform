'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Briefcase, GraduationCap, Award, Search, Filter, Calendar, MapPin, DollarSign, ExternalLink } from 'lucide-react';

interface Opportunity {
  id: string;
  name: string;
  description: string | null;
  funder_name: string;
  source_type: 'government' | 'philanthropy' | 'corporate' | 'community';
  category: string | null;
  min_grant_amount: number | null;
  max_grant_amount: number | null;
  deadline: string | null;
  status: string;
  jurisdictions: string[] | null;
  regions: string[] | null;
  is_national: boolean;
  focus_areas: string[] | null;
  source_url: string | null;
  application_url: string | null;
  guidelines_url: string | null;
  created_at: string;
}

const opportunityTypes = [
  { value: 'all', label: 'All Opportunities', icon: Award },
  { value: 'employment', label: 'Jobs & Apprenticeships', icon: Briefcase },
  { value: 'education', label: 'Scholarships & Education', icon: GraduationCap },
  { value: 'youth_justice', label: 'Youth Justice Programs', icon: Award },
  { value: 'indigenous_programs', label: 'Indigenous Programs', icon: Award },
];

const sourceTypes = [
  { value: 'all', label: 'All Sources' },
  { value: 'government', label: 'Government' },
  { value: 'philanthropy', label: 'Philanthropy' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'community', label: 'Community' },
];

const states = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT', 'National'];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    async function fetchOpportunities() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('alma_funding_opportunities')
        .select('*')
        .in('status', ['open', 'closing_soon', 'upcoming'])
        .order('deadline', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching opportunities:', error);
        setLoading(false);
        return;
      }

      setOpportunities(data || []);
      setFilteredOpportunities(data || []);
      setLoading(false);
    }

    fetchOpportunities();
  }, []);

  useEffect(() => {
    let filtered = [...opportunities];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.name.toLowerCase().includes(query) ||
        opp.description?.toLowerCase().includes(query) ||
        opp.funder_name.toLowerCase().includes(query) ||
        opp.focus_areas?.some(area => area.toLowerCase().includes(query))
      );
    }

    // Filter by type/category
    if (selectedType !== 'all') {
      filtered = filtered.filter(opp => opp.category === selectedType);
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(opp => opp.source_type === selectedSource);
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(opp =>
        opp.is_national ||
        opp.jurisdictions?.includes(selectedLocation) ||
        selectedLocation === 'National' && opp.is_national
      );
    }

    setFilteredOpportunities(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedSource, selectedLocation, opportunities]);

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'Rolling deadline';
    const date = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (daysUntil < 0) return formatted;
    if (daysUntil === 0) return 'Closes today';
    if (daysUntil === 1) return 'Closes tomorrow';
    if (daysUntil <= 7) return `${formatted} (${daysUntil} days)`;
    return formatted;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: 'bg-green-100 text-green-800 border-green-300',
      closing_soon: 'bg-orange-100 text-orange-800 border-orange-300',
      upcoming: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedSource('all');
    setSelectedLocation('all');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="page-content">
        {/* Hero Section */}
        <section className="border-b-2 border-black bg-gradient-to-br from-yellow-100 via-white to-green-100">
          <div className="container-justice py-16">
            <p className="font-mono uppercase tracking-[0.4em] text-xs text-gray-600 mb-4 text-center md:text-left">
              Pathways • Education • Employment
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="headline-truth mb-6">
                  OPPORTUNITIES
                  <span className="block text-3xl md:text-4xl text-black mt-2">
                    Jobs, scholarships, and apprenticeships for young people.
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
                  Find real pathways to education, employment, and opportunity. Curated opportunities
                  from government, community organizations, and partners committed to supporting young people.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-2 border-black bg-white p-4">
                    <div className="text-3xl font-bold text-black">{loading ? '...' : opportunities.length}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Open opportunities</div>
                    <p className="text-xs text-gray-600 mt-2">Current jobs, scholarships, and programs actively recruiting.</p>
                  </div>
                  <div className="border-2 border-black bg-white p-4">
                    <div className="text-3xl font-bold text-black">
                      {loading ? '...' : opportunities.filter(o => o.is_national).length}
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-wide">National reach</div>
                    <p className="text-xs text-gray-600 mt-2">Opportunities available across all states and territories.</p>
                  </div>
                  <div className="border-2 border-black bg-white p-4">
                    <div className="text-3xl font-bold text-black">
                      {loading ? '...' : opportunities.filter(o =>
                        o.focus_areas?.some(a => a.toLowerCase().includes('indigenous') || a.toLowerCase().includes('first_nations'))
                      ).length}
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Indigenous-focused</div>
                    <p className="text-xs text-gray-600 mt-2">Programs specifically for First Nations young people.</p>
                  </div>
                </div>
              </div>
              <div className="border-2 border-black bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Award className="h-10 w-10 text-yellow-700" />
                  <div>
                    <div className="font-bold uppercase tracking-wide text-sm text-black">Real pathways forward</div>
                    <p className="text-sm text-gray-600">
                      Every opportunity listed here is actively accepting applications. We verify deadlines,
                      check eligibility, and connect you to the right people.
                    </p>
                  </div>
                </div>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>• Direct links to applications and guidelines</li>
                  <li>• Clear eligibility criteria and deadlines</li>
                  <li>• Support connecting with programs and services</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="border-b-2 border-black bg-white py-8">
          <div className="container-justice space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities by name, organization, or keyword..."
                className="w-full pl-12 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters:
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-bold text-sm cursor-pointer hover:bg-gray-50"
                  >
                    {opportunityTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Filter */}
                <div className="relative">
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-bold text-sm cursor-pointer hover:bg-gray-50"
                  >
                    {sourceTypes.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-bold text-sm cursor-pointer hover:bg-gray-50"
                  >
                    <option value="all">All Locations</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {(selectedType !== 'all' || selectedSource !== 'all' || selectedLocation !== 'all' || searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-700 hover:text-blue-500 font-bold uppercase tracking-wide"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                {filteredOpportunities.length} of {opportunities.length} showing
              </div>
            </div>
          </div>
        </section>

        {/* Opportunities Grid */}
        <section className="py-12 bg-gray-50">
          <div className="container-justice">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading opportunities...</p>
              </div>
            ) : paginatedOpportunities.length === 0 ? (
              <div className="border-2 border-black bg-white p-12 text-center">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-black mb-2">No opportunities match your filters</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to see more results.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 border-2 border-black bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {paginatedOpportunities.map((opportunity) => (
                    <article
                      key={opportunity.id}
                      className="border-2 border-black bg-white p-6 flex flex-col gap-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    >
                      {/* Header */}
                      <div>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border ${getStatusBadge(opportunity.status)}`}>
                            {opportunity.status.replace('_', ' ')}
                          </span>
                          {opportunity.is_national && (
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-blue-500 text-white">
                              National
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-black leading-tight mb-2">
                          {opportunity.name}
                        </h3>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {opportunity.funder_name}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-gray-600">
                          {opportunity.source_type}
                        </p>
                      </div>

                      {/* Description */}
                      {opportunity.description && (
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {opportunity.description}
                        </p>
                      )}

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        {opportunity.deadline && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="font-semibold">Deadline:</span>
                            <span>{formatDeadline(opportunity.deadline)}</span>
                          </div>
                        )}
                        {(opportunity.max_grant_amount || opportunity.min_grant_amount) && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <DollarSign className="h-4 w-4 flex-shrink-0" />
                            <span className="font-semibold">Amount:</span>
                            <span>
                              {opportunity.min_grant_amount && opportunity.max_grant_amount
                                ? `$${(opportunity.min_grant_amount).toLocaleString()} - $${(opportunity.max_grant_amount).toLocaleString()}`
                                : opportunity.max_grant_amount
                                ? `Up to $${(opportunity.max_grant_amount).toLocaleString()}`
                                : `From $${(opportunity.min_grant_amount || 0).toLocaleString()}`}
                            </span>
                          </div>
                        )}
                        {opportunity.jurisdictions && opportunity.jurisdictions.length > 0 && (
                          <div className="flex items-start gap-2 text-gray-700">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Location:</span>{' '}
                              <span>{opportunity.jurisdictions.join(', ')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Focus Areas */}
                      {opportunity.focus_areas && opportunity.focus_areas.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {opportunity.focus_areas.slice(0, 4).map((area) => (
                            <span
                              key={area}
                              className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 uppercase tracking-wide"
                            >
                              {area.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-200">
                        {opportunity.application_url && (
                          <a
                            href={opportunity.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase tracking-wide text-xs hover:bg-gray-800 transition-colors"
                          >
                            Apply Now
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {opportunity.guidelines_url && (
                          <a
                            href={opportunity.guidelines_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase tracking-wide text-xs hover:bg-gray-50 transition-colors"
                          >
                            Guidelines
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {opportunity.source_url && !opportunity.application_url && !opportunity.guidelines_url && (
                          <a
                            href={opportunity.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase tracking-wide text-xs hover:bg-gray-50 transition-colors"
                          >
                            Learn More
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-6 py-3 border-2 border-black bg-white font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-6 py-3 border-2 border-black bg-white font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Get Help Section */}
        <section className="border-t-2 border-black bg-white py-16">
          <div className="container-justice grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border-2 border-black bg-gradient-to-br from-blue-50 to-white p-8">
              <h3 className="text-2xl font-bold text-black mb-4">Need help with an application?</h3>
              <p className="text-gray-700 mb-6">
                Don't navigate this alone. Connect with JusticeHub support workers and community services
                who can help you with applications, eligibility, and getting the support you need.
              </p>
              <Link
                href="/community-map"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-black text-white font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Find Support Near You
              </Link>
            </div>
            <div className="border-2 border-black bg-gradient-to-br from-yellow-50 to-white p-8">
              <h3 className="text-2xl font-bold text-black mb-4">Know of an opportunity we're missing?</h3>
              <p className="text-gray-700 mb-6">
                Help us keep this list current and comprehensive. If you know of jobs, scholarships, or programs
                for young people that should be listed here, let us know.
              </p>
              <a
                href="mailto:opportunities@justicehub.au"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-white text-black font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors"
              >
                Submit an Opportunity
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
