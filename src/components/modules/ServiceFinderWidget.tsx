'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Building2,
  Filter,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Grid3X3,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  categories?: string[];
  keywords?: string[];
  minimum_age?: number;
  maximum_age?: number;
  age_range?: {
    minimum?: number;
    maximum?: number;
  };
  youth_specific?: boolean;
  indigenous_specific?: boolean;
  organization?: {
    id?: string;
    name?: string;
    type?: string;
    website?: string;
  };
  organizations?: {
    id: string;
    name: string;
    website?: string;
  };
  location?: {
    address?: string;
    city?: string;
    region?: string;
    state?: string;
    postcode?: string;
  };
  locations?: {
    id: string;
    street_address?: string;
    locality?: string;
    region?: string;
    state?: string;
    postcode?: string;
  };
  contact?: {
    phone?: any;
    email?: any;
    website?: string;
    hours?: string;
  };
  contacts?: {
    id: string;
    phone?: string;
    email?: string;
    website?: string;
    hours?: string;
  };
  url?: string;
  score?: number;
}

interface Stats {
  total_services: number;
  total_organizations: number;
  total_locations: number;
  total_contacts: number;
  by_region: Record<string, number>;
  by_category: Record<string, number>;
}

// Helper functions to properly format data
const formatPhoneNumber = (phone: any) => {
  if (!phone) return null;
  
  // Handle array format
  if (Array.isArray(phone) && phone.length > 0) {
    return phone[0].number || phone[0];
  }
  
  // Handle object format with multiple phone types
  if (typeof phone === 'object' && phone !== null) {
    const phoneNumber = phone.primary || phone.mobile || phone.toll_free || phone.crisis_line;
    return phoneNumber || null;
  }
  
  // Handle string format
  if (typeof phone === 'string') {
    return phone;
  }
  
  return null;
};

