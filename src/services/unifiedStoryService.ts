import { db } from '@/server/db';
import { stories, storyTags, storyMedia } from '@/server/db/schema/stories';
import { users } from '@/server/db/schema';
import { eq, desc, or, and, like, inArray, sql } from 'drizzle-orm';
import { getPrivacyFilter } from '@/lib/privacy';

interface UnifiedStory {
  id: string;
  title: string;
  content: string;
  storyType: string;
  visibility: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  source: 'local' | 'airtable';
  tags?: string[];
  media?: any[];
  author?: {
    id?: string;
    name?: string;
    organization?: string;
  };
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    lastSyncedAt?: Date;
  };
}

interface StoryFilter {
  userId?: string;
  organizationId?: string;
  visibility?: string[];
  storyType?: string[];
  tags?: string[];
  search?: string;
  source?: 'local' | 'airtable' | 'all';
  published?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'publishedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class UnifiedStoryService {
  /**
   * Fetch stories from both local database and Airtable
   */
  async getUnifiedStories(filter: StoryFilter, viewer: any): Promise<{
    stories: UnifiedStory[];
    total: number;
    hasMore: boolean;
  }> {
    const limit = filter.limit || 20;
    const offset = filter.offset || 0;

    // Get stories based on source preference
    let localStories: UnifiedStory[] = [];
    let airtableStories: UnifiedStory[] = [];
    
    if (filter.source !== 'airtable') {
      localStories = await this.getLocalStories(filter, viewer);
    }
    
    if (filter.source !== 'local') {
      airtableStories = await this.getAirtableStories(filter, viewer);
    }

    // Merge and sort stories
    const allStories = [...localStories, ...airtableStories];
    const sortedStories = this.sortStories(allStories, filter.sortBy || 'createdAt', filter.sortOrder || 'desc');

    // Apply pagination
    const paginatedStories = sortedStories.slice(offset, offset + limit);
    
    return {
      stories: paginatedStories,
      total: sortedStories.length,
      hasMore: sortedStories.length > offset + limit
    };
  }

  /**
   * Fetch stories from local database
   */
  private async getLocalStories(filter: StoryFilter, viewer: any): Promise<UnifiedStory[]> {
    try {
      // Build privacy-aware query
      const privacyConditions = getPrivacyFilter(viewer);
      let conditions: any[] = [];

      // Apply privacy filter
      if (privacyConditions.or) {
        conditions = privacyConditions.or;
      }

      // Apply additional filters
      if (filter.visibility && filter.visibility.length > 0) {
        conditions.push(inArray(stories.visibility, filter.visibility));
      }

      if (filter.storyType && filter.storyType.length > 0) {
        conditions.push(inArray(stories.storyType, filter.storyType));
      }

      if (filter.published !== undefined) {
        conditions.push(eq(stories.published, filter.published));
      }

      if (filter.organizationId) {
        conditions.push(eq(stories.organizationId, filter.organizationId));
      }

      // Build query
      let query = db
        .select({
          story: stories,
          author: {
            id: users.id,
            email: users.email,
            name: sql<string>`${users.profile}->>'name'`,
            organizationId: users.organizationId
          }
        })
        .from(stories)
        .leftJoin(users, eq(stories.userId, users.id))
        .where(conditions.length > 0 ? or(...conditions) : undefined)
        .orderBy(desc(stories.createdAt));

      const results = await query;

      // Get tags for each story
      const storyIds = results.map(r => r.story.id);
      const tagsResults = await db
        .select()
        .from(storyTags)
        .where(inArray(storyTags.storyId, storyIds));

      // Group tags by story
      const tagsByStory = tagsResults.reduce((acc, tag) => {
        if (!acc[tag.storyId]) acc[tag.storyId] = [];
        acc[tag.storyId].push(tag.tag);
        return acc;
      }, {} as Record<string, string[]>);

      // Get media for each story
      const mediaResults = await db
        .select()
        .from(storyMedia)
        .where(inArray(storyMedia.storyId, storyIds));

      // Group media by story
      const mediaByStory = mediaResults.reduce((acc, media) => {
        if (!acc[media.storyId]) acc[media.storyId] = [];
        acc[media.storyId].push(media);
        return acc;
      }, {} as Record<string, any[]>);

      // Map to unified format
      return results.map(({ story, author }) => ({
        id: story.id,
        title: story.title,
        content: story.content,
        storyType: story.storyType,
        visibility: story.visibility,
        published: story.published,
        publishedAt: story.publishedAt,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
        source: 'local' as const,
        tags: tagsByStory[story.id] || [],
        media: mediaByStory[story.id] || [],
        author: story.visibility === 'anonymous' && story.userId !== viewer?.id 
          ? { name: 'Anonymous' }
          : {
              id: author?.id,
              name: author?.name || 'Unknown',
              organization: author?.organizationId
            },
        metadata: {
          wordCount: story.content.split(/\s+/).length,
          readingTime: Math.ceil(story.content.split(/\s+/).length / 200)
        }
      }));
    } catch (error) {
      console.error('Error fetching local stories:', error);
      return [];
    }
  }

