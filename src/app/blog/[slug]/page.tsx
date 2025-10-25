import { createClient } from '@/lib/supabase/server';
import { Navigation, Footer } from '@/components/ui/navigation';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, meta_title, meta_description, featured_image_url')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) return {};

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  // Fetch the blog post
  const { data: post } = await supabase
    .from('blog_posts')
    .select(`
      *,
      public_profiles!blog_posts_author_id_fkey(full_name, slug, photo_url, bio, role_tags)
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) notFound();

  // Increment view count
  await supabase
    .from('blog_posts')
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq('id', post.id);

  // Fetch linked content
  const { data: links } = await supabase
    .from('blog_content_links')
    .select(`
      *,
      public_profiles(full_name, slug, photo_url),
      community_programs(name, slug),
      services(name, slug),
      art_innovation(title, slug)
    `)
    .eq('blog_post_id', post.id);

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
                  {new Date(post.published_at).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {post.public_profiles && (
                <Link
                  href={`/people/${post.public_profiles.slug}`}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  {post.public_profiles.photo_url && (
                    <Image
                      src={post.public_profiles.photo_url}
                      alt={post.public_profiles.full_name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  )}
                  <span className="text-sm font-bold">
                    {post.public_profiles.full_name}
                  </span>
                </Link>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Share2 className="w-4 h-4" />
                {post.view_count || 0} views
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="container-justice max-w-5xl my-12">
            <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Image
                src={post.featured_image_url}
                alt={post.title}
                width={1200}
                height={600}
                className="w-full h-auto"
              />
              {post.featured_image_caption && (
                <div className="px-6 py-3 bg-gray-100 border-t-2 border-black">
                  <p className="text-sm text-gray-700 italic">
                    {post.featured_image_caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container-justice max-w-4xl py-12">
          <div className="prose prose-lg max-w-none">
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
              {post.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Linked Content Section */}
        {links && links.length > 0 && (
          <div className="bg-gray-50 py-16 border-t-2 border-black">
            <div className="container-justice max-w-4xl">
              <h2 className="text-3xl font-black text-black mb-8">
                Related Content
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {links.map((link: any) => (
                  <div
                    key={link.id}
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
                  >
                    {link.link_type === 'profile' && link.public_profiles && (
                      <Link href={`/people/${link.public_profiles.slug}`} className="group">
                        <div className="flex items-center gap-4">
                          {link.public_profiles.photo_url && (
                            <Image
                              src={link.public_profiles.photo_url}
                              alt={link.public_profiles.full_name}
                              width={60}
                              height={60}
                              className="w-15 h-15 rounded-full border-2 border-black"
                            />
                          )}
                          <div>
                            <p className="text-xs font-bold text-gray-500 mb-1">PERSON</p>
                            <p className="font-bold text-black group-hover:text-red-600 transition-colors">
                              {link.public_profiles.full_name}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {link.link_type === 'program' && link.community_programs && (
                      <Link href={`/community-programs/${link.community_programs.slug}`} className="group">
                        <p className="text-xs font-bold text-gray-500 mb-1">PROGRAM</p>
                        <p className="font-bold text-black group-hover:text-red-600 transition-colors">
                          {link.community_programs.name}
                        </p>
                      </Link>
                    )}

                    {link.link_type === 'art' && link.art_innovation && (
                      <Link href={`/art-innovation/${link.art_innovation.slug}`} className="group">
                        <p className="text-xs font-bold text-gray-500 mb-1">ART PROJECT</p>
                        <p className="font-bold text-black group-hover:text-red-600 transition-colors">
                          {link.art_innovation.title}
                        </p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Author Bio */}
        {post.public_profiles && (
          <div className="container-justice max-w-4xl py-16 border-t-2 border-black">
            <h3 className="text-2xl font-black text-black mb-6">About the Author</h3>

            <Link
              href={`/people/${post.public_profiles.slug}`}
              className="flex items-start gap-6 p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              {post.public_profiles.photo_url && (
                <Image
                  src={post.public_profiles.photo_url}
                  alt={post.public_profiles.full_name}
                  width={100}
                  height={100}
                  className="w-25 h-25 rounded-full border-2 border-black"
                />
              )}

              <div className="flex-1">
                <h4 className="text-xl font-black text-black mb-2">
                  {post.public_profiles.full_name}
                </h4>

                {post.public_profiles.role_tags && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.public_profiles.role_tags.slice(0, 3).map((role: string) => (
                      <span
                        key={role}
                        className="text-xs font-bold px-2 py-1 bg-gray-100 border border-black"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}

                {post.public_profiles.bio && (
                  <p className="text-gray-700 leading-relaxed">
                    {post.public_profiles.bio}
                  </p>
                )}

                <p className="mt-4 text-sm font-bold text-red-600 hover:underline">
                  View Profile →
                </p>
              </div>
            </Link>
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
}
