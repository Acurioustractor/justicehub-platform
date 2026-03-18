/**
 * CONTAINED Campaign — Unified Media Hub
 *
 * Single entry point for ALL campaign content across sources:
 * - Empathy Ledger: articles, stories, photos, galleries, storytellers
 * - JusticeHub: ALMA media articles, ALMA stories
 * - Local: campaign assets in /public/images/contained/
 *
 * Usage:
 *   const media = await getContainedMedia({ types: ['articles', 'photos', 'stories'] });
 *   const all = await getContainedMedia(); // everything
 */

import { createClient } from '@/lib/supabase/server-lite';
import {
  fetchContentHubArticles,
} from '@/lib/empathy-ledger-content-hub';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MediaSource = 'el-article' | 'el-story' | 'el-photo' | 'el-gallery' | 'alma-media' | 'alma-story' | 'tour-submission' | 'local-asset';

export type MediaType = 'article' | 'story' | 'photo' | 'video' | 'gallery' | 'asset';

export interface UnifiedMediaItem {
  id: string;
  type: MediaType;
  source: MediaSource;
  title: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  tags?: string[];
  slug?: string | null;
  url?: string | null;
  isFeatured?: boolean;
}

export interface ContainedMediaOptions {
  types?: MediaType[];
  limit?: number;
  search?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EL_STORAGE_BASE =
  'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public';

const EL_PHOTO_CATEGORIES = [
  'spain', 'programs', 'places', 'people', 'data',
  'community', 'contained', 'hero', 'goods',
] as const;

const LOCAL_CAMPAIGN_ASSETS = [
  { file: 'logo-contained-square.png', label: 'CONTAINED Logo' },
  { file: 'poster-tour.png', label: 'Tour Poster' },
  { file: 'poster-brand.png', label: 'Brand Poster' },
  { file: 'social-stat-cost.png', label: 'Stat: Cost of Detention' },
  { file: 'social-stat-ratio.png', label: 'Stat: Funding Ratio' },
  { file: 'stat-155m.png', label: 'Stat: $1.55M' },
  { file: 'stat-comparison.png', label: 'Stat: Cost Comparison' },
  // bespoke-chalk-question.png ARCHIVED — too AI-looking
  { file: 'bespoke-data-viz.png', label: 'Data Comparison Bars' },
  { file: 'contained-brand-square.png', label: 'Brand Square' },
  { file: 'justicehub-hero-landscape.png', label: 'JusticeHub Hero' },
  { file: 'contained-story.png', label: 'Story Graphic' },
  { file: 'tour-mount-druitt.png', label: 'Mount Druitt Tour Stop' },
] as const;

// ─── Fetchers ───────────────────────────────────────────────────────────────

/** Fetch published articles from Empathy Ledger content hub */
async function fetchELArticles(limit: number): Promise<UnifiedMediaItem[]> {
  const articles = await fetchContentHubArticles({ project: 'the-contained', limit });
  return articles.map(a => ({
    id: `el-article-${a.id}`,
    type: 'article' as const,
    source: 'el-article' as const,
    title: a.title,
    excerpt: a.excerpt,
    imageUrl: a.featuredImageUrl,
    author: a.authorName,
    publishedAt: a.publishedAt,
    tags: [...(a.tags || []), ...(a.themes || [])],
    slug: a.slug,
    url: a.slug ? `/blog/${a.slug}` : null,
  }));
}

/** Fetch public stories from Empathy Ledger */
async function fetchELStories(limit: number): Promise<UnifiedMediaItem[]> {
  if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) return [];

  const { data, error } = await empathyLedgerServiceClient
    .from('stories')
    .select('id, title, summary, story_image_url, story_type, themes, tags, published_at, storyteller_id')
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(s => ({
    id: `el-story-${s.id}`,
    type: 'story' as const,
    source: 'el-story' as const,
    title: s.title || 'Untitled Story',
    excerpt: s.summary,
    imageUrl: s.story_image_url,
    publishedAt: s.published_at,
    tags: [...(s.themes || []), ...(s.tags || [])],
  }));
}

