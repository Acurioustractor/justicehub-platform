import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { StoriesTable } from './stories-table';

export default async function AdminStoriesPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/stories');

  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userData?.user_role !== 'admin') redirect('/');

  // Fetch all stories from both articles and blog_posts tables
  const [articlesResult, blogsResult] = await Promise.all([
    supabase
      .from('articles')
      .select(`
        *,
        public_profiles!articles_author_id_fkey (
          full_name,
          slug
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_posts')
      .select(`
        *,
        public_profiles!blog_posts_author_id_fkey (
          full_name,
          slug
        )
      `)
      .order('created_at', { ascending: false }),
  ]);

  // Merge both sources with content_type indicator
  const articles = (articlesResult.data || []).map((item: any) => ({
    ...item,
    content_type: 'article' as const,
  }));

  const blogs = (blogsResult.data || []).map((item: any) => ({
    ...item,
    content_type: 'blog' as const,
  }));

  const stories = [...articles, ...blogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
              <h1 className="text-4xl font-black text-black mb-2">Stories</h1>
              <p className="text-lg text-gray-600">
                Manage user stories and testimonials
              </p>
            </div>
            <Link
              href="/admin/stories/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
            >
              Create Story
            </Link>
          </div>

          <StoriesTable initialStories={stories || []} />
        </div>
      </div>
    </div>
  );
}
