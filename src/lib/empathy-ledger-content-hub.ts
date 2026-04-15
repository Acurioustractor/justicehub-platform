import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';

type ContentHubArticle = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  excerpt?: string | null;
  authorName?: string | null;
  articleType?: string | null;
  primaryProject?: string | null;
  publishedAt?: string | null;
  tags?: string[];
  themes?: string[];
  visibility?: string;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
};

type ContentHubArticleDetail = ContentHubArticle & {
  content?: string | null;
  authorBio?: string | null;
  relatedProjects?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const EL_STORAGE_BASE =
  'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public';

/**
 * Resolve a featured_image_id (UUID) to its real CDN URL via media_assets.
 * The id on `articles.featured_image_id` is a FK to `media_assets.id`;
 * the public URL lives in `media_assets.cdn_url` (or bucket + path).
 * Returns null if the id is missing, the lookup fails, or the asset has no URL.
 */
async function resolveMediaAssetUrl(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) return null;
  try {
    const { data, error } = await empathyLedgerServiceClient
      .from('media_assets')
      .select('cdn_url, storage_bucket, storage_path')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    if (data.cdn_url) return data.cdn_url;
    if (data.storage_bucket && data.storage_path) {
      return `${EL_STORAGE_BASE}/${data.storage_bucket}/${data.storage_path}`;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveMediaAssetUrls(ids: string[]): Promise<Record<string, string | null>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length || !isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) return {};
  try {
    const { data, error } = await empathyLedgerServiceClient
      .from('media_assets')
      .select('id, cdn_url, storage_bucket, storage_path')
      .in('id', unique);
    if (error || !data) return {};
    return Object.fromEntries(
      data.map((row: any) => [
        row.id,
        row.cdn_url ||
          (row.storage_bucket && row.storage_path
            ? `${EL_STORAGE_BASE}/${row.storage_bucket}/${row.storage_path}`
            : null),
      ])
    );
  } catch {
    return {};
  }
}

export async function fetchContentHubArticles(params: {
  project?: string;
  limit?: number;
}): Promise<ContentHubArticle[]> {
  try {
    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return [];
    }

    let query = empathyLedgerServiceClient
      .from('articles')
      .select('id, title, slug, subtitle, excerpt, author_name, article_type, primary_project, published_at, tags, themes, visibility, featured_image_id')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(params.limit || 20);

    if (params.project) {
      query = query.eq('primary_project', params.project);
    }

    const { data, error } = await query;

    if (error) {
      console.error('EL content hub query error:', error.message);
      return [];
    }

    const rows = data || [];
    const mediaMap = await resolveMediaAssetUrls(
      rows.map((a: any) => a.featured_image_id).filter(Boolean)
    );

    return rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      subtitle: a.subtitle,
      excerpt: a.excerpt,
      authorName: a.author_name,
      articleType: a.article_type,
      primaryProject: a.primary_project,
      publishedAt: a.published_at,
      tags: a.tags || [],
      themes: a.themes || [],
      visibility: a.visibility,
      featuredImageUrl: a.featured_image_id ? mediaMap[a.featured_image_id] || null : null,
      featuredImageAlt: a.title,
    }));
  } catch (error) {
    console.error('Failed to fetch content hub articles:', error);
    return [];
  }
}

export async function fetchContentHubArticleBySlug(
  slug: string
): Promise<ContentHubArticleDetail | null> {
  try {
    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return null;
    }

    const { data, error } = await empathyLedgerServiceClient
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .maybeSingle();

    if (error) {
      console.error('EL content hub article query error:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      content: data.content,
      authorName: data.author_name,
      authorBio: data.author_bio,
      articleType: data.article_type,
      primaryProject: data.primary_project,
      relatedProjects: data.related_projects || [],
      publishedAt: data.published_at,
      tags: data.tags || [],
      themes: data.themes || [],
      visibility: data.visibility,
      featuredImageUrl: await resolveMediaAssetUrl(data.featured_image_id),
      featuredImageAlt: data.title,
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
    };
  } catch (error) {
    console.error('Failed to fetch content hub article:', error);
    return null;
  }
}