/** Fetch gallery photo listings from EL storage */
async function fetchELPhotos(limit: number): Promise<UnifiedMediaItem[]> {
  if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) return [];

  const photos: UnifiedMediaItem[] = [];

  for (const category of EL_PHOTO_CATEGORIES) {
    if (photos.length >= limit) break;
    // Skip 'contained' category — those are duplicates of local assets
    if (category === 'contained') continue;

    const { data } = await empathyLedgerServiceClient.storage
      .from('gallery-photos')
      .list(`justicehub/${category}`, {
        limit: Math.min(20, limit - photos.length),
        sortBy: { column: 'name', order: 'asc' },
      });

    if (data) {
      for (const item of data) {
        if (!item.metadata) continue; // skip folders
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) continue;

        photos.push({
          id: `el-photo-${category}-${item.name}`,
          type: 'photo' as const,
          source: 'el-photo' as const,
          title: item.name.replace(/[-_]/g, ' ').replace(/\.\w+$/, ''),
          imageUrl: `${EL_STORAGE_BASE}/gallery-photos/justicehub/${category}/${item.name}`,
          tags: [category],
        });
      }
    }
  }

  return photos.slice(0, limit);
}

/** Fetch ALMA media articles from JusticeHub Supabase */
async function fetchALMAMedia(limit: number): Promise<UnifiedMediaItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('alma_media_articles')
    .select('id, headline, source_name, url, published_date, sentiment, summary, topics')
    .order('published_date', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(m => ({
    id: `alma-media-${m.id}`,
    type: 'article' as const,
    source: 'alma-media' as const,
    title: m.headline || 'Untitled',
    excerpt: m.summary,
    author: m.source_name,
    publishedAt: m.published_date,
    url: m.url,
    tags: [m.sentiment, ...(m.topics || [])].filter(Boolean) as string[],
  }));
}

/** Fetch ALMA stories (case studies + community voices) from JusticeHub Supabase */
async function fetchALMAStories(limit: number): Promise<UnifiedMediaItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('alma_stories')
    .select('id, title, summary, story_type, media_urls, featured, published_at')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(s => {
    // Extract first image from media_urls jsonb if available
    const mediaUrls = s.media_urls as Record<string, string>[] | null;
    const firstImage = Array.isArray(mediaUrls)
      ? mediaUrls.find((m: any) => m?.url)?.url
      : null;

    return {
      id: `alma-story-${s.id}`,
      type: 'story' as const,
      source: 'alma-story' as const,
      title: s.title || 'Untitled',
      excerpt: s.summary,
      imageUrl: firstImage,
      publishedAt: s.published_at,
      tags: [s.story_type].filter(Boolean) as string[],
      isFeatured: s.featured || false,
    };
  });
}

/** Get local campaign assets as media items */
function getLocalAssets(): UnifiedMediaItem[] {
  return LOCAL_CAMPAIGN_ASSETS.map(a => ({
    id: `local-${a.file}`,
    type: 'asset' as const,
    source: 'local-asset' as const,
    title: a.label,
    imageUrl: `/images/contained/${a.file}`,
  }));
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Fetch all campaign media from all sources, unified into a single array.
 *
 * @param options.types - Filter by media type (article, story, photo, video, gallery, asset)
 * @param options.limit - Max items per source (default 20)
 * @param options.search - Text search (applied where supported)
 */
export async function getContainedMedia(
  options: ContainedMediaOptions = {}
): Promise<UnifiedMediaItem[]> {
  const { types, limit = 20, search } = options;
  const wantAll = !types || types.length === 0;

  const fetchers: Promise<UnifiedMediaItem[]>[] = [];

  if (wantAll || types?.includes('article')) {
    fetchers.push(fetchELArticles(limit));
    fetchers.push(fetchALMAMedia(limit));
  }

  if (wantAll || types?.includes('story')) {
    fetchers.push(fetchELStories(limit));
    fetchers.push(fetchALMAStories(limit));
  }

  if (wantAll || types?.includes('photo')) {
    fetchers.push(fetchELPhotos(limit));
  }

  if (wantAll || types?.includes('asset')) {
    fetchers.push(Promise.resolve(getLocalAssets()));
  }

  const results = await Promise.all(fetchers);
  let items = results.flat();

  // Apply text search if provided
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.excerpt?.toLowerCase().includes(q) ||
        item.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort: items with publishedAt by date, then items without
  items.sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    if (a.publishedAt) return -1;
    if (b.publishedAt) return 1;
    return 0;
  });

  return items;
}

/**
 * Get EL photo categories and their base URLs for direct use in components.
 */
export function getELPhotoCategories() {
  return EL_PHOTO_CATEGORIES.filter(c => c !== 'contained').map(category => ({
    category,
    baseUrl: `${EL_STORAGE_BASE}/gallery-photos/justicehub/${category}`,
  }));
}
