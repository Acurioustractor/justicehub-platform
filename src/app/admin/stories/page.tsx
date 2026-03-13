import { requireAdmin } from '@/lib/supabase/admin-lite';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { UnifiedStoriesHub } from './unified-stories-hub';

export default async function AdminStoriesPage() {
  await requireAdmin('/admin/stories');

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
              <h1 className="text-4xl font-black text-black mb-2">Story Hub</h1>
              <p className="text-lg text-gray-600">
                All stories across every source — articles, interviews, EL synced, partner, community
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/stories/transcript"
                className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                From Transcript (AI)
              </Link>
              <Link
                href="/admin/stories/new"
                className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Blank Story
              </Link>
            </div>
          </div>

          <UnifiedStoriesHub />
        </div>
      </div>
    </div>
  );
}
