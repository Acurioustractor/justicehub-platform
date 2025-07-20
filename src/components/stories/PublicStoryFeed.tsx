'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, 
  Building, 
  Users, 
  Lock, 
  Eye,
  Calendar,
  Clock,
  Tag as TagIcon,
  Filter,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { getPrivacyLabel } from '@/lib/privacy';

interface Story {
  id: string;
  title: string;
  content: string;
  storyType: string;
  visibility: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  organizationId?: string;
}

interface PublicStoryFeedProps {
  filter?: 'all' | 'mine' | 'organization' | 'public';
  showFilters?: boolean;
}

export function PublicStoryFeed({ filter = 'all', showFilters = true }: PublicStoryFeedProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(filter);
  const [selectedVisibility, setSelectedVisibility] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, [selectedFilter, selectedVisibility, selectedType]);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        filter: selectedFilter
      });
      
      if (selectedVisibility) {
        params.append('visibility', selectedVisibility);
      }
      
      if (selectedType) {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/stories?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      
      const data = await response.json();
      setStories(data);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateReadingTime = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    const words = plainText.split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Error loading stories: {error}</p>
          <Button onClick={fetchStories} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                >
                  All Stories
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'mine' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('mine')}
                >
                  My Stories
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'public' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('public')}
                >
                  Public Only
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'organization' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('organization')}
                >
                  Organization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Count */}
      <div className="text-sm text-gray-600">
        Showing {stories.length} {stories.length === 1 ? 'story' : 'stories'}
      </div>

      {/* Stories */}
      {stories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No stories found</p>
            <Link href="/stories/new">
              <Button className="mt-4">
                Create Your First Story
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <Card 
              key={story.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
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
                          <span>{calculateReadingTime(story.content)} min read</span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {story.storyType}
                        </Badge>
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
                    <div className="flex items-center gap-2">
                      {story.visibility === 'anonymous' && (
                        <Badge variant="secondary">
                          Anonymous Author
                        </Badge>
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
    </div>
  );
}