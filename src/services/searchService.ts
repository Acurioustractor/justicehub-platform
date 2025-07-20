import { db } from '@/server/db';
import { stories, storyTags } from '@/server/db/schema/stories';
import { users } from '@/server/db/schema';
import { eq, or, and, like, ilike, inArray, sql } from 'drizzle-orm';
import { getPrivacyFilter } from '@/lib/privacy';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  highlights: {
    title?: string;
    content?: string[];
    tags?: string[];
  };
  matchScore: number;
  source: 'local' | 'airtable';
  storyType: string;
  visibility: string;
  author?: {
    id?: string;
    name?: string;
  };
  tags: string[];
  createdAt: Date;
  publishedAt?: Date;
}

export interface SearchOptions {
  query: string;
  filters?: {
    storyType?: string[];
    visibility?: string[];
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    source?: 'local' | 'airtable' | 'all';
    author?: string;
    organizationId?: string;
  };
  limit?: number;
  offset?: number;
  includeContent?: boolean;
  fuzzySearch?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  suggestions: string[];
  facets: {
    storyTypes: { value: string; count: number }[];
    tags: { value: string; count: number }[];
    authors: { value: string; count: number }[];
  };
  query: string;
  executionTime: number;
}

export class SearchService {
  /**
   * Perform a comprehensive search across all stories
   */
  async search(options: SearchOptions, viewer: any): Promise<SearchResponse> {
    const startTime = Date.now();
    const { query, filters = {}, limit = 20, offset = 0 } = options;

    // Search both local and Airtable stories
    const localResults = await this.searchLocalStories(options, viewer);
    const airtableResults = await this.searchAirtableStories(options, viewer);

    // Combine and rank results
    const allResults = [...localResults, ...airtableResults];
    const rankedResults = this.rankResults(allResults, query);

    // Apply pagination
    const paginatedResults = rankedResults.slice(offset, offset + limit);

    // Generate facets and suggestions
    const facets = this.generateFacets(rankedResults);
    const suggestions = await this.generateSuggestions(query, rankedResults);

    const executionTime = Date.now() - startTime;

    return {
      results: paginatedResults,
      total: rankedResults.length,
      suggestions,
      facets,
      query,
      executionTime
    };
  }

  /**
   * Search local database stories
   */
  private async searchLocalStories(options: SearchOptions, viewer: any): Promise<SearchResult[]> {
    const { query, filters = {} } = options;
    
    try {
      // Build privacy-aware conditions
      const privacyConditions = getPrivacyFilter(viewer);
      let conditions: any[] = [];

      // Apply privacy filter
      if (privacyConditions.or) {
        conditions = [...privacyConditions.or];
      }

      // Apply search conditions
      const searchConditions = [];
      
      // Search in title and content
      if (query) {
        searchConditions.push(
          ilike(stories.title, `%${query}%`),
          ilike(stories.content, `%${query}%`)
        );
      }

      // Apply filters
      if (filters.storyType?.length) {
        conditions.push(inArray(stories.storyType, filters.storyType));
      }

      if (filters.visibility?.length) {
        conditions.push(inArray(stories.visibility, filters.visibility));
      }

      if (filters.dateRange) {
        conditions.push(
          and(
            sql`${stories.createdAt} >= ${filters.dateRange.start}`,
            sql`${stories.createdAt} <= ${filters.dateRange.end}`
          )
        );
      }

      // Combine all conditions
      const finalConditions = searchConditions.length > 0
        ? and(...conditions, or(...searchConditions))
        : and(...conditions);

      // Execute query
      const results = await db
        .select({
          story: stories,
          author: {
            id: users.id,
            name: sql<string>`${users.profile}->>'name'`
          }
        })
        .from(stories)
        .leftJoin(users, eq(stories.userId, users.id))
        .where(finalConditions);

      // Get tags for results
      const storyIds = results.map(r => r.story.id);
      const tagsData = await db
        .select()
        .from(storyTags)
        .where(inArray(storyTags.storyId, storyIds));

      const tagsByStory = tagsData.reduce((acc, tag) => {
        if (!acc[tag.storyId]) acc[tag.storyId] = [];
        acc[tag.storyId].push(tag.tag);
        return acc;
      }, {} as Record<string, string[]>);

      // Map to search results
      return results.map(({ story, author }) => {
        const excerpt = this.generateExcerpt(story.content, query);
        const highlights = this.generateHighlights(story, query, tagsByStory[story.id] || []);
        const matchScore = this.calculateMatchScore(story, query, tagsByStory[story.id] || []);

        return {
          id: story.id,
          title: story.title,
          content: story.content,
          excerpt,
          highlights,
          matchScore,
          source: 'local' as const,
          storyType: story.storyType,
          visibility: story.visibility,
          author: story.visibility === 'anonymous' && story.userId !== viewer?.id
            ? { name: 'Anonymous' }
            : { id: author?.id, name: author?.name || 'Unknown' },
          tags: tagsByStory[story.id] || [],
          createdAt: story.createdAt,
          publishedAt: story.publishedAt || undefined
        };
      });
    } catch (error) {
      console.error('Error searching local stories:', error);
      return [];
    }
  }