  /**
   * Fetch stories from Airtable via API
   */
  private async getAirtableStories(filter: StoryFilter, viewer: any): Promise<UnifiedStory[]> {
    try {
      // Build query params
      const params = new URLSearchParams();
      
      if (filter.tags && filter.tags.length > 0) {
        params.append('tags', filter.tags.join(','));
      }
      
      if (filter.search) {
        params.append('search', filter.search);
      }

      // Fetch from Airtable API
      const response = await fetch(`/api/airtable/stories?${params}`, {
        headers: {
          'x-user-id': viewer?.id || '',
          'x-user-role': viewer?.role || '',
          'x-organization-id': viewer?.organizationId || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Airtable stories');
      }

      const airtableData = await response.json();

      // Map Airtable stories to unified format
      return airtableData.stories.map((story: any) => ({
        id: `airtable_${story.id}`,
        title: story.fields.Title || 'Untitled',
        content: story.fields.Content || '',
        storyType: story.fields.Type || 'reflection',
        visibility: story.fields.Visibility || 'public',
        published: story.fields.Published || false,
        publishedAt: story.fields.PublishedDate ? new Date(story.fields.PublishedDate) : null,
        createdAt: new Date(story.createdTime),
        updatedAt: new Date(story.fields.LastModified || story.createdTime),
        source: 'airtable' as const,
        tags: story.fields.Tags || [],
        media: story.fields.Attachments?.map((att: any) => ({
          id: att.id,
          type: att.type.startsWith('image/') ? 'image' : 'video',
          url: att.url,
          thumbnailUrl: att.thumbnails?.large?.url,
          metadata: {
            filename: att.filename,
            size: att.size,
            type: att.type
          }
        })) || [],
        author: {
          name: story.fields.AuthorName || 'Community Member',
          organization: story.fields.Organization
        },
        metadata: {
          wordCount: story.fields.WordCount,
          readingTime: story.fields.ReadingTime,
          lastSyncedAt: new Date()
        }
      }));
    } catch (error) {
      console.error('Error fetching Airtable stories:', error);
      return [];
    }
  }

  /**
   * Sort stories by specified field
   */
  private sortStories(
    stories: UnifiedStory[], 
    sortBy: 'createdAt' | 'publishedAt' | 'title',
    sortOrder: 'asc' | 'desc'
  ): UnifiedStory[] {
    return stories.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'publishedAt':
          const aDate = a.publishedAt || a.createdAt;
          const bDate = b.publishedAt || b.createdAt;
          compareValue = aDate.getTime() - bDate.getTime();
          break;
        case 'createdAt':
        default:
          compareValue = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });
  }

  /**
   * Search stories across both sources
   */
  async searchStories(query: string, viewer: any): Promise<UnifiedStory[]> {
    const filter: StoryFilter = {
      search: query,
      published: true,
      limit: 50
    };

    const { stories } = await this.getUnifiedStories(filter, viewer);
    
    // Additional client-side filtering for better search results
    const searchLower = query.toLowerCase();
    return stories.filter(story => 
      story.title.toLowerCase().includes(searchLower) ||
      story.content.toLowerCase().includes(searchLower) ||
      story.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Get story statistics across both sources
   */
  async getStoryStats(viewer: any): Promise<{
    total: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    byVisibility: Record<string, number>;
    recentlyPublished: number;
  }> {
    const { stories } = await this.getUnifiedStories({ limit: 1000 }, viewer);
    
    const stats = {
      total: stories.length,
      bySource: { local: 0, airtable: 0 },
      byType: {} as Record<string, number>,
      byVisibility: {} as Record<string, number>,
      recentlyPublished: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    stories.forEach(story => {
      // By source
      stats.bySource[story.source]++;
      
      // By type
      stats.byType[story.storyType] = (stats.byType[story.storyType] || 0) + 1;
      
      // By visibility
      stats.byVisibility[story.visibility] = (stats.byVisibility[story.visibility] || 0) + 1;
      
      // Recently published
      if (story.publishedAt && story.publishedAt > thirtyDaysAgo) {
        stats.recentlyPublished++;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const unifiedStoryService = new UnifiedStoryService();