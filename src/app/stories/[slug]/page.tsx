import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const categories = {
  seeds: { emoji: '🌱', label: 'Seeds', color: 'bg-green-100 text-green-800' },
  growth: { emoji: '🌿', label: 'Growth', color: 'bg-emerald-100 text-emerald-800' },
  harvest: { emoji: '🌾', label: 'Harvest', color: 'bg-amber-100 text-amber-800' },
  roots: { emoji: '🌳', label: 'Roots', color: 'bg-amber-100 text-amber-900' },
};

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('title, excerpt, seo_title, seo_description')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    return {
      title: 'Article Not Found | JusticeHub',
    };
  }

  return {
    title: article.seo_title || `${article.title} | JusticeHub`,
    description: article.seo_description || article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      authors (
        name,
        slug,
        bio,
        photo_url
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/stories"
            className="inline-flex items-center text-blue-600 hover:underline mb-8"
          >
            ← Back to Stories
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  categories[article.category as keyof typeof categories]?.color
                }`}
              >
                {categories[article.category as keyof typeof categories]?.emoji}
                {categories[article.category as keyof typeof categories]?.label}
              </span>
              {article.is_trending && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  🔥 Trending
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-200">
              {article.authors && (
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold">{article.authors.name}</p>
                    <p className="text-sm text-gray-500">Author</p>
                  </div>
                </div>
              )}
              {publishedDate && (
                <div>
                  <p className="font-semibold">{publishedDate}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
              )}
              {article.reading_time_minutes && (
                <div>
                  <p className="font-semibold">⏱️ {article.reading_time_minutes} min</p>
                  <p className="text-sm text-gray-500">Reading time</p>
                </div>
              )}
            </div>

            {article.location_tags && article.location_tags.length > 0 && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  📍 Locations featured in this story:
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.location_tags.map((location: string) => (
                    <span
                      key={location}
                      className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-lg prose-img:shadow-md prose-strong:text-gray-900 prose-em:text-gray-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Render images with proper styling and lazy loading
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      className="w-full h-auto rounded-lg shadow-lg my-6"
                      loading="lazy"
                      alt={props.alt || ''}
                    />
                  ),
                  // Render links to open in new tab
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    />
                  ),
                  // Style headings
                  h1: ({ node, ...props }) => (
                    <h1 {...props} className="text-3xl font-bold mt-8 mb-4" />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 {...props} className="text-2xl font-bold mt-6 mb-3" />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 {...props} className="text-xl font-bold mt-4 mb-2" />
                  ),
                  // Style paragraphs
                  p: ({ node, ...props }) => (
                    <p {...props} className="mb-4 leading-relaxed text-gray-700" />
                  ),
                  // Style lists
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc pl-6 mb-4 space-y-2" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal pl-6 mb-4 space-y-2" />
                  ),
                  // Style blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote {...props} className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600" />
                  ),
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>

            {article.authors?.bio && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold mb-4">About the Author</h3>
                <div className="flex gap-4">
                  <div>
                    <p className="font-semibold mb-2">{article.authors.name}</p>
                    <p className="text-gray-600">{article.authors.bio}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/stories"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read More Stories
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
