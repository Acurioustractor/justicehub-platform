'use client';

import { useState } from 'react';
import { useUnifiedStories } from '@/hooks/useUnifiedStories';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Filter,
  Globe, 
  Building, 
  Users, 
  Lock, 
  Eye,
  Calendar,
  Clock,
  Tag as TagIcon,
  ChevronRight,
  Database,
  Cloud,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
// Simple privacy label helper
const getPrivacyLabel = (level: string) => {
  switch (level) {
    case 'public': return 'Public';
    case 'community': return 'Community';
    case 'private': return 'Private';
    default: return 'Unknown';
  }
};

interface UnifiedStoryFeedProps {
  initialFilter?: {
    source?: 'local' | 'airtable' | 'all';
    visibility?: string[];
    storyType?: string[];
    tags?: string[];
  };
  showHeader?: boolean;
  showStats?: boolean;
  limit?: number;
}

export function UnifiedStoryFeed({ 
  initialFilter = {}, 
  showHeader = true,
  showStats = true 
}: UnifiedStoryFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    stories,
    total,
    hasMore,
    isLoading,
    error,
    refetch,
    loadMore,
    search,
    updateFilter
  } = useUnifiedStories(initialFilter);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchQuery);
  };

  const getSourceIcon = (source: string) => {
    return source === 'airtable' ? (
      <Cloud className="h-3 w-3" />
    ) : (
      <Database className="h-3 w-3" />
    );
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'organization':
        return <Building className="h-4 w-4 text-blue-600" />;
      case 'mentors':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'private':
        return <Lock className="h-4 w-4 text-gray-600" />;
      case 'anonymous':
        return <Eye className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength) + '...';
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not published';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500 mb-4">Error loading stories</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <>
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search stories by title, content, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </form>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Source</label>
                    <Tabs
                      defaultValue={initialFilter.source || 'all'}
                      onValueChange={(value) => updateFilter({ source: value as any })}
                    >
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="local">Local</TabsTrigger>
                        <TabsTrigger value="airtable">Airtable</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select onValueChange={(value) => updateFilter({ storyType: [value] })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="reflection">Reflection</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="challenge">Challenge</SelectItem>
                        <SelectItem value="achievement">Achievement</SelectItem>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort by</label>
                    <Select 
                      defaultValue="createdAt"
                      onValueChange={(value) => updateFilter({ sortBy: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Latest</SelectItem>
                        <SelectItem value="publishedAt">Recently Published</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-sm text-gray-600">Total Stories</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {stories.filter(s => s.source === 'local').length}
                  </p>
                  <p className="text-sm text-gray-600">Local Stories</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {stories.filter(s => s.source === 'airtable').length}
                  </p>
                  <p className="text-sm text-gray-600">Airtable Stories</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {stories.filter(s => s.published).length}
                  </p>
                  <p className="text-sm text-gray-600">Published</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {isLoading && stories.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stories */}
      {stories.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No stories found</p>
            <Link href="/stories/new">
              <Button>Create Your First Story</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <Card 
              key={story.id} 
              className="hover:shadow-lg transition-shadow"
            >
              <Link href={`/stories/${story.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(story.publishedAt || story.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{story.metadata?.readingTime || 1} min read</span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {story.storyType}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getSourceIcon(story.source)}
                          <span className="text-xs">{story.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon(story.visibility)}
                      <span className="text-sm text-gray-500">
                        {getPrivacyLabel(story.visibility as any)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {truncateContent(story.content)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {story.author && (
                        <Badge variant="secondary">
                          {story.author.name}
                        </Badge>
                      )}
                      {story.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {story.tags && story.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{story.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      Read More
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Stories'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}