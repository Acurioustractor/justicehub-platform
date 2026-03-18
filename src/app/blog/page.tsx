import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { fetchContentHubArticles } from '@/lib/empathy-ledger-content-hub';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchSyncedStories() {
  try {
    const supabase = createServiceClient();
    const { data } = await (supabase as any)
      .from('synced_stories')
      .select('id, title, summary, story_image_url, themes, is_featured, source_published_at, story_category, slug')
      .eq('source', 'empathy_ledger')
      .order('source_published_at', { ascending: false })
      .limit(60);

    return (data || []).map((s: any) => ({
      id: `synced-${s.id}`,
      title: s.title,
      slug: s.slug || slugify(s.title || ''),
      excerpt: s.summary,
      authorName: null,
      publishedAt: s.source_published_at,
      tags: Array.isArray(s.themes)
        ? s.themes.map((t: any) => typeof t === 'string' ? t : t?.name || '').filter(Boolean)
        : [],
      featuredImageUrl: s.story_image_url,
      source: 'synced' as const,
    }));
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Blog - JusticeHub',
  description: 'Stories, insights, and updates from the youth justice revolution',
  openGraph: {
    title: 'Blog - JusticeHub',
    description: 'Stories, insights, and updates from the youth justice revolution',
    type: 'website',
    images: ['/images/og/blog.png'],
  },
  alternates: {
    canonical: 'https://justicehub.com.au/blog',
  },
};

export default async function BlogPage() {
  const [contentHubPosts, syncedPosts] = await Promise.all([
    fetchContentHubArticles({ project: 'justicehub', limit: 60 }),
    fetchSyncedStories(),
  ]);

  // Merge and dedupe by title, sort by date descending
  const seen = new Set<string>();
  const posts = [...contentHubPosts, ...syncedPosts]
    .filter(p => {
      const key = p.title?.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="header-offset bg-black text-white py-20">
        <div className="container-justice">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-black mb-6 !text-white">
              Stories from the Movement
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Real stories, evidence-based insights, and updates from communities
              transforming youth justice across Australia.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="section-padding">
        <div className="container-justice">
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <article
                  key={post.id}
                  className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                >
                  {/* Featured Image */}
                  {post.featuredImageUrl && (
                    <div className="aspect-video border-b-2 border-black overflow-hidden">
                      <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs font-bold px-2 py-1 bg-gray-100 border border-black"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-2xl font-black text-black mb-3 line-clamp-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-red-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Draft'}
                      </div>
                      {post.authorName && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.authorName}
                        </div>
                      )}
                    </div>

                    {/* Read More */}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-black font-bold hover:text-red-600 transition-colors"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-3xl font-black text-black mb-4">
                No blog posts yet
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Check back soon for stories from the movement
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
