/**
 * Empathy Ledger Syndication API Client
 *
 * Fetches stories syndicated to JusticeHub via EL's consent-based syndication API.
 * Uses embed tokens for content access — respects storyteller consent.
 *
 * Env vars:
 *   EMPATHY_LEDGER_API_URL — Base URL (e.g. https://empathy-ledger-v2.vercel.app)
 *   EMPATHY_LEDGER_API_KEY — Syndication API key for JusticeHub site
 */

const API_URL = process.env.EMPATHY_LEDGER_API_URL || process.env.EMPATHY_LEDGER_V2_URL || '';
const API_KEY = process.env.EMPATHY_LEDGER_API_KEY || process.env.EMPATHY_LEDGER_V2_KEY || '';

export const isSyndicationConfigured = Boolean(API_URL && API_KEY);

export interface SyndicatedStory {
  id: string;
  title: string;
  excerpt: string | null;
  themes: string[];
  publishedAt: string | null;
  createdAt: string;
  culturalLevel: string | null;
  imageUrl: string | null;
  location: string | null;
  storyteller: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  consent: {
    id: string;
    status: string;
  };
  embedToken: string;
  contentUrl: string;
}

export interface SyndicatedStoryContent {
  html: string;
  wordCount: number | null;
  imageUrl: string | null;
  mediaUrls: string[];
}

/**
 * Fetch all stories syndicated to JusticeHub
 */
export async function fetchSyndicatedStories(): Promise<SyndicatedStory[]> {
  if (!isSyndicationConfigured) return [];

  try {
    const res = await fetch(`${API_URL}/api/syndication/justicehub/stories`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } as any,
    });

    if (!res.ok) {
      console.error(`EL syndication API error ${res.status}: ${await res.text()}`);
      return [];
    }

    const json = await res.json();
    return json.stories || json.data || [];
  } catch (err) {
    console.error('Failed to fetch syndicated stories:', err);
    return [];
  }
}

/**
 * Fetch articles from EL Content Hub API syndicated to JusticeHub
 * (Public API — no auth required, uses ?destination=act_jh)
 */
export interface ContentHubArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  authorName: string | null;
  articleType: string | null;
  publishedAt: string | null;
  tags: string[];
  themes: string[];
  syndicationDestinations: string[];
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
}

export async function fetchContentHubArticles(): Promise<ContentHubArticle[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(
      `${API_URL}/api/v1/content-hub/articles?destination=act_jh&limit=100`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 } as any,
      }
    );

    if (!res.ok) {
      console.error(`EL Content Hub articles error ${res.status}`);
      return [];
    }

    const json = await res.json();
    return json.articles || [];
  } catch (err) {
    console.error('Failed to fetch Content Hub articles:', err);
    return [];
  }
}

/**
 * Fetch full content for a syndicated story using its embed token
 */
export async function fetchSyndicatedStoryContent(
  storyId: string,
  embedToken: string
): Promise<SyndicatedStoryContent | null> {
  if (!isSyndicationConfigured) return null;

  try {
    const res = await fetch(
      `${API_URL}/api/syndication/content/${storyId}?token=${encodeURIComponent(embedToken)}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-API-Key': API_KEY,
          'Accept': 'application/json',
        },
        next: { revalidate: 60 } as any,
      }
    );

    if (!res.ok) {
      console.error(`EL syndication content error ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.content || json.data || json;
  } catch (err) {
    console.error('Failed to fetch syndicated story content:', err);
    return null;
  }
}
