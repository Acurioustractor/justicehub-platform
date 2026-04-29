'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Briefcase,
  Heart,
  Users,
  MapPin,
  Link2,
  ArrowUpRight,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
  X,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  description: string | null;
  verification_status: string | null;
  city: string | null;
  state: string | null;
  tags: string[] | null;
}

interface OrganizationsPageContentProps {
  organizations: Organization[];
  programCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  claimedOrgIds: string[];
  dataStatus?: 'live' | 'partial';
}

type DirectoryView = 'cards' | 'list';
type QuickFilter = 'all' | 'linked' | 'claimed' | 'with-services' | 'needs-profile';

export function OrganizationsPageContent({
  organizations,
  programCounts,
  serviceCounts,
  teamCounts,
  claimedOrgIds,
  dataStatus = 'live',
}: OrganizationsPageContentProps) {
  const claimedSet = useMemo(() => new Set(claimedOrgIds), [claimedOrgIds]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState<DirectoryView>('cards');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // Derive unique states and types from data
  const states = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((org) => {
      if (org.state) set.add(org.state);
    });
    return Array.from(set).sort();
  }, [organizations]);

  const types = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((org) => {
      if (org.type) set.add(org.type);
    });
    return Array.from(set).sort();
  }, [organizations]);

  const [visibleCount, setVisibleCount] = useState(30);

  const hasActiveFilters =
    searchQuery ||
    stateFilter !== 'all' ||
    typeFilter !== 'all' ||
    verificationFilter !== 'all' ||
    quickFilter !== 'all';

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return organizations
      .filter((org) => {
        // Search
        if (query) {
          const haystack = [
            org.name,
            org.description,
            org.city,
            org.state,
            org.type,
            org.abn,
            org.gs_entity_id,
            ...(org.tags || []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        // State
        if (stateFilter !== 'all' && org.state !== stateFilter) return false;
        // Type
        if (typeFilter !== 'all' && org.type !== typeFilter) return false;
        // Verification
        if (verificationFilter === 'verified' && org.verification_status !== 'verified') return false;
        if (verificationFilter === 'claimed' && !claimedSet.has(org.id)) return false;
        if (verificationFilter === 'unverified' && org.verification_status === 'verified') return false;
        // Quick filters
        if (quickFilter === 'linked' && !(org.gs_entity_id || org.abn)) return false;
        if (quickFilter === 'claimed' && !claimedSet.has(org.id)) return false;
        if (quickFilter === 'with-services' && !((programCounts[org.id] || 0) + (serviceCounts[org.id] || 0))) return false;
        if (quickFilter === 'needs-profile' && (claimedSet.has(org.id) || org.verification_status === 'verified')) return false;
        return true;
      })
      .sort((a, b) => {
        // Always sort claimed orgs first in default sort
        if (sortBy === 'name-asc' || sortBy === 'name-desc') {
          const aClaimed = claimedSet.has(a.id) ? 1 : 0;
          const bClaimed = claimedSet.has(b.id) ? 1 : 0;
          if (aClaimed !== bClaimed) return bClaimed - aClaimed;
        }

        switch (sortBy) {
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'most-programs': {
            const ap = (programCounts[a.id] || 0) + (serviceCounts[a.id] || 0);
            const bp = (programCounts[b.id] || 0) + (serviceCounts[b.id] || 0);
            return bp - ap || a.name.localeCompare(b.name);
          }
          case 'most-services': {
            const as2 = serviceCounts[a.id] || 0;
            const bs = serviceCounts[b.id] || 0;
            return bs - as2 || a.name.localeCompare(b.name);
          }
          default: // name-asc
            return a.name.localeCompare(b.name);
        }
      });
  }, [organizations, searchQuery, stateFilter, typeFilter, verificationFilter, quickFilter, sortBy, programCounts, serviceCounts, claimedSet]);

  // Reset pagination when filters change
  useEffect(() => { setVisibleCount(30); }, [searchQuery, stateFilter, typeFilter, verificationFilter, quickFilter, sortBy, viewMode]);

  const visibleOrgs = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const clearFilters = () => {
    setSearchQuery('');
    setStateFilter('all');
    setTypeFilter('all');
    setVerificationFilter('all');
    setQuickFilter('all');
    setSortBy('name-asc');
  };

  return (
    <>
      {/* Filter Bar */}
      <section className="py-6 border-b-2 border-black bg-white sticky top-0 z-30">
        <div className="container-justice">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-earth-900">Organization Directory</h2>
              <p className="text-sm text-earth-600">
                Search the loaded profile set, then open a record to build out programs, services, stories, funding, and claim status.
              </p>
            </div>
            <div className="flex border-2 border-black bg-white">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-bold ${viewMode === 'cards' ? 'bg-black text-white' : 'bg-white text-black hover:bg-sand-50'}`}
                aria-pressed={viewMode === 'cards'}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 border-l-2 border-black px-3 py-2 text-sm font-bold ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black hover:bg-sand-50'}`}
                aria-pressed={viewMode === 'list'}
              >
                <ListIcon className="h-4 w-4" />
                List
              </button>
            </div>
          </div>

          {/* Search + Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
              <input
                type="text"
                placeholder="Search name, place, ABN, GrantScope, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400"
              />
            </div>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="all">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t.replace('-', ' ')}
                </option>
              ))}
            </select>

            {/* Verification Filter */}
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="claimed">Active (Claimed)</option>
              <option value="unverified">Unverified</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ochre-400"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="most-programs">Most Programs</option>
              <option value="most-services">Most Services</option>
            </select>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 border-2 border-black bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All records' },
              { key: 'linked', label: 'ABN / GrantScope linked' },
              { key: 'claimed', label: 'Claimed' },
              { key: 'with-services', label: 'Programs or services' },
              { key: 'needs-profile', label: 'Needs profile work' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setQuickFilter(item.key as QuickFilter)}
                className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  quickFilter === item.key
                    ? 'border-black bg-black text-white'
                    : 'border-earth-300 bg-white text-earth-700 hover:border-black'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Result Count */}
          <div className="mt-3 text-sm text-earth-600 font-medium">
            Showing{' '}
            <span className="font-bold text-earth-900">{Math.min(visibleCount, filtered.length)}</span>{' '}
            of {filtered.length} organizations
            {filtered.length < organizations.length && (
              <span className="text-earth-400"> (filtered from {organizations.length})</span>
            )}
          </div>
        </div>
      </section>

      {/* Filtered Organizations Grid */}
      <section className="py-12">
        <div className="container-justice">
          {filtered.length > 0 ? (
            <>
            {viewMode === 'cards' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleOrgs.map((org) => {
                const isVerified = org.verification_status === 'verified';
                const hasGrantScope = Boolean(org.gs_entity_id || org.abn);
                const hasLinks =
                  programCounts[org.id] || serviceCounts[org.id] || teamCounts[org.id];
                return (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug || org.id}`}
                    className={`block bg-white border-2 border-black p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group ${isVerified ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''} ${hasLinks && !isVerified ? 'ring-2 ring-ochre-200' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-lg text-earth-900 group-hover:text-ochre-600 transition-colors">
                        {org.name}
                      </h3>
                      <div className="flex flex-shrink-0 gap-1">
                        {claimedSet.has(org.id) && (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 border border-purple-600 text-xs font-bold uppercase tracking-wider">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Claimed
                          </span>
                        )}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 bg-eucalyptus-100 text-eucalyptus-800 px-2 py-0.5 border border-black text-xs font-bold uppercase tracking-wider">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        )}
                        {hasGrantScope && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 border border-blue-600 text-xs font-bold uppercase tracking-wider">
                            <Link2 className="w-3 h-3" />
                            Civic graph
                          </span>
                        )}
                        {org.type && (
                          <span className="px-2 py-0.5 bg-sand-100 border border-black text-xs font-bold uppercase tracking-wide">
                            {org.type.replace('-', ' ')}
                          </span>
                        )}
                      </div>
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
                            {programCounts[org.id]} program
                            {programCounts[org.id] !== 1 ? 's' : ''}
                          </div>
                        )}
                        {serviceCounts[org.id] && (
                          <div className="flex items-center gap-1 text-xs font-bold text-ochre-700">
                            <Briefcase className="w-3 h-3" />
                            {serviceCounts[org.id]} service
                            {serviceCounts[org.id] !== 1 ? 's' : ''}
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
                        {org.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-sand-50 border border-earth-200 text-earth-600 px-2 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {org.tags.length > 3 && (
                          <span className="text-earth-400 text-xs py-0.5">
                            +{org.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            ) : (
              <div className="overflow-hidden border-2 border-black bg-white">
                {visibleOrgs.map((org) => {
                  const isVerified = org.verification_status === 'verified';
                  const isClaimed = claimedSet.has(org.id);
                  const hasGrantScope = Boolean(org.gs_entity_id || org.abn);
                  const linkedCount =
                    (programCounts[org.id] || 0) +
                    (serviceCounts[org.id] || 0) +
                    (teamCounts[org.id] || 0);

                  return (
                    <Link
                      key={org.id}
                      href={`/organizations/${org.slug || org.id}`}
                      className="grid gap-3 border-b border-earth-200 p-4 transition-colors last:border-b-0 hover:bg-sand-50 md:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.4fr)_minmax(220px,0.7fr)_auto]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-earth-900">{org.name}</h3>
                          {isClaimed && <CheckCircle2 className="h-4 w-4 text-purple-700" />}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-earth-500">
                          {org.type && <span className="font-bold uppercase tracking-wide">{org.type.replace('-', ' ')}</span>}
                          {org.abn && <span>ABN {org.abn}</span>}
                          {org.gs_entity_id && <span>GrantScope linked</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-earth-600">
                        <MapPin className="h-4 w-4" />
                        {[org.city, org.state].filter(Boolean).join(', ') || 'Location open'}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        {isVerified && <span className="border border-eucalyptus-700 bg-eucalyptus-50 px-2 py-1 text-eucalyptus-800">Verified</span>}
                        {isClaimed && <span className="border border-purple-700 bg-purple-50 px-2 py-1 text-purple-800">Claimed</span>}
                        {hasGrantScope && <span className="border border-blue-700 bg-blue-50 px-2 py-1 text-blue-800">Civic graph</span>}
                        <span className="border border-earth-300 bg-white px-2 py-1 text-earth-700">{linkedCount} linked items</span>
                      </div>

                      <div className="flex items-center justify-end gap-1 text-sm font-bold text-blue-700">
                        Open
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 60)}
                  className="px-6 py-3 border-2 border-black bg-ochre-50 text-earth-900 font-bold hover:bg-ochre-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-16">
              {dataStatus === 'partial' && organizations.length === 0 ? (
                <>
                  <p className="text-xl font-bold text-earth-900 mb-2">
                    Organization records are temporarily unavailable.
                  </p>
                  <p className="mx-auto max-w-2xl text-earth-600">
                    The centre map and cards remain available. Organization search will repopulate when the CivicGraph/Supabase source responds again.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl text-earth-600 mb-4">
                    No organizations match your filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border-2 border-black bg-ochre-100 text-ochre-800 font-bold hover:bg-ochre-200 transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

    </>
  );
}
