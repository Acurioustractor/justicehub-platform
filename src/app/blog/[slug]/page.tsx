import { Navigation, Footer } from '@/components/ui/navigation';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchContentHubArticleBySlug } from '@/lib/empathy-ledger-content-hub';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await fetchContentHubArticleBySlug(params.slug);

  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchContentHubArticleBySlug(params.slug);

  if (!post) notFound();

  const content = post.content || '';
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);

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
        </div>

      </article>

      <Footer />
    </div>
  );
}
