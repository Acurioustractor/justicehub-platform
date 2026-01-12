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

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) redirect('/');

  // Fetch stories with author profiles using any to bypass strict linting on missing DB types
  const { data: storiesData, error: storiesError } = await supabase
    .from('stories')
    .select(`
      *,
      profiles!stories_author_id_fkey (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (storiesError) {
    console.error('Error fetching stories:', storiesError);
  }

  // Map to the Story interface expected by StoriesTable with safe fallbacks
  const stories = (storiesData || []).map((item: any) => ({
    id: item.id,
    title: item.title || 'Untitled',
    status: item.status || 'draft',
    created_at: item.created_at || new Date().toISOString(),
    content_type: 'article' as const,
    excerpt: item.excerpt || '',
    public_profiles: item.profiles ? {
      full_name: item.profiles.full_name,
      slug: '' // profiles table doesn't have slug, will need to handle this
    } : undefined
  }));

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
            <div className="flex gap-4">
              <Link
                href="/admin/stories/transcript"
                className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors border-2 border-blue-600 shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                From Transcript (AI)
              </Link>
              <Link
                href="/admin/stories/new"
                className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-lg"
              >
                Blank Story
              </Link>
            </div>
          </div>

          <StoriesTable initialStories={stories || []} />
        </div>
      </div>
    </div>
  );
}
