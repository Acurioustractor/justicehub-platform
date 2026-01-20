'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, X, Sparkles, MapPin, Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  organizations_profiles: Array<{
    id: string;
    role: string | null;
    is_current: boolean | null;
    public_profiles: {
      id: string;
      full_name: string;
      photo_url: string | null;
      slug: string;
    } | null;
  }>;
}

interface OrganizationListProps {
  organizations: Organization[];
}

export default function OrganizationList({ organizations }: OrganizationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Extract unique types and locations for filter dropdowns
  const { types, locations } = useMemo(() => {
    const typeSet = new Set<string>();
    const locationSet = new Set<string>();

    organizations.forEach((org) => {
      if (org.type) typeSet.add(org.type);
      if (org.location) locationSet.add(org.location);
    });

    return {
      types: Array.from(typeSet).sort(),
      locations: Array.from(locationSet).sort(),
    };
  }, [organizations]);

  // Filter organizations based on search and filters
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      // Search filter (name and description)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        org.name.toLowerCase().includes(searchLower) ||
        (org.description && org.description.toLowerCase().includes(searchLower)) ||
        (org.location && org.location.toLowerCase().includes(searchLower));

      // Type filter
      const matchesType = typeFilter === 'all' || org.type === typeFilter;

      // Location filter
      const matchesLocation = locationFilter === 'all' || org.location === locationFilter;

      return matchesSearch && matchesType && matchesLocation;
    });
  }, [organizations, searchQuery, typeFilter, locationFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setLocationFilter('all');
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || locationFilter !== 'all';

  return (
    <div>
      {/* Search and Filters */}
      <div className="bg-white border-2 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan-600 font-medium"
            />
          </div>

          {/* Type Filter */}
          <div className="relative min-w-[180px]">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan-600 font-medium appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative min-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-cyan-600 font-medium appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Active Filters & Results Count */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-black">{filteredOrganizations.length}</span> of{' '}
            <span className="font-bold text-black">{organizations.length}</span> organizations
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((org) => {
            const teamSize = org.organizations_profiles?.length || 0;
            const hasAutoLinks = teamSize > 0;

            return (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.slug || org.id}`}
                className="group bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-black mb-1 group-hover:text-cyan-600 transition-colors">
                      {org.name}
                    </h3>
                    {org.type && (
                      <div className="text-xs font-bold text-gray-500 uppercase">
                        {org.type}
                      </div>
                    )}
                  </div>
                  {hasAutoLinks && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-600">
                      <Sparkles className="h-3 w-3" />
                      AUTO
                    </div>
                  )}
                </div>

                {/* Description */}
                {org.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}

                {/* Location */}
                {org.location && (
                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {org.location}
                  </div>
                )}

                {/* Team Members */}
                {teamSize > 0 ? (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-700">Team Members</span>
                      <span className="text-sm font-bold text-cyan-600">{teamSize}</span>
                    </div>

                    {/* Profile Photos */}
                    <div className="flex -space-x-2">
                      {org.organizations_profiles.slice(0, 5).map(
                        (link) =>
                          link.public_profiles && (
                            <div
                              key={link.id}
                              className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                              title={link.public_profiles.full_name}
                            >
                              {link.public_profiles.photo_url ? (
                                <img
                                  src={link.public_profiles.photo_url}
                                  alt={link.public_profiles.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-cyan-100 text-cyan-600 text-xs font-bold">
                                  {link.public_profiles.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          )
                      )}
                      {teamSize > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-600 text-white text-xs font-bold flex items-center justify-center">
                          +{teamSize - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-t-2 border-gray-200 pt-4 text-sm text-gray-400 italic">
                    No team members yet
                  </div>
                )}

                {/* View Arrow */}
                <div className="mt-4 flex items-center justify-end text-cyan-600 font-bold text-sm">
                  View Details →
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <div className="text-gray-600 font-medium mb-2">No organizations found</div>
            <div className="text-sm text-gray-500">
              Try adjusting your search or filters
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
