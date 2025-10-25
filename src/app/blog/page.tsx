import { createClient } from '@/lib/supabase/server';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Blog - JusticeHub',
  description: 'Stories, insights, and updates from the youth justice revolution',
};

export default async function BlogPage() {
  const supabase = await createClient();

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      public_profiles!blog_posts_author_id_fkey(full_name, slug, photo_url)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

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
                  {post.featured_image_url && (
                    <div className="aspect-video border-b-2 border-black overflow-hidden">
                      <Image
                        src={post.featured_image_url}
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
                        {new Date(post.published_at).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      {post.public_profiles && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.public_profiles.full_name}
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
