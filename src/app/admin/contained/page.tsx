import { requireAdmin } from '@/lib/supabase/admin';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

export default async function AdminContainedPage() {
  const { supabase } = await requireAdmin('/admin/contained');

  // Fetch all stats in parallel
  const [nominationsRes, backersRes, reactionsRes, storiesRes, pendingStoriesRes, eventsRes] =
    await Promise.all([
      supabase
        .from('campaign_nominations')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true),
      supabase
        .from('project_backers')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('tour_reactions')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('tour_stories')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('tour_stories')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('events')
        .select('id, title, date, location, slug')
        .order('date', { ascending: true })
        .limit(10),
    ]);

  const nominations = nominationsRes.count || 0;
  const backers = backersRes.count || 0;
  const reactions = reactionsRes.count || 0;
  const totalStories = storiesRes.count || 0;
  const pendingStories = pendingStoriesRes.count || 0;
  const events = eventsRes.data || [];

  // Recent nominations
  const { data: recentNominations } = await supabase
    .from('campaign_nominations')
    .select('nominee_name, category, reason, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent reactions
  const { data: recentReactions } = await supabase
    .from('tour_reactions')
    .select('rating, role, would_recommend, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const GOAL = 2500;
  const progress = Math.min((nominations / GOAL) * 100, 100);

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
              <h1 className="text-4xl font-black text-black mb-2">CONTAINED Campaign</h1>
              <p className="text-lg text-gray-600">
                Campaign metrics, recent activity, and content moderation
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/contained"
                target="_blank"
                className="px-4 py-2 text-sm font-bold border-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                View Public Page
              </Link>
              <Link
                href="/admin/contained/stories"
                className="px-4 py-2 text-sm font-bold bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors"
              >
                Moderate Stories{pendingStories > 0 ? ` (${pendingStories})` : ''}
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Nominations</div>
              <div className="text-4xl font-black">{nominations.toLocaleString()}</div>
              <div className="mt-2">
                <div className="h-2 bg-gray-200 w-full">
                  <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{GOAL.toLocaleString()} goal</div>
              </div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Backers</div>
              <div className="text-4xl font-black">{backers.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">People backing the tour</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Reactions</div>
              <div className="text-4xl font-black">{reactions.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">Post-experience feedback</div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Stories</div>
              <div className="text-4xl font-black">{totalStories}</div>
              {pendingStories > 0 && (
                <Link
                  href="/admin/contained/stories"
                  className="text-xs font-bold text-red-600 mt-2 inline-block hover:underline"
                >
                  {pendingStories} pending review →
                </Link>
              )}
              {pendingStories === 0 && (
                <div className="text-xs text-gray-500 mt-2">All reviewed</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Nominations */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-4 border-b-2 border-black bg-gray-50">
                <h2 className="font-black text-sm uppercase">Recent Nominations</h2>
              </div>
              {(recentNominations || []).length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {(recentNominations || []).map((nom: { nominee_name: string; category: string; reason: string; created_at: string }, i: number) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{nom.nominee_name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 border border-gray-300">
                          {nom.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{nom.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(nom.created_at).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No nominations yet</div>
              )}
            </div>

            {/* Recent Reactions */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-4 border-b-2 border-black bg-gray-50">
                <h2 className="font-black text-sm uppercase">Recent Reactions</h2>
              </div>
              {(recentReactions || []).length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {(recentReactions || []).map((r: { rating: number; role: string; would_recommend: boolean; comment: string; created_at: string }, i: number) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 border border-gray-300">
                          {r.role}
                        </span>
                        {r.would_recommend && (
                          <span className="text-xs text-emerald-600 font-bold">Recommends</span>
                        )}
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 line-clamp-2">{r.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.created_at).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No reactions yet</div>
              )}
            </div>
          </div>

          {/* Tour Events */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="px-6 py-4 border-b-2 border-black bg-gray-50">
              <h2 className="font-black text-sm uppercase">Tour Events</h2>
            </div>
            {events.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-6 py-3 text-xs font-black uppercase">Event</th>
                    <th className="px-6 py-3 text-xs font-black uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-black uppercase">Location</th>
                    <th className="px-6 py-3 text-xs font-black uppercase text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((event: { id: string; title: string; date: string; location: string; slug: string }) => (
                    <tr key={event.id}>
                      <td className="px-6 py-3 font-medium">{event.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {event.date ? new Date(event.date).toLocaleDateString('en-AU') : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{event.location || '—'}</td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">No events found</div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-6 py-4 border-b-2 border-black bg-gray-50">
              <h2 className="font-black text-sm uppercase">Quick Links</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200">
              {[
                { label: 'Tour Page', href: '/contained' },
                { label: 'Take Action', href: '/contained/act' },
                { label: 'Nominations Wall', href: '/contained/nominations' },
                { label: 'Share Story', href: '/contained/share' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  className="px-6 py-4 text-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-sm">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
