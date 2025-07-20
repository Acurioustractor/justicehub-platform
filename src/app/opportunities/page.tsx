'use client';

import { useState, useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Building,
  Briefcase,
  GraduationCap,
  Heart,
  Bookmark,
  ChevronRight,
  Star,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface Opportunity {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  type: string;
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  location: {
    type: string;
    city?: string;
    state?: string;
  };
  duration?: {
    type: string;
    length?: number;
    unit?: string;
  };
  compensation: {
    type: string;
    amount?: number;
    currency?: string;
  };
  applicationDeadline?: Date;
  spots: number;
  spotsAvailable: number;
  tags: string[];
  viewCount: number;
  saved: boolean;
  applied: boolean;
  featured: boolean;
}

const opportunityTypeIcons: Record<string, any> = {
  job: Briefcase,
  internship: GraduationCap,
  apprenticeship: Users,
  volunteer: Heart,
  education: GraduationCap,
  workshop: Calendar,
  mentorship: Users,
  scholarship: Star,
  program: Building,
};

export default function OpportunitiesPage() {
  const { user } = useUserContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCompensation, setSelectedCompensation] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch opportunities
  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunities', {
      search: searchQuery,
      type: selectedType,
      location: selectedLocation,
      compensation: selectedCompensation,
      sortBy,
      page,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedLocation !== 'all') params.append('location', selectedLocation);
      if (selectedCompensation !== 'all') params.append('compensation', selectedCompensation);
      params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/opportunities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      return response.json();
    },
  });

  const opportunities = data?.opportunities || [];
  const pagination = data?.pagination;

  const handleSaveToggle = async (opportunityId: string, currentlySaved: boolean) => {
    if (!user) {
      alert('Please sign in to save opportunities');
      return;
    }

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/save`, {
        method: currentlySaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to update saved status');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Failed to update saved status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Discover Opportunities</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find internships, jobs, volunteer positions, and programs to advance your journey
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search opportunities by title, skills, or organization..."
                value={mounted ? searchQuery : ''}
                onChange={(e) => mounted && setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!mounted}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="internship">Internships</SelectItem>
                  <SelectItem value="apprenticeship">Apprenticeships</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="workshop">Workshops</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="scholarship">Scholarships</SelectItem>
                  <SelectItem value="program">Programs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                  <SelectItem value="Chicago">Chicago</SelectItem>
                  <SelectItem value="Houston">Houston</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCompensation} onValueChange={setSelectedCompensation}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Compensation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="stipend">Stipend</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="deadline">Deadline Soon</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-primary/5 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              <p className="text-sm text-gray-600">Active Opportunities</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {opportunities.filter((o: Opportunity) => o.type === 'internship').length}
              </p>
              <p className="text-sm text-gray-600">Internships</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {opportunities.filter((o: Opportunity) => o.compensation.type === 'paid').length}
              </p>
              <p className="text-sm text-gray-600">Paid Positions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {opportunities.filter((o: Opportunity) => o.location.type === 'remote').length}
              </p>
              <p className="text-sm text-gray-600">Remote</p>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-6 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600">Error loading opportunities. Please try again.</p>
            </CardContent>
          </Card>
        ) : opportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((opportunity: Opportunity) => {
                const TypeIcon = opportunityTypeIcons[opportunity.type] || Briefcase;
                const daysUntilDeadline = opportunity.applicationDeadline
                  ? Math.ceil((new Date(opportunity.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Card 
                    key={opportunity.id} 
                    className={`hover:shadow-lg transition-shadow ${
                      opportunity.featured ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <Badge variant="secondary">
                            {opportunity.type}
                          </Badge>
                          {opportunity.featured && (
                            <Badge variant="default">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveToggle(opportunity.id, opportunity.saved)}
                        >
                          <Bookmark 
                            className={`h-5 w-5 ${
                              opportunity.saved ? 'fill-current' : ''
                            }`} 
                          />
                        </Button>
                      </div>
                      <CardTitle className="line-clamp-2">
                        {opportunity.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {opportunity.organization.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {opportunity.shortDescription}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {opportunity.location.type === 'remote' 
                              ? 'Remote' 
                              : `${opportunity.location.city}, ${opportunity.location.state}`}
                          </span>
                        </div>

                        {opportunity.compensation.type === 'paid' && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>
                              {opportunity.compensation.amount 
                                ? `$${opportunity.compensation.amount.toLocaleString()}`
                                : 'Paid'}
                            </span>
                          </div>
                        )}

                        {opportunity.applicationDeadline && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className={daysUntilDeadline && daysUntilDeadline < 7 ? 'text-red-600' : ''}>
                              {daysUntilDeadline && daysUntilDeadline < 7
                                ? `${daysUntilDeadline} days left`
                                : `Deadline: ${format(new Date(opportunity.applicationDeadline), 'MMM d')}`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>
                            {opportunity.spotsAvailable} of {opportunity.spots} spots left
                          </span>
                        </div>
                      </div>

                      {opportunity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {opportunity.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {opportunity.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{opportunity.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{opportunity.viewCount} views</span>
                          {opportunity.applied && (
                            <Badge variant="success" className="text-xs">
                              Applied
                            </Badge>
                          )}
                        </div>
                        <Link href={`/opportunities/${opportunity.slug}`}>
                          <Button size="sm">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}