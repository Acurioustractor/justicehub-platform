/**
 * /admin/data-sufficiency/[topic]
 *
 * Focused view of one topic's sources + open questions + outcomes log.
 * Per-topic depth: every source row in full, every question (including
 * resolved ones so the outcome log is visible), most-stale first.
 */

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { AddGapQuestion, GapQuestionRow } from '../GapQuestionEditor';

export const dynamic = 'force-dynamic';

const TOPICS = ['grants', 'foundations', 'government', 'orgs', 'oversight', 'demographics', 'meta'];
const TOPIC_LABEL: Record<string, string> = {
  grants: 'Grants',
  foundations: 'Foundations',
  government: 'Government',
  orgs: 'Organisations',
  oversight: 'Oversight',
  demographics: 'Demographics',
  meta: 'Meta',
};

function daysAgo(iso: string | null): string {
  if (!iso) return 'never';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function TopicPage({ params }: { params: { topic: string } }) {
  const topic = params.topic.toLowerCase();
  if (!TOPICS.includes(topic)) notFound();

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/login?redirect=/admin/data-sufficiency/${topic}`);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/');
  }

  const service = createServiceClient() as any;
  const [sourcesRes, gapsRes] = await Promise.all([
    service
      .from('data_sources_inventory')
      .select('*')
      .eq('topic', topic)
      .order('last_refreshed_at', { ascending: true, nullsFirst: true }),
    service
      .from('data_gap_questions')
      .select('*')
      .eq('topic', topic)
      .order('status') // open/investigating first alphabetically
      .order('priority')
      .order('raised_at', { ascending: false }),
  ]);

  const sources = sourcesRes.data || [];
  const gaps = gapsRes.data || [];
  const openGaps = gaps.filter((g: any) => ['open', 'investigating'].includes(g.status));
  const resolvedGaps = gaps.filter((g: any) => ['sourced', 'closed', 'wontfix'].includes(g.status));
  const stale = sources.filter((s: any) => !s.last_refreshed_at || (Date.now() - new Date(s.last_refreshed_at).getTime()) > 60 * 86_400_000);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/admin/data-sufficiency" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
          ← Data sufficiency
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">{TOPIC_LABEL[topic]}</h1>

        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Box label="Active sources" value={sources.filter((s: any) => s.status === 'active').length} accent="emerald" />
          <Box label="Planned" value={sources.filter((s: any) => s.status === 'planned').length} accent="amber" />
          <Box label="Stale (>60d)" value={stale.length} accent={stale.length > 0 ? 'rose' : 'stone'} />
          <Box label="Open questions" value={openGaps.length} accent={openGaps.length > 0 ? 'rose' : 'stone'} />
        </section>

        {/* Sources */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Sources ({sources.length})</h2>
          {sources.length === 0 ? (
            <p className="text-stone-600 italic">No sources catalogued for {TOPIC_LABEL[topic]} yet.</p>
          ) : (
            <ul className="border-2 border-stone-200 rounded bg-white divide-y divide-stone-100">
              {sources.map((s: any) => {
                const isStale = !s.last_refreshed_at || (Date.now() - new Date(s.last_refreshed_at).getTime()) > 60 * 86_400_000;
                return (
                  <li key={s.source_key} className="p-4">
                    <div className="flex items-baseline flex-wrap gap-2 mb-1">
                      <span className="font-semibold text-stone-900">{s.display_name}</span>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                          s.status === 'planned'
                            ? 'text-amber-700 bg-amber-50 border-amber-300'
                            : isStale
                            ? 'text-rose-700 bg-rose-50 border-rose-300'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                        }`}
                      >
                        {s.status === 'planned' ? 'planned' : isStale ? 'stale' : 'active'}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">{s.source_key}</span>
                    </div>
                    {s.coverage_note && <p className="text-sm text-stone-700 mb-1">{s.coverage_note}</p>}
                    {s.description && <p className="text-xs text-stone-600 mb-1">{s.description}</p>}
                    <p className="text-[10px] font-mono text-stone-500">
                      {s.row_count != null && <span>{s.row_count.toLocaleString()} rows · </span>}
                      {s.ingest_method && <span>{s.ingest_method} · </span>}
                      {s.refresh_cadence && <span>{s.refresh_cadence} · </span>}
                      <span>last refresh {daysAgo(s.last_refreshed_at)}</span>
                    </p>
                    {s.url && (
                      <p className="mt-1">
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-stone-600 underline break-all">
                          {s.url}
                        </a>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Open gap questions */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold">Open questions ({openGaps.length})</h2>
          </div>
          <AddGapQuestion />
          {openGaps.length === 0 ? (
            <p className="mt-4 text-stone-600 italic">No open questions for {TOPIC_LABEL[topic]}.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {openGaps.map((g: any) => <GapQuestionRow key={g.id} gap={g} />)}
            </ul>
          )}
        </section>

        {/* Outcomes log (resolved questions) */}
        {resolvedGaps.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-4">Outcomes log ({resolvedGaps.length})</h2>
            <ul className="space-y-2">
              {resolvedGaps.map((g: any) => <GapQuestionRow key={g.id} gap={g} />)}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Box({ label, value, accent }: { label: string; value: number; accent: 'emerald' | 'amber' | 'rose' | 'stone' }) {
  const cls: Record<string, string> = {
    emerald: 'border-emerald-300 bg-emerald-50',
    amber: 'border-amber-300 bg-amber-50',
    rose: 'border-rose-300 bg-rose-50',
    stone: 'border-stone-300 bg-white',
  };
  return (
    <div className={`border-2 rounded p-3 ${cls[accent]}`}>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}
