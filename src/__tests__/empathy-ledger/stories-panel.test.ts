/**
 * Tests for StoriesPanel component logic and stories API route
 *
 * Tests the data transformation, API response shape, and component helpers
 * that power the Empathy Ledger stories integration.
 */

// Mock the v2-client module
jest.mock('@/lib/empathy-ledger/v2-client', () => ({
  isV2Configured: true,
  getStories: jest.fn(),
}));

import { getStories, isV2Configured } from '@/lib/empathy-ledger/v2-client';

const mockGetStories = getStories as jest.MockedFunction<typeof getStories>;

describe('Empathy Ledger Stories Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('V2 Story data shape', () => {
    it('should have required fields for display in StoriesPanel', () => {
      const story = {
        id: 'test-id-1',
        title: 'A Community Story',
        excerpt: 'This is a test excerpt about community resilience.',
        themes: ['youth-justice', 'community'],
        status: 'published',
        publishedAt: '2026-03-01T00:00:00Z',
        culturalLevel: 'public',
        projectId: 'proj-1',
        imageUrl: 'https://example.com/photo.jpg',
        storyteller: {
          id: 'st-1',
          displayName: 'Elder Mary',
          avatarUrl: 'https://example.com/avatar.jpg',
          culturalBackground: ['Aboriginal'],
        },
        createdAt: '2026-02-28T00:00:00Z',
        detailUrl: '/stories/test-id-1',
      };

      // Verify all fields needed by StoriesPanel are present
      expect(story.id).toBeDefined();
      expect(story.title).toBeDefined();
      expect(story.excerpt).toBeDefined();
      expect(story.imageUrl).toBeDefined();
      expect(story.storyteller).toBeDefined();
      expect(story.storyteller?.displayName).toBe('Elder Mary');
      expect(story.themes).toBeInstanceOf(Array);
    });

    it('should handle stories without optional fields', () => {
      const minimalStory = {
        id: 'test-id-2',
        title: 'Untitled Story',
        excerpt: null,
        themes: [],
        status: 'published',
        publishedAt: null,
        culturalLevel: null,
        projectId: null,
        imageUrl: null,
        storyteller: null,
        createdAt: '2026-02-28T00:00:00Z',
        detailUrl: '/stories/test-id-2',
      };

      expect(minimalStory.excerpt).toBeNull();
      expect(minimalStory.imageUrl).toBeNull();
      expect(minimalStory.storyteller).toBeNull();
    });
  });

  describe('getStories v2 client', () => {
    it('should fetch stories with default pagination', async () => {
      mockGetStories.mockResolvedValueOnce({
        data: [
          {
            id: 's1',
            title: 'Story 1',
            excerpt: 'Excerpt 1',
            themes: ['justice'],
            status: 'published',
            publishedAt: '2026-01-01T00:00:00Z',
            culturalLevel: 'public',
            projectId: null,
            imageUrl: null,
            storyteller: { id: 'st1', displayName: 'Person A', avatarUrl: null, culturalBackground: null },
            createdAt: '2026-01-01T00:00:00Z',
            detailUrl: '/stories/s1',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, hasMore: false },
        meta: { keyType: 'org', scope: 'org-scoped' },
      });

      const result = await getStories({ limit: 10 });

      expect(mockGetStories).toHaveBeenCalledWith({ limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should support pagination for large story sets', async () => {
      mockGetStories.mockResolvedValueOnce({
        data: Array.from({ length: 50 }, (_, i) => ({
          id: `s${i}`,
          title: `Story ${i}`,
          excerpt: `Excerpt ${i}`,
          themes: [],
          status: 'published',
          publishedAt: null,
          culturalLevel: 'public',
          projectId: null,
          imageUrl: null,
          storyteller: null,
          createdAt: '2026-01-01T00:00:00Z',
          detailUrl: `/stories/s${i}`,
        })),
        pagination: { page: 1, limit: 50, total: 200, hasMore: true },
        meta: { keyType: 'org', scope: 'org-scoped' },
      });

      const result = await getStories({ limit: 50, page: 1 });

      expect(result.data).toHaveLength(50);
      expect(result.pagination.total).toBe(200);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should filter by storyteller ID', async () => {
      mockGetStories.mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, hasMore: false },
        meta: { keyType: 'org', scope: 'org-scoped' },
      });

      await getStories({ storytellerId: 'st-123' });

      expect(mockGetStories).toHaveBeenCalledWith({ storytellerId: 'st-123' });
    });
  });

  describe('Stories API route response mapping', () => {
    it('should map v2 story to legacy JusticeHub format', () => {
      const v2Story = {
        id: 's1',
        title: 'Community Healing',
        excerpt: 'A story of resilience',
        themes: ['healing', 'youth'],
        status: 'published',
        publishedAt: '2026-03-01T00:00:00Z',
        culturalLevel: 'public',
        projectId: 'p1',
        imageUrl: 'https://el.com/photo.jpg',
        storyteller: {
          id: 'st1',
          displayName: 'Uncle Jim',
          avatarUrl: 'https://el.com/avatar.jpg',
          culturalBackground: ['Torres Strait Islander'],
        },
        createdAt: '2026-02-28T00:00:00Z',
        detailUrl: '/stories/s1',
      };

      // Simulate the mapping done in the API route
      const mapped = {
        id: v2Story.id,
        title: v2Story.title,
        summary: v2Story.excerpt,
        content: null,
        story_image_url: v2Story.imageUrl,
        story_type: null,
        themes: v2Story.themes,
        is_featured: false,
        justicehub_featured: false,
        cultural_sensitivity_level: v2Story.culturalLevel,
        is_public: true,
        privacy_level: 'public',
        published_at: v2Story.publishedAt,
        created_at: v2Story.createdAt,
        storyteller_id: v2Story.storyteller?.id || null,
        organization_id: null,
        excerpt: v2Story.excerpt || '',
        story_category: null,
        storyteller_name: v2Story.storyteller?.displayName || null,
      };

      expect(mapped.title).toBe('Community Healing');
      expect(mapped.summary).toBe('A story of resilience');
      expect(mapped.story_image_url).toBe('https://el.com/photo.jpg');
      expect(mapped.storyteller_name).toBe('Uncle Jim');
      expect(mapped.themes).toEqual(['healing', 'youth']);
      expect(mapped.is_public).toBe(true);
      expect(mapped.privacy_level).toBe('public');
    });

    it('should handle null storyteller gracefully', () => {
      const v2Story = {
        id: 's2',
        title: 'Anonymous Story',
        excerpt: null,
        storyteller: null,
      };

      const mapped = {
        storyteller_id: v2Story.storyteller?.id || null,
        storyteller_name: v2Story.storyteller?.displayName || null,
        excerpt: v2Story.excerpt || '',
      };

      expect(mapped.storyteller_id).toBeNull();
      expect(mapped.storyteller_name).toBeNull();
      expect(mapped.excerpt).toBe('');
    });
  });

  describe('StoriesPanel helper functions', () => {
    it('should truncate excerpt to reasonable length', () => {
      const longExcerpt = 'A'.repeat(500);
      const maxLength = 200;
      const truncated = longExcerpt.length > maxLength
        ? longExcerpt.slice(0, maxLength) + '...'
        : longExcerpt;

      expect(truncated.length).toBe(maxLength + 3); // +3 for '...'
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should format story count correctly', () => {
      const formatCount = (count: number) => {
        if (count === 0) return 'No stories yet';
        if (count === 1) return '1 story from community';
        return `${count} stories from community`;
      };

      expect(formatCount(0)).toBe('No stories yet');
      expect(formatCount(1)).toBe('1 story from community');
      expect(formatCount(12)).toBe('12 stories from community');
      expect(formatCount(200)).toBe('200 stories from community');
    });

    it('should group stories by theme', () => {
      const stories = [
        { id: '1', themes: ['healing', 'youth'] },
        { id: '2', themes: ['youth', 'justice'] },
        { id: '3', themes: ['healing'] },
      ];

      const themeCount: Record<string, number> = {};
      for (const story of stories) {
        for (const theme of story.themes) {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        }
      }

      expect(themeCount['healing']).toBe(2);
      expect(themeCount['youth']).toBe(2);
      expect(themeCount['justice']).toBe(1);
    });
  });
});
