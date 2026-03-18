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

    return (data || []).map((a: any) => ({
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
      featuredImageUrl: a.featured_image_id
        ? `${EL_STORAGE_BASE}/media/${a.featured_image_id}`
        : null,
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
      featuredImageUrl: data.featured_image_id
        ? `${EL_STORAGE_BASE}/media/${data.featured_image_id}`
        : null,
      featuredImageAlt: data.title,
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
    };
  } catch (error) {
    console.error('Failed to fetch content hub article:', error);
    return null;
  }
}