  /**
   * Search Airtable stories
   */
  private async searchAirtableStories(options: SearchOptions, viewer: any): Promise<SearchResult[]> {
    const { query, filters = {} } = options;
    
    if (filters.source === 'local') {
      return [];
    }

    try {
      const params = new URLSearchParams({ search: query });
      
      if (filters.tags?.length) {
        params.append('tags', filters.tags.join(','));
      }

      const response = await fetch(`/api/airtable/search?${params}`, {
        headers: {
          'x-user-id': viewer?.id || '',
          'x-user-role': viewer?.role || '',
          'x-organization-id': viewer?.organizationId || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search Airtable stories');
      }

      const data = await response.json();

      return data.results.map((story: any) => {
        const excerpt = this.generateExcerpt(story.fields.Content || '', query);
        const highlights = this.generateHighlights(
          {
            title: story.fields.Title,
            content: story.fields.Content
          },
          query,
          story.fields.Tags || []
        );
        const matchScore = this.calculateMatchScore(
          {
            title: story.fields.Title,
            content: story.fields.Content
          },
          query,
          story.fields.Tags || []
        );

        return {
          id: `airtable_${story.id}`,
          title: story.fields.Title || 'Untitled',
          content: story.fields.Content || '',
          excerpt,
          highlights,
          matchScore,
          source: 'airtable' as const,
          storyType: story.fields.Type || 'reflection',
          visibility: story.fields.Visibility || 'public',
          author: {
            name: story.fields.AuthorName || 'Community Member'
          },
          tags: story.fields.Tags || [],
          createdAt: new Date(story.createdTime),
          publishedAt: story.fields.PublishedDate ? new Date(story.fields.PublishedDate) : undefined
        };
      });
    } catch (error) {
      console.error('Error searching Airtable stories:', error);
      return [];
    }
  }

  /**
   * Generate excerpt with query highlights
   */
  private generateExcerpt(content: string, query: string, maxLength: number = 200): string {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    const queryLower = query.toLowerCase();
    const textLower = plainText.toLowerCase();
    
    // Find the first occurrence of the query
    const queryIndex = textLower.indexOf(queryLower);
    
    if (queryIndex === -1) {
      // Query not found in content, return beginning
      return plainText.length > maxLength 
        ? plainText.substring(0, maxLength) + '...'
        : plainText;
    }

    // Calculate excerpt boundaries
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(plainText.length, queryIndex + query.length + 150);
    
    let excerpt = plainText.substring(start, end);
    
    // Add ellipsis if needed
    if (start > 0) excerpt = '...' + excerpt;
    if (end < plainText.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  /**
   * Generate highlights for search results
   */
  private generateHighlights(story: any, query: string, tags: string[]): any {
    const queryLower = query.toLowerCase();
    const highlights: any = {};

    // Highlight title
    if (story.title?.toLowerCase().includes(queryLower)) {
      highlights.title = this.highlightText(story.title, query);
    }

    // Highlight content snippets
    if (story.content) {
      const contentHighlights = this.findContentHighlights(story.content, query);
      if (contentHighlights.length > 0) {
        highlights.content = contentHighlights;
      }
    }

    // Highlight matching tags
    const matchingTags = tags.filter(tag => 
      tag.toLowerCase().includes(queryLower)
    );
    if (matchingTags.length > 0) {
      highlights.tags = matchingTags;
    }

    return highlights;
  }

  /**
   * Highlight text with search query
   */
  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Find content highlights
   */
  private findContentHighlights(content: string, query: string, maxHighlights: number = 3): string[] {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    const sentences = plainText.split(/[.!?]+/);
    const queryLower = query.toLowerCase();
    
    const highlights: string[] = [];
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(queryLower) && highlights.length < maxHighlights) {
        highlights.push(this.highlightText(sentence.trim(), query));
      }
    }
    
    return highlights;
  }

  /**
   * Calculate match score for ranking
   */
  private calculateMatchScore(story: any, query: string, tags: string[]): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (story.title?.toLowerCase().includes(queryLower)) {
      score += 10;
      // Exact match bonus
      if (story.title.toLowerCase() === queryLower) {
        score += 5;
      }
    }

    // Content match
    if (story.content) {
      const contentLower = story.content.toLowerCase();
      const matches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
      score += Math.min(matches * 2, 10);
    }

    // Tag match
    tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 3;
      }
    });

    // Recency boost
    if (story.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) score += 2;
      else if (daysSinceCreation < 30) score += 1;
    }

    return score;
  }

  /**
   * Rank results by relevance
   */
  private rankResults(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Generate search facets
   */
  private generateFacets(results: SearchResult[]): any {
    const storyTypes: Record<string, number> = {};
    const tags: Record<string, number> = {};
    const authors: Record<string, number> = {};

    results.forEach(result => {
      // Story types
      storyTypes[result.storyType] = (storyTypes[result.storyType] || 0) + 1;

      // Tags
      result.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });

      // Authors
      if (result.author?.name) {
        authors[result.author.name] = (authors[result.author.name] || 0) + 1;
      }
    });

    return {
      storyTypes: Object.entries(storyTypes)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      tags: Object.entries(tags)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      authors: Object.entries(authors)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    };
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string, results: SearchResult[]): Promise<string[]> {
    const suggestions = new Set<string>();

    // Add related tags as suggestions
    results.forEach(result => {
      result.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    // Add story type suggestions
    const storyTypes = ['reflection', 'milestone', 'challenge', 'achievement', 'goal', 'update'];
    storyTypes.forEach(type => {
      if (type.includes(query.toLowerCase()) && type !== query.toLowerCase()) {
        suggestions.add(type);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Get trending search terms
   */
  async getTrendingSearches(limit: number = 10): Promise<string[]> {
    // This would typically fetch from a search analytics table
    // For now, return static trending terms
    return [
      'resilience',
      'mental health',
      'career goals',
      'education',
      'community',
      'leadership',
      'overcoming challenges',
      'success story',
      'mentorship',
      'growth'
    ].slice(0, limit);
  }
}

export const searchService = new SearchService();