const formatEmailAddress = (email: any) => {
  if (!email) return null;
  
  // Handle string format (could be JSON string)
  if (typeof email === 'string') {
    try {
      const emailObj = JSON.parse(email);
      return emailObj.primary || emailObj.intake || emailObj.admin || null;
    } catch {
      return email;
    }
  }
  
  // Handle object format
  if (typeof email === 'object' && email !== null) {
    return email.primary || email.intake || email.admin || null;
  }
  
  return null;
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getCategoryBadgeColor = (category: string) => {
  const colors: Record<string, string> = {
    legal_aid: 'bg-red-100 text-red-800',
    mental_health: 'bg-green-100 text-green-800',
    housing: 'bg-purple-100 text-purple-800',
    crisis_support: 'bg-orange-100 text-orange-800',
    education_training: 'bg-blue-100 text-blue-800',
    substance_abuse: 'bg-pink-100 text-pink-800',
    family_support: 'bg-cyan-100 text-cyan-800',
    cultural_support: 'bg-yellow-100 text-yellow-800',
    advocacy: 'bg-indigo-100 text-indigo-800',
    court_support: 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const getAgeRangeText = (service: Service) => {
  const ageRange = service.age_range || { 
    minimum: service.minimum_age, 
    maximum: service.maximum_age 
  };
  
  if (!ageRange) return null;
  
  const { minimum, maximum } = ageRange;
  if (minimum && maximum) {
    return `Ages ${minimum}-${maximum}`;
  } else if (minimum) {
    return `Ages ${minimum}+`;
  } else if (maximum) {
    return `Up to age ${maximum}`;
  }
  return null;
};

const truncateDescription = (text: string, maxLength = 200) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const getServiceDescription = (service: Service) => {
  if (typeof service.description === 'string') {
    return service.description;
  }
  
  // Handle case where description might be in organization
  if (service.organization && typeof service.organization === 'object') {
    if ('description' in service.organization) {
      return service.organization.description as string;
    }
  }
  
  if (service.organizations && typeof service.organizations === 'object') {
    if ('description' in service.organizations) {
      return service.organizations.description as string;
    }
  }
  
  return 'No description available';
};

const getServiceLocation = (service: Service) => {
  // Try service.location first
  if (service.location) {
    const parts = [
      service.location.address,
      service.location.city,
      service.location.region,
      service.location.state
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  
  // Try service.locations
  if (service.locations) {
    const parts = [
      service.locations.street_address,
      service.locations.locality,
      service.locations.region,
      service.locations.state
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  
  return 'Location not specified';
};

export function ServiceFinderWidget() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ageFilter, setAgeFilter] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedState, setSelectedState] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/services/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

      // Load services
      const response = await fetch(`/api/services?limit=${itemsPerPage}&page=${currentPage}`);
      const data = await response.json();
      console.log('🔍 API Response:', data);
      console.log('🔍 First service structure:', data.data?.[0]);
      
      if (data.success) {
        setServices(data.data);
        setTotalCount(data.pagination?.total || data.data.length);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !searchLocation.trim()) {
      // If no search terms, just load all services
      loadInitialData();
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (searchLocation.trim()) params.append('location', searchLocation.trim());
      params.append('limit', '24');

      const response = await fetch(`/api/services/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchLocation('');
    setHasSearched(false);
    loadInitialData();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Show loading state during initial load
  if (!mounted) {
    return (
      <div className="w-full space-y-8">
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-2 text-neutral-300">-</div>
                  <div className="text-neutral-400 text-sm font-medium">Loading...</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Stats Section */}
      {stats && (
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                  {stats.total_services.toLocaleString()}
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Youth Services</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                  {stats.total_organizations.toLocaleString()}
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                  {Object.keys(stats.by_region || {}).length}
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Regions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                  {Object.keys(stats.by_category || {}).length}
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <CardContent className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Service or Keywords</label>
                <Input
                  placeholder="e.g. legal aid, counselling, housing"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 text-base border-neutral-200 dark:border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Location</label>
                <Input
                  placeholder="e.g. Brisbane, Gold Coast, Cairns"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 text-base border-neutral-200 dark:border-neutral-700"
                />
              </div>
            </div>

            {/* View Toggle & Filters */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">View & Filters</h3>
                  <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1">
                    <Button
                      variant={viewType === 'cards' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('cards')}
                      className="h-8 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewType === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('table')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-neutral-600 dark:text-neutral-400"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">All States</option>
                      <option value="QLD">Queensland</option>
                      <option value="NSW">New South Wales</option>
                      <option value="VIC">Victoria</option>
                      <option value="WA">Western Australia</option>
                      <option value="SA">South Australia</option>
                      <option value="TAS">Tasmania</option>
                      <option value="ACT">ACT</option>
                      <option value="NT">Northern Territory</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Service Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">All Categories</option>
                      <option value="legal_aid">Legal Aid</option>
                      <option value="mental_health">Mental Health</option>
                      <option value="housing">Housing</option>
                      <option value="crisis_support">Crisis Support</option>
                      <option value="education_training">Education & Training</option>
                      <option value="family_support">Family Support</option>
                      <option value="substance_abuse">Substance Abuse</option>
                      <option value="cultural_support">Cultural Support</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Min Age</label>
                    <Input
                      type="number"
                      placeholder="e.g. 12"
                      value={ageFilter.min}
                      onChange={(e) => setAgeFilter(prev => ({ ...prev, min: e.target.value }))}
                      className="h-10 border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Max Age</label>
                    <Input
                      type="number"
                      placeholder="e.g. 25"
                      value={ageFilter.max}
                      onChange={(e) => setAgeFilter(prev => ({ ...prev, max: e.target.value }))}
                      className="h-10 border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="h-12 px-8 text-base bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <Search className="h-5 w-5 mr-2" />
                {isLoading ? 'Searching...' : 'Search Services'}
              </Button>
              {hasSearched && (
                <Button 
                  variant="outline" 
                  onClick={clearSearch}
                  className="h-12 px-6 text-base border-neutral-200 dark:border-neutral-700"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {hasSearched ? `${services.length} Search Results` : `Featured Services`}
          </h2>
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Filter className="h-4 w-4" />
            Showing {services.length} services
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length > 0 ? (
          <>
            {viewType === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-blue-600 transition-colors">
                            {service.name}
                          </h4>
                          {(service.organization?.name || service.organizations?.name) && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              {service.organization?.name || service.organizations?.name}
                            </p>
                          )}
                        </div>

                        {/* Categories */}
                        {service.categories && service.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {service.categories.slice(0, 3).map((category, index) => (
                              <Badge
                                key={index}
                                className={`text-xs ${getCategoryBadgeColor(category)}`}
                              >
                                {formatCategory(category)}
                              </Badge>
                            ))}
                            {service.categories.length > 3 && (
                              <Badge className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                +{service.categories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                          {truncateDescription(getServiceDescription(service))}
                        </p>

                        {/* Location */}
                        <div className="flex items-start text-sm text-neutral-600 dark:text-neutral-400">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                          <div className="text-xs">
                            {getServiceLocation(service)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                          {formatPhoneNumber(service.contact?.phone || service.contacts?.phone) && (
                            <Button size="sm" asChild className="flex-1">
                              <a href={`tel:${formatPhoneNumber(service.contact?.phone || service.contacts?.phone)}`}>
                                Contact Service
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <a 
                              href={`https://maps.google.com?q=${encodeURIComponent(getServiceLocation(service))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Get Directions
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            <Button variant="ghost" size="sm" className="p-0 h-auto font-medium">
                              Service Name <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Organization
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
                        {services.map((service) => (
                          <tr key={service.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {service.name}
                              </div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                {truncateDescription(getServiceDescription(service), 100)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                              {service.organization?.name || service.organizations?.name || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                              {getServiceLocation(service)}
                            </td>
                            <td className="px-6 py-4">
                              {service.categories && service.categories.length > 0 ? (
                                <Badge className={`text-xs ${getCategoryBadgeColor(service.categories[0])}`}>
                                  {formatCategory(service.categories[0])}
                                </Badge>
                              ) : (
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {formatPhoneNumber(service.contact?.phone || service.contacts?.phone) && (
                                  <Button size="sm" asChild>
                                    <a href={`tel:${formatPhoneNumber(service.contact?.phone || service.contacts?.phone)}`}>
                                      Call
                                    </a>
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" asChild>
                                  <a 
                                    href={`https://maps.google.com?q=${encodeURIComponent(getServiceLocation(service))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Directions
                                  </a>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 px-3">
                  Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.ceil(totalCount / itemsPerPage))}
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>)
        ) : hasSearched ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No services found</h4>
                <p className="text-gray-600 mb-6">
                  We couldn't find any services matching your search criteria. Try adjusting your search terms or location.
                </p>
                <Button onClick={clearSearch} variant="outline" className="px-8">
                  Clear Search & Browse All
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Show More Button */}
        {!hasSearched && services.length > 0 && (
          <div className="text-center pt-6">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                setSearchQuery('');
                setSearchLocation('');
                setHasSearched(false);
                loadInitialData(); // Just load more data, don't search
              }}
              className="px-8"
            >
              Browse All Services
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}