/**
 * Gallery Grid Component
 * 
 * Main gallery component that displays cross-linked content in various layouts
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Grid,
  List,
  Search,
  Filter,
  Sort,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Link as LinkIcon,
  Play,
  FileText,
  Camera,
  Mic,
  Users,
  Building2,
  Calendar,
  MapPin,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { 
  GalleryItem, 
  GalleryCollection, 
  GalleryFilter, 
  SortOrder, 
  LayoutType,
  ContentType,
  SourceType 
} from '@/types/gallery';

interface GalleryGridProps {
  items?: GalleryItem[];
  collections?: GalleryCollection[];
  showCollections?: boolean;
  showCrosslinking?: boolean;
  maxCrosslinks?: number;
  layout?: LayoutType;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  infiniteScroll?: boolean;
  pageSize?: number;
  className?: string;
}

export function GalleryGrid({
  items: initialItems = [],
  collections: initialCollections = [],
  showCollections = true,
  showCrosslinking = true,
  maxCrosslinks = 3,
  layout = LayoutType.GRID,
  searchable = true,
  filterable = true,
  sortable = true,
  infiniteScroll = false,
  pageSize = 20,
  className = ''
}: GalleryGridProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [collections, setCollections] = useState<GalleryCollection[]>(initialCollections);
  const [loading, setLoading] = useState(!initialItems.length);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<GalleryFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NEWEST);
  const [viewMode, setViewMode] = useState<LayoutType>(layout);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || initialItems.length > 0) return;
    fetchGalleryData();
  }, [mounted, searchQuery, activeFilters, sortOrder, page]);

  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort: sortOrder,
        search: searchQuery
      });

      // Add active filters
      activeFilters.forEach(filter => {
        queryParams.append(`filter_${filter.type}`, filter.value);
      });

      const response = await fetch(`/api/gallery?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery data');
      }

      const data = await response.json();
      
      if (page === 1) {
        setItems(data.items || getMockGalleryItems());
        setCollections(data.collections || getMockCollections());
      } else {
        setItems(prev => [...prev, ...(data.items || [])]);
      }
      
      setHasMore(data.has_more || false);
      
    } catch (error) {
      console.error('Error fetching gallery data:', error);
      
      // Use mock data as fallback
      if (page === 1) {
        setItems(getMockGalleryItems());
        setCollections(getMockCollections());
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockGalleryItems = (): GalleryItem[] => {
    return [
      {
        id: '1',
        title: 'From Streets to Success: Marcus\'s Journey',
        description: 'A powerful video documentary following Marcus through his transformation',
        content_type: ContentType.VIDEO,
        source_type: SourceType.STORY_VIDEO,
        source_id: 'story_1',
        media_url: 'https://example.com/video1.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        alt_text: 'Marcus speaking at a youth conference',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        featured: true,
        tags: ['transformation', 'education', 'advocacy'],
        category: 'transformation',
        related_items: [
          {
            id: '2',
            title: 'Education Support Services',
            content_type: ContentType.SERVICE,
            source_type: SourceType.SERVICE_LISTING,
            thumbnail_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80',
            relationship_type: 'service_related' as any,
            relationship_strength: 0.9
          },
          {
            id: '3',
            title: 'Brisbane Youth Center',
            content_type: ContentType.ORGANIZATION,
            source_type: SourceType.ORGANIZATION_PROFILE,
            thumbnail_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
            relationship_type: 'location_based' as any,
            relationship_strength: 0.8
          }
        ],
        connections: [],
        engagement: {
          views: 2340,
          likes: 156,
          shares: 45,
          comments: 23,
          collections_count: 8
        },
        display_settings: {
          layout_hint: 'hero' as any,
          priority_score: 9.2,
          color_theme: ['#3B82F6', '#1E40AF']
        },
        source_data: {
          duration: '8:42',
          chapters: 3,
          captions_available: true
        }
      },
      {
        id: '4',
        title: 'Community Art Therapy Program',
        description: 'Healing through creative expression - photo essay',
        content_type: ContentType.IMAGE,
        source_type: SourceType.STORY_PHOTO,
        source_id: 'story_4',
        media_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80',
        alt_text: 'Young people creating art together',
        created_at: '2024-01-10T14:00:00Z',
        updated_at: '2024-01-10T14:00:00Z',
        featured: false,
        tags: ['healing', 'art', 'community', 'therapy'],
        category: 'healing',
        related_items: [
          {
            id: '5',
            title: 'Art Therapy Services',
            content_type: ContentType.SERVICE,
            source_type: SourceType.SERVICE_LISTING,
            relationship_type: 'service_related' as any,
            relationship_strength: 0.95
          }
        ],
        connections: [],
        engagement: {
          views: 1890,
          likes: 134,
          shares: 67,
          comments: 29,
          collections_count: 12
        },
        display_settings: {
          layout_hint: 'card' as any,
          priority_score: 8.7,
          color_theme: ['#10B981', '#059669']
        },
        source_data: {
          photo_count: 15,
          location: 'Melbourne Arts Center'
        }
      },
      {
        id: '6',
        title: 'Legal Aid Queensland - Youth Services',
        description: 'Comprehensive legal support for young people',
        content_type: ContentType.SERVICE,
        source_type: SourceType.SERVICE_LISTING,
        source_id: 'service_6',
        media_url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&q=80',
        alt_text: 'Legal consultation office',
        created_at: '2024-01-08T09:00:00Z',
        updated_at: '2024-01-12T16:30:00Z',
        featured: true,
        tags: ['legal', 'support', 'youth', 'advocacy'],
        category: 'legal_support',
        related_items: [
          {
            id: '7',
            title: 'Know Your Rights Workshop',
            content_type: ContentType.VIDEO,
            source_type: SourceType.STORY_VIDEO,
            relationship_type: 'educational' as any,
            relationship_strength: 0.88
          }
        ],
        connections: [],
        engagement: {
          views: 3420,
          likes: 89,
          shares: 156,
          comments: 45,
          collections_count: 22
        },
        display_settings: {
          layout_hint: 'card' as any,
          priority_score: 9.5,
          color_theme: ['#7C3AED', '#5B21B6']
        },
        source_data: {
          organization: 'Legal Aid Queensland',
          contact_available: true,
          free_service: true
        }
      },
      {
        id: '8',
        title: 'Sarah Chen - Youth Advocate & Mentor',
        description: 'Experienced mentor specializing in education and career transitions',
        content_type: ContentType.PERSON,
        source_type: SourceType.MENTOR_PROFILE,
        source_id: 'mentor_8',
        media_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80',
        alt_text: 'Sarah Chen professional headshot',
        created_at: '2024-01-05T12:00:00Z',
        updated_at: '2024-01-14T10:15:00Z',
        featured: false,
        tags: ['mentorship', 'education', 'career', 'advocacy'],
        category: 'mentorship',
        related_items: [
          {
            id: '9',
            title: 'Career Transition Success Stories',
            content_type: ContentType.STORY,
            source_type: SourceType.STORY_BLOG,
            relationship_type: 'same_author' as any,
            relationship_strength: 0.92
          }
        ],
        connections: [],
        engagement: {
          views: 1560,
          likes: 78,
          shares: 34,
          comments: 67,
          collections_count: 15
        },
        display_settings: {
          layout_hint: 'card' as any,
          priority_score: 8.4,
          color_theme: ['#F59E0B', '#D97706']
        },
        source_data: {
          specialization: ['Education', 'Career Transitions'],
          availability: 'Available',
          rating: 4.9
        }
      }
    ];
  };

  const getMockCollections = (): GalleryCollection[] => {
    return [
      {
        id: 'collection_1',
        title: 'Transformation Stories',
        description: 'Inspiring journeys of personal growth and positive change',
        cover_image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80',
        curator: {
          id: 'curator_1',
          name: 'JusticeHub Editorial',
          type: 'system',
          bio: 'Curated collections highlighting community impact'
        },
        items: [],
        collection_type: 'featured' as any,
        visibility: 'public',
        collaborative: false,
        auto_populated: true,
        item_count: 24,
        total_views: 15600,
        followers: 342,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        featured: true,
        tags: ['transformation', 'growth', 'inspiration']
      },
      {
        id: 'collection_2',
        title: 'Legal Resources & Support',
        description: 'Essential legal information and support services for young people',
        cover_image_url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=600&q=80',
        curator: {
          id: 'curator_2',
          name: 'Legal Aid Network',
          type: 'organization',
          bio: 'Collaborative effort between legal aid organizations'
        },
        items: [],
        collection_type: 'topic' as any,
        visibility: 'public',
        collaborative: true,
        auto_populated: false,
        item_count: 18,
        total_views: 8900,
        followers: 156,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-12T16:00:00Z',
        featured: false,
        tags: ['legal', 'support', 'resources', 'advocacy']
      }
    ];
  };

  const getContentTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
      case ContentType.VIDEO:
        return <Play className="h-4 w-4" />;
      case ContentType.IMAGE:
        return <Camera className="h-4 w-4" />;
      case ContentType.AUDIO:
        return <Mic className="h-4 w-4" />;
      case ContentType.STORY:
        return <FileText className="h-4 w-4" />;
      case ContentType.SERVICE:
        return <Building2 className="h-4 w-4" />;
      case ContentType.PERSON:
        return <Users className="h-4 w-4" />;
      case ContentType.EVENT:
        return <Calendar className="h-4 w-4" />;
      case ContentType.LOCATION:
        return <MapPin className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceTypeColor = (sourceType: SourceType) => {
    switch (sourceType) {
      case SourceType.STORY_VIDEO:
        return 'bg-red-100 text-red-700 border-red-300';
      case SourceType.STORY_PHOTO:
        return 'bg-green-100 text-green-700 border-green-300';
      case SourceType.STORY_BLOG:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case SourceType.STORY_INTERVIEW:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case SourceType.SERVICE_LISTING:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case SourceType.ORGANIZATION_PROFILE:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case SourceType.MENTOR_PROFILE:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getSourceTypeLabel = (sourceType: SourceType) => {
    return sourceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
    // Track engagement
    trackItemView(item.id);
  };

  const trackItemView = async (itemId: string) => {
    try {
      await fetch(`/api/gallery/${itemId}/view`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const handleFilterChange = (filter: GalleryFilter) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.type === filter.type && f.value === filter.value);
      if (existing) {
        return prev.filter(f => f !== existing);
      } else {
        return [...prev, filter];
      }
    });
    setPage(1);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setPage(1);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (!mounted) {
    return <div className="animate-pulse">Loading gallery...</div>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Controls */}
      {(searchable || filterable || sortable) && (
        <div className="space-y-4">
          {/* Search Bar */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search stories, services, people, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-gray-300 focus:border-blue-500"
              />
            </div>
          )}

          {/* Controls Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Filter Controls */}
              {filterable && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                  {activeFilters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear ({activeFilters.length})
                    </Button>
                  )}
                </div>
              )}

              {/* Sort Controls */}
              {sortable && (
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={SortOrder.NEWEST}>Newest First</option>
                  <option value={SortOrder.TRENDING}>Trending</option>
                  <option value={SortOrder.MOST_VIEWED}>Most Viewed</option>
                  <option value={SortOrder.MOST_LIKED}>Most Liked</option>
                  <option value={SortOrder.RELEVANCE}>Most Relevant</option>
                </select>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode(LayoutType.GRID)}
                className={`p-2 ${viewMode === LayoutType.GRID ? 'bg-gray-100' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode(LayoutType.LIST)}
                className={`p-2 ${viewMode === LayoutType.LIST ? 'bg-gray-100' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => handleFilterChange(filter)}
                >
                  {filter.label} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collections Section */}
      {showCollections && collections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold text-black">Featured Collections</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.slice(0, 3).map((collection) => (
              <Card key={collection.id} className="hover:shadow-lg transition-all border-2 border-gray-200 hover:border-yellow-400">
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 relative overflow-hidden rounded-t-lg">
                      {collection.cover_image_url && (
                        <Image
                          src={collection.cover_image_url}
                          alt={collection.title}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-yellow-600 text-white">
                          {collection.item_count} items
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-black">{collection.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>By {collection.curator.name}</span>
                        <span>{collection.total_views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Gallery</h2>
          <span className="text-sm text-gray-500">
            {items.length} items
          </span>
        </div>

        {/* Gallery Items */}
        <div className={`grid gap-6 ${
          viewMode === LayoutType.GRID 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 max-w-4xl mx-auto'
        }`}>
          {items.map((item) => (
            <Card 
              key={item.id} 
              className="group hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 hover:border-blue-300"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  {/* Media Preview */}
                  <div className="aspect-video bg-gray-200 relative overflow-hidden rounded-t-lg">
                    <Image
                      src={item.thumbnail_url || item.media_url}
                      alt={item.alt_text || item.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all" />
                    
                    {/* Content Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getSourceTypeColor(item.source_type)} border`}>
                        {getContentTypeIcon(item.content_type)}
                        <span className="ml-1 text-xs">{getSourceTypeLabel(item.source_type)}</span>
                      </Badge>
                    </div>

                    {/* Featured Badge */}
                    {item.featured && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-yellow-600 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Video Duration or Photo Count */}
                    {item.source_data && (
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-black/70 text-white text-xs">
                          {item.source_data.duration || `${item.source_data.photo_count} photos`}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-black line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{item.engagement.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{item.engagement.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          <span>{item.engagement.shares}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Cross-linking */}
                    {showCrosslinking && item.related_items.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <LinkIcon className="h-3 w-3" />
                          <span>Related Content</span>
                        </div>
                        <div className="flex gap-2">
                          {item.related_items.slice(0, maxCrosslinks).map((related) => (
                            <div
                              key={related.id}
                              className="flex-1 min-w-0 bg-gray-50 rounded p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {getContentTypeIcon(related.content_type)}
                                <span className="text-xs truncate">{related.title}</span>
                                <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (infiniteScroll || (
          <div className="text-center">
            <Button onClick={loadMore} variant="outline" size="lg">
              Load More Content
            </Button>
          </div>
        ))}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <Card className="p-12 text-center">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <Grid className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No content found</p>
                <p>Try adjusting your search or filters to see more results.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}