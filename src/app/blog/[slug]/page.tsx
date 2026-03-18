import { Navigation, Footer } from '@/components/ui/navigation';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchContentHubArticleBySlug } from '@/lib/empathy-ledger-content-hub';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Slugify a title for URL matching.
 * "Why Australia's Youth Justice System Is Failing — And What..." →
 * "why-australias-youth-justice-system-is-failing-and-what-..."
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Fetch a synced EL story by slug match (fallback for content hub).
 * Matches against a slugified version of the story title.
 */
async function fetchSyncedStoryBySlug(slug: string) {
  try {
    const supabase = createServiceClient();

    // First try exact slug match (EL articles have stored slugs)
    const { data: exactMatch } = await (supabase as any)
      .from('synced_stories')
      .select('id, empathy_ledger_id, title, summary, content, story_image_url, story_type, story_category, themes, is_featured, source_published_at, project_slugs, slug')
      .eq('source', 'empathy_ledger')
      .eq('slug', slug)
      .maybeSingle();

    if (exactMatch) {
      const match = exactMatch;
      return {
        id: match.id,
        title: match.title,
        slug,
        excerpt: match.summary,
        content: match.content,
        authorName: 'JusticeHub',
        publishedAt: match.source_published_at,
        tags: match.themes || [],
        featuredImageUrl: match.story_image_url,
        metaTitle: match.title,
        metaDescription: match.summary,
        source: 'synced_story' as const,
        projectSlugs: match.project_slugs || [],
      };
    }

    // Fallback: match by slugified title
    const { data: stories } = await (supabase as any)
      .from('synced_stories')
      .select('id, empathy_ledger_id, title, summary, content, story_image_url, story_type, story_category, themes, is_featured, source_published_at, project_slugs')
      .eq('source', 'empathy_ledger')
      .order('source_published_at', { ascending: false })
      .limit(100);

    if (!stories) return null;

    const match = stories.find((s: any) => slugify(s.title || '') === slug);
    if (!match) return null;

    // Normalise to same shape as content hub articles
    return {
      id: match.id,
      title: match.title,
      slug,
      excerpt: match.summary,
      content: match.content,
      authorName: 'JusticeHub',
      publishedAt: match.source_published_at,
      tags: match.themes || [],
      featuredImageUrl: match.story_image_url,
      metaTitle: match.title,
      metaDescription: match.summary,
      source: 'synced_story' as const,
      projectSlugs: match.project_slugs || [],
    };
  } catch (err) {
    console.error('Synced story lookup error:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await fetchContentHubArticleBySlug(params.slug)
    || await fetchSyncedStoryBySlug(params.slug);

  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
      type: 'article',
      url: `https://justicehub.com.au/blog/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchContentHubArticleBySlug(params.slug)
    || await fetchSyncedStoryBySlug(params.slug);

  if (!post) notFound();

  const content = post.content || '';
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  // Check if this is a Contained-linked article
  const isContained = (post as any).projectSlugs?.includes('the-contained')
    || (post as any).tags?.includes('contained');

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <article className="header-offset">
        {/* Hero Section */}
        <div className="bg-black text-white py-16">
          <div className="container-justice max-w-4xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 text-sm font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs font-bold px-3 py-1 bg-white/10 border border-white/30 text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString('en-AU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Draft'}
                </span>
              </div>

              {post.authorName && (
                <div className="flex items-center gap-2 text-sm font-bold">
                  <User className="w-4 h-4" />
                  {post.authorName}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Share2 className="w-4 h-4" />
                Share
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImageUrl && (
          <div className="container-justice max-w-5xl my-12">
            <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src={post.featuredImageUrl}
                alt={post.title}
                width={1200}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container-justice max-w-4xl py-12">
          <div className="prose prose-lg max-w-none">
            {content ? (
              looksLikeHtml ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h2 className="text-4xl font-black text-black mt-12 mb-6" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h3 className="text-3xl font-black text-black mt-10 mb-5" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h4 className="text-2xl font-bold text-black mt-8 mb-4" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-lg text-gray-800 leading-relaxed mb-6" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a className="text-red-600 font-bold hover:underline" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside space-y-2 mb-6 text-lg" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside space-y-2 mb-6 text-lg" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-black pl-6 py-4 my-8 bg-gray-50 italic text-xl font-medium" {...props} />
                    ),
                    code: ({ node, inline, ...props }: any) =>
                      inline ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props} />
                      ) : (
                        <code className="block bg-black text-white p-6 rounded my-6 overflow-x-auto font-mono text-sm" {...props} />
                      ),
                    hr: () => <hr className="my-12 border-t-2 border-black" />,
                    img: ({ node, ...props }) => (
                      <div className="my-8">
                        <img className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" {...props} />
                      </div>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              )
            ) : (
              <p>No content available.</p>
            )}
          </div>

          {/* Contained CTA */}
          {isContained && (
            <div className="mt-16 p-8 bg-black text-white border-2 border-black">
              <h3 className="text-2xl font-black mb-4 text-white">Experience Contained</h3>
              <p className="text-gray-300 mb-6 text-lg">
                A 30-minute, three-room installation that closes the gap between evidence and public understanding.
              </p>
              <Link
                href="/contained"
                className="inline-block bg-red-600 text-white font-black px-8 py-3 text-lg hover:bg-red-700 transition-colors"
              >
                Learn More
              </Link>
            </div>
          )}
        </div>

      </article>

      <Footer />
    </div>
  );
}
