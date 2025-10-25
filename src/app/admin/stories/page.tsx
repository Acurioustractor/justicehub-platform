import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

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

  // Fetch all stories from articles table
  const { data: stories } = await supabase
    .from('articles')
    .select('*')
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
              <h1 className="text-4xl font-black text-black mb-2">Stories</h1>
              <p className="text-lg text-gray-600">
                Manage user stories and testimonials
              </p>
            </div>
            <Link
              href="/admin/blog/new"
              className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
            >
              Create Story
            </Link>
          </div>

          {stories && stories.length > 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Created</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{story.title}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 border border-green-600">
                          PUBLISHED
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(story.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/stories/${story.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600 mb-4">No stories yet</p>
              <Link
                href="/admin/blog/new"
                className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
              >
                Create Your First Story
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
