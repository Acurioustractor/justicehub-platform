/**
 * Multimedia Story Grid Component
 * 
 * Grid layout for displaying various types of multimedia stories
 */

'use client';

import { useState, useEffect } from 'react';
import { MediaStoryCard } from './MediaStoryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Filter,
  SortAsc,
  Grid,
  List,
  Play,
  Camera,
  Mic,
  FileText,
  TrendingUp,
  Clock,
  Heart
} from 'lucide-react';
import type { Story, StoryFilter, StorySortOption, ContentType } from '@/types/stories';

interface MediaStoryGridProps {
  initialStories?: Story[];
  featuredCount?: number;
  showFilters?: boolean;
  showViewToggle?: boolean;
  pageSize?: number;
}

export function MediaStoryGrid({ 
  initialStories = [], 
  featuredCount = 2,
  showFilters = true,
  showViewToggle = true,
  pageSize = 12 
}: MediaStoryGridProps) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [loading, setLoading] = useState(!initialStories.length);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StoryFilter[]>([]);
  const [sortBy, setSortBy] = useState<StorySortOption>('newest' as StorySortOption);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || initialStories.length > 0) return;
    fetchStories();
  }, [mounted, filters, sortBy, page]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort: sortBy
      });

      // Add content type filters
      if (selectedContentTypes.length > 0) {
        queryParams.append('types', selectedContentTypes.join(','));
      }

      // Add other filters
      filters.forEach(filter => {
        queryParams.append(`filter_${filter.type}`, filter.value);
      });

      const response = await fetch(`/api/stories/multimedia?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await response.json();
      
      if (page === 1) {
        setStories(data.stories || getMockStories());
      } else {
        setStories(prev => [...prev, ...(data.stories || [])]);
      }
      
      setHasMore(data.has_more || false);
      
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Failed to load stories');
      
      // Use mock data as fallback
      if (page === 1) {
        setStories(getMockStories());
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockStories = (): Story[] => {
    return [
      {
        id: '1',
        type: 'blog',
        title: 'From Detention to Determination: My Path to College',
        description: 'How I transformed my experience in juvenile detention into motivation for higher education and advocacy work.',
        content: 'Full blog content here...',
        excerpt: 'Three years ago, I was sitting in a detention center wondering if my life would ever amount to anything...',
        featured_image: {
          id: 'img1',
          filename: 'college-success.jpg',
          original_filename: 'college-success.jpg',
          file_type: 'image/jpeg',
          file_size: 245760,
          url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
          alt_text: 'Student walking on college campus',
          upload_date: '2024-01-15T10:00:00Z',
          storage_provider: 'cloudinary'
        },
        author: {
          id: 'author1',
          name: 'Marcus Thompson',
          age: 22,
          location: 'Brisbane, QLD',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
          verified: true,
          anonymous: false
        },
        tags: ['education', 'transformation', 'college', 'advocacy'],
        category: 'transformation',
        visibility: 'public',
        status: 'published',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        published_at: '2024-01-15T10:00:00Z',
        engagement: {
          likes: 156,
          comments: 23,
          shares: 45,
          views: 2340,
          bookmarks: 78
        },
        metadata: {
          reading_time: '5 min read',
          impact_score: 9.2,
          featured: true,
          editor_pick: true,
          community_choice: false,
          age_appropriate: true,
          content_rating: 'general'
        }
      } as Story,
      {
        id: '2',
        type: 'video',
        title: 'Breaking Barriers: Youth Leadership in Action',
        description: 'A documentary short following young advocates as they work to reform youth justice policies.',
        author: {
          id: 'author2',
          name: 'Sarah Chen',
          age: 19,
          location: 'Melbourne, VIC',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&q=80',
          verified: true,
          anonymous: false
        },
        video_file: {
          id: 'video1',
          filename: 'youth-leadership.mp4',
          original_filename: 'youth-leadership.mp4',
          file_type: 'video/mp4',
          file_size: 52428800,
          url: 'https://example.com/videos/youth-leadership.mp4',
          upload_date: '2024-01-10T14:00:00Z',
          storage_provider: 'aws'
        },
        thumbnail: {
          id: 'thumb1',
          filename: 'youth-leadership-thumb.jpg',
          original_filename: 'youth-leadership-thumb.jpg',
          file_type: 'image/jpeg',
          file_size: 102400,
          url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
          alt_text: 'Young people in a meeting room discussing policy',
          upload_date: '2024-01-10T14:00:00Z',
          storage_provider: 'aws'
        },
        duration: '12:34',
        tags: ['advocacy', 'leadership', 'policy', 'documentary'],
        category: 'advocacy',
        visibility: 'public',
        status: 'published',
        created_at: '2024-01-10T14:00:00Z',
        updated_at: '2024-01-10T14:00:00Z',
        published_at: '2024-01-10T14:00:00Z',
        engagement: {
          likes: 89,
          comments: 34,
          shares: 67,
          views: 1890,
          bookmarks: 45
        },
        metadata: {
          impact_score: 8.7,
          featured: true,
          editor_pick: false,
          community_choice: true,
          age_appropriate: true,
          content_rating: 'general'
        }
      } as Story,
      {
        id: '3',
        type: 'interview',
        title: 'Healing Through Art: A Conversation with Jamie Rodriguez',
        description: 'Former system-involved youth Jamie shares how art therapy transformed their healing journey.',
        interviewee: {
          name: 'Jamie Rodriguez',
          role: 'Artist & Advocate',
          bio: 'Community artist using creative expression for healing and advocacy',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80'
        },
        interviewer: {
          name: 'Dr. Lisa Park',
          role: 'Art Therapist',
          organization: 'Brisbane Community Arts Center',
          bio: 'Licensed art therapist specializing in trauma-informed care'
        },
        format: 'text',
        questions_and_answers: [
          {
            id: 'qa1',
            question: 'How did you first discover art as a form of healing?',
            answer: 'It started in a youth program where they had an art room...',
            highlight: true,
            themes: ['healing', 'discovery']
          }
        ],
        interview_date: '2024-01-08T10:00:00Z',
        themes: ['healing', 'art therapy', 'creative expression'],
        author: {
          id: 'author3',
          name: 'JusticeHub Editorial',
          verified: true,
          anonymous: false
        },
        tags: ['healing', 'art', 'therapy', 'creative-expression'],
        category: 'healing',
        visibility: 'public',
        status: 'published',
        created_at: '2024-01-08T10:00:00Z',
        updated_at: '2024-01-08T10:00:00Z',
        published_at: '2024-01-08T10:00:00Z',
        engagement: {
          likes: 72,
          comments: 18,
          shares: 29,
          views: 1456,
          bookmarks: 34
        },
        metadata: {
          reading_time: '8 min read',
          impact_score: 8.9,
          featured: false,
          editor_pick: true,
          community_choice: false,
          age_appropriate: true,
          content_rating: 'general'
        }
      } as Story,
      {
        id: '4',
        type: 'photo',
        title: 'Community Voices: Portraits of Resilience',
        description: 'A photo series capturing the strength and determination of young people rebuilding their lives.',
        photos: [
          {
            id: 'photo1',
            filename: 'portrait1.jpg',
            original_filename: 'portrait1.jpg',
            file_type: 'image/jpeg',
            file_size: 512000,
            url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80',
            alt_text: 'Portrait of a young person looking determined',
            caption: 'Finding strength in vulnerability',
            upload_date: '2024-01-05T09:00:00Z',
            storage_provider: 'cloudinary',
            photo_metadata: {
              orientation: 'portrait',
              dominant_colors: ['#2B4162', '#385F71', '#F5F0F6'],
              faces_detected: 1,
              content_tags: ['portrait', 'strength', 'youth'],
              mood_tags: ['determined', 'hopeful', 'resilient']
            }
          }
        ],
        layout: 'grid',
        cover_photo: {
          id: 'photo1',
          filename: 'portrait1.jpg',
          original_filename: 'portrait1.jpg',
          file_type: 'image/jpeg',
          file_size: 512000,
          url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80',
          alt_text: 'Portrait of a young person looking determined',
          upload_date: '2024-01-05T09:00:00Z',
          storage_provider: 'cloudinary',
          photo_metadata: {
            orientation: 'portrait',
            dominant_colors: ['#2B4162', '#385F71', '#F5F0F6'],
            faces_detected: 1,
            content_tags: ['portrait', 'strength', 'youth'],
            mood_tags: ['determined', 'hopeful', 'resilient']
          }
        },
        captions_enabled: true,
        photo_count: 12,
        author: {
          id: 'author4',
          name: 'Alex Kim',
          age: 24,
          location: 'Sydney, NSW',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
          verified: true,
          anonymous: false
        },
        tags: ['photography', 'portraits', 'resilience', 'community'],
        category: 'artistic_expression',
        visibility: 'public',
        status: 'published',
        created_at: '2024-01-05T09:00:00Z',
        updated_at: '2024-01-05T09:00:00Z',
        published_at: '2024-01-05T09:00:00Z',
        engagement: {
          likes: 134,
          comments: 27,
          shares: 38,
          views: 2156,
          bookmarks: 89
        },
        metadata: {
          impact_score: 8.4,
          featured: false,
          editor_pick: false,
          community_choice: true,
          age_appropriate: true,
          content_rating: 'general'
        }
      } as Story
    ];
  };

  const handleContentTypeFilter = (type: ContentType) => {
    setSelectedContentTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
    setPage(1);
  };

  const handleSortChange = (newSort: StorySortOption) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleLike = (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, engagement: { ...story.engagement, likes: story.engagement.likes + 1 } }
        : story
    ));
  };

  const handleShare = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (story) {
      navigator.share?.({
        title: story.title,
        text: story.description,
        url: `/stories/${storyId}`
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${window.location.origin}/stories/${storyId}`);
      });
    }
  };

  const handleBookmark = (storyId: string) => {
    // Implement bookmark functionality
    console.log('Bookmarked story:', storyId);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (!mounted) {
    return <div className="animate-pulse">Loading stories...</div>;
  }

  const featuredStories = stories.filter(story => story.metadata.featured).slice(0, featuredCount);
  const regularStories = stories.filter(story => !story.metadata.featured);

  return (
    <div className="space-y-8">
      {/* Filters and Controls */}
      {showFilters && (
        <div className="space-y-4">
          {/* Content Type Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center mr-4">
              <Filter className="h-4 w-4 mr-2" />
              Content Type:
            </span>
            {[
              { type: 'blog' as ContentType, label: 'Blog Posts', icon: FileText },
              { type: 'video' as ContentType, label: 'Videos', icon: Play },
              { type: 'photo' as ContentType, label: 'Photos', icon: Camera },
              { type: 'interview' as ContentType, label: 'Interviews', icon: Mic }
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleContentTypeFilter(type)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedContentTypes.includes(type)
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </button>
            ))}
          </div>

          {/* Sort and View Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <SortAsc className="h-4 w-4 mr-1" />
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as StorySortOption)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="trending">Trending</option>
                <option value="featured">Featured</option>
              </select>
            </div>

            {showViewToggle && (
              <div className="flex items-center gap-1 border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Featured Stories */}
      {featuredStories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Featured Stories</h2>
          </div>
          <div className={`grid gap-6 ${
            featuredStories.length === 1 
              ? 'grid-cols-1 max-w-2xl' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {featuredStories.map((story) => (
              <MediaStoryCard
                key={story.id}
                story={story}
                featured={true}
                onLike={handleLike}
                onShare={handleShare}
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Stories */}
      {regularStories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">All Stories</h2>
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {regularStories.map((story) => (
              <MediaStoryCard
                key={story.id}
                story={story}
                featured={false}
                onLike={handleLike}
                onShare={handleShare}
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline" size="lg">
            Load More Stories
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && stories.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-gray-500 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">No stories found</p>
              <p>Try adjusting your filters or check back later for new content.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}