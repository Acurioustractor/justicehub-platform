import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { FileText, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default async function AdminBlogPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/blog');

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Fetch all blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      public_profiles!blog_posts_author_id_fkey(full_name, slug)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-black text-black mb-2">Blog Posts</h1>
              <p className="text-lg text-gray-600">
                Write and publish stories from the movement
              </p>
            </div>
            <Link
              href="/admin/blog/new"
              className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Blog Post
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-3xl font-black text-black mb-1">
                {posts?.filter(p => p.status === 'published').length || 0}
              </div>
              <div className="text-sm font-bold text-gray-600">Published</div>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-3xl font-black text-black mb-1">
                {posts?.filter(p => p.status === 'draft').length || 0}
              </div>
              <div className="text-sm font-bold text-gray-600">Drafts</div>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-3xl font-black text-black mb-1">
                {posts?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0}
              </div>
              <div className="text-sm font-bold text-gray-600">Total Views</div>
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-3xl font-black text-black mb-1">
                {posts?.length || 0}
              </div>
              <div className="text-sm font-bold text-gray-600">Total Posts</div>
            </div>
          </div>

          {posts && posts.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Author</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Views</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post: any) => (
                    <tr key={post.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {post.public_profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {post.status === 'published' ? (
                          <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-600">
                            PUBLISHED
                          </span>
                        ) : post.status === 'draft' ? (
                          <span className="text-xs font-bold px-2 py-1 bg-gray-50 text-gray-600 border border-gray-600">
                            DRAFT
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 border border-blue-600">
                            {post.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.view_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'published' && (
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-sm font-bold text-blue-600 hover:text-blue-800"
                              target="_blank"
                            >
                              View
                            </Link>
                          )}
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="text-sm font-bold text-green-600 hover:text-green-800"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-bold text-gray-600 mb-4">No blog posts yet</p>
              <p className="text-gray-600 mb-6">Start sharing stories from the movement</p>
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                <Plus className="w-5 h-5" />
                Write Your First Post
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
