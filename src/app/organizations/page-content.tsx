'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Briefcase,
  Heart,
  Users,
  MapPin,
  Link2,
  Building2,
  AlertTriangle,
  X,
} from 'lucide-react';

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

interface OrganizationsPageContentProps {
  organizations: Organization[];
  programCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  teamCounts: Record<string, number>;
  detentionFacilities: DetentionFacility[];
}

export function OrganizationsPageContent({
  organizations,
  programCounts,
  serviceCounts,
  teamCounts,
  detentionFacilities,
}: OrganizationsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

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

  const hasActiveFilters =
    searchQuery || stateFilter !== 'all' || typeFilter !== 'all' || verificationFilter !== 'all';

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
        if (verificationFilter === 'unverified' && org.verification_status === 'verified') return false;
        return true;
      })
      .sort((a, b) => {
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
  }, [organizations, searchQuery, stateFilter, typeFilter, verificationFilter, sortBy, programCounts, serviceCounts]);

  const clearFilters = () => {
    setSearchQuery('');
    setStateFilter('all');
    setTypeFilter('all');
    setVerificationFilter('all');
    setSortBy('name-asc');
  };

  // Detention facilities (not filtered)
  const operationalFacilities = detentionFacilities.filter(
    (f) => f.operational_status === 'operational'
  );
  const closedFacilities = detentionFacilities.filter(
    (f) => f.operational_status === 'closed'
  );

  return (
    <>
      {/* Filter Bar */}
      <section className="py-6 border-b-2 border-black bg-white sticky top-0 z-30">
        <div className="container-justice">
          {/* Search + Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
              <input
                type="text"
                placeholder="Search organizations..."
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

          {/* Result Count */}
          <div className="mt-3 text-sm text-earth-600 font-medium">
            Showing{' '}
            <span className="font-bold text-earth-900">{filtered.length}</span>{' '}
            of {organizations.length} organizations
          </div>
        </div>
      </section>

      {/* Filtered Organizations Grid */}
      <section className="py-12">
        <div className="container-justice">
          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((org) => {
                const isVerified = org.verification_status === 'verified';
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
            <div className="text-center py-16">
              <p className="text-xl text-earth-600 mb-4">
                No organizations match your filters.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border-2 border-black bg-ochre-100 text-ochre-800 font-bold hover:bg-ochre-200 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Youth Detention Facilities Section */}
      {detentionFacilities.length > 0 && (
        <section className="py-12 border-t-2 border-black bg-gradient-to-br from-red-50 via-orange-50 to-sand-50">
          <div className="container-justice">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-earth-900 mb-2 flex items-center gap-3">
                <Building2 className="w-10 h-10 text-red-600" />
                Youth Detention Facilities
              </h2>
              <p className="text-lg text-earth-600">
                {operationalFacilities.length} operational detention centres
                across Australia
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
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-lg text-earth-900">
                      {facility.name}
                    </h3>
                    <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 border border-green-600 text-green-800 text-xs font-bold uppercase tracking-wide">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-earth-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    {facility.city}, {facility.state}
                  </div>
                  <div className="space-y-2 mb-4">
                    {facility.capacity_beds && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-earth-600">Capacity:</span>
                        <span className="font-bold">
                          {facility.capacity_beds} beds
                        </span>
                      </div>
                    )}
                    {facility.security_level && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-earth-600">Security:</span>
                        <span className="font-bold capitalize">
                          {facility.security_level}
                        </span>
                      </div>
                    )}
                    {facility.government_department && (
                      <div className="text-xs text-earth-500 mt-2">
                        {facility.government_department}
                      </div>
                    )}
                  </div>
                  {facility.partnership_count !== undefined &&
                    facility.partnership_count > 0 && (
                      <div className="pt-3 border-t border-earth-200">
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-700">
                          <Link2 className="w-3 h-3" />
                          {facility.partnership_count} partnership
                          {facility.partnership_count !== 1 ? 's' : ''}
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
    </>
  );
}
