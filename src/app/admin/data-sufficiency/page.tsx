/**
 * /admin/data-sufficiency — the "do we have enough data" dashboard.
 *
 * Continually reframes the question: what do we have, what's stale, what's
 * missing, what are we doing about it.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { AddGapQuestion, GapQuestionRow } from './GapQuestionEditor';

export const dynamic = 'force-dynamic';

interface SourceRow {
  source_key: string;
  topic: string;
  display_name: string;
  description: string | null;
  url: string | null;
  ingest_method: string | null;
  refresh_cadence: string | null;
  last_refreshed_at: string | null;
  row_count: number | null;
  coverage_note: string | null;
  status: 'active' | 'paused' | 'discontinued' | 'planned';
}

interface GapRow {
  id: string;
  question: string;
  topic: string;
  status: 'open' | 'investigating' | 'sourced' | 'closed' | 'wontfix';
  proposed_source_url: string | null;
  outcome_note: string | null;
  raised_at: string;
  resolved_at: string | null;
  owner: string | null;
  priority: number;
}

const TOPIC_LABEL: Record<string, string> = {
  grants: 'Grants',
  foundations: 'Foundations',
  government: 'Government',
  orgs: 'Organisations',
  oversight: 'Oversight',
  demographics: 'Demographics',
  meta: 'Meta',
};

const TOPIC_ORDER = ['foundations', 'grants', 'government', 'orgs', 'oversight', 'demographics', 'meta'];

async function getData() {
  const service = createServiceClient() as any;
  const [sources, gaps, rollup] = await Promise.all([
    service.from('data_sources_inventory').select('*').order('topic, status, display_name'),
    service.from('data_gap_questions').select('*').order('priority').order('raised_at', { ascending: false }),
    service.from('v_data_sufficiency').select('*'),
  ]);
  return {
    sources: (sources.data || []) as SourceRow[],
    gaps: (gaps.data || []) as GapRow[],
    rollup: (rollup.data || []) as Array<{ topic: string; active_sources: number; planned_sources: number; stale_sources: number; active_row_count: number | null }>,
  };
}

function daysAgo(iso: string | null): string {
  if (!iso) return 'never';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export default async function DataSufficiencyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login?redirect=/admin/data-sufficiency');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/');
  }

  const { sources, gaps, rollup } = await getData();
  const rollupByTopic = new Map(rollup.map((r) => [r.topic, r]));

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/admin" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
          ← Admin
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Data sufficiency</h1>
        <p className="mt-2 text-stone-700 max-w-2xl">
          Do we have enough data? Continually reconsider. Every source listed; every known gap recorded; every lead a path to follow.
        </p>

        {/* Findings link */}
        <p className="mt-6">
          <Link href="/admin/data-sufficiency/findings" className="inline-block text-xs font-mono uppercase tracking-widest text-emerald-700 border border-emerald-300 px-3 py-2 rounded hover:bg-emerald-50">
            Review agent findings →
          </Link>
        </p>

        {/* Per-topic rollup */}
        <section className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {TOPIC_ORDER.map((topic) => {
            const r = rollupByTopic.get(topic);
            const stale = (r?.stale_sources ?? 0) > 0;
            const openGaps = gaps.filter((g) => g.topic === topic && g.status === 'open').length;
            return (
              <Link
                key={topic}
                href={`/admin/data-sufficiency/${topic}`}
                className={`block border-2 ${stale ? 'border-rose-300 bg-rose-50' : 'border-stone-300 bg-white'} hover:border-stone-900 rounded p-3 transition-colors`}
              >
                <p className="text-xs font-mono uppercase tracking-widest text-stone-500">{TOPIC_LABEL[topic]}</p>
                <p className="mt-1 text-xl font-bold">{r?.active_sources ?? 0}<span className="text-stone-400 text-sm">/{(r?.active_sources ?? 0) + (r?.planned_sources ?? 0)}</span></p>
                <p className="text-[10px] text-stone-600 mt-0.5">active sources</p>
                {openGaps > 0 && (
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-rose-700">{openGaps} open gap{openGaps === 1 ? '' : 's'}</p>
                )}
                {stale && (
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-rose-700">{r!.stale_sources} stale</p>
                )}
              </Link>
            );
          })}
        </section>

        {/* Sources table by topic */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Sources</h2>
          {TOPIC_ORDER.map((topic) => {
            const topicSources = sources.filter((s) => s.topic === topic);
            if (topicSources.length === 0) return null;
            return (
              <div key={topic} className="mb-7">
                <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">{TOPIC_LABEL[topic]}</p>
                <ul className="border-2 border-stone-200 rounded bg-white divide-y divide-stone-100">
                  {topicSources.map((s) => {
                    const stale = !s.last_refreshed_at || (Date.now() - new Date(s.last_refreshed_at).getTime()) > 60 * 86_400_000;
                    const planned = s.status === 'planned';
                    return (
                      <li key={s.source_key} className="p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
                        <div>
                          <div className="flex items-baseline flex-wrap gap-2">
                            <span className="font-semibold text-stone-900">{s.display_name}</span>
                            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                              planned ? 'text-amber-700 bg-amber-50 border-amber-300'
                              : stale ? 'text-rose-700 bg-rose-50 border-rose-300'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                            }`}>
                              {planned ? 'planned' : stale ? 'stale' : 'active'}
                            </span>
                            {s.url && (
                              <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] text-stone-500 underline">
                                source ↗
                              </a>
                            )}
                          </div>
                          {s.coverage_note && <p className="mt-1 text-sm text-stone-700">{s.coverage_note}</p>}
                          <p className="mt-1 text-[10px] font-mono text-stone-500">
                            {s.row_count != null && <span>{s.row_count.toLocaleString()} rows · </span>}
                            {s.ingest_method && <span>{s.ingest_method} · </span>}
                            {s.refresh_cadence && <span>{s.refresh_cadence} · </span>}
                            <span>last refresh {daysAgo(s.last_refreshed_at)} ago</span>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>

        {/* Open gap questions */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold">Open questions</h2>
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500">
              {gaps.filter((g) => g.status === 'open').length} open · {gaps.filter((g) => g.status === 'investigating').length} investigating
            </span>
          </div>
          <AddGapQuestion />
          <ul className="mt-5 space-y-2">
            {gaps.map((g) => (
              <GapQuestionRow key={g.id} gap={g} />
            ))}
          </ul>
        </section>

        <section className="mt-12 border-t-2 border-stone-200 pt-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 leading-relaxed">
            Add new sources by inserting into <span className="text-stone-700">data_sources_inventory</span>.
            Add new gap questions in the form above or via <Link href="/api/admin/data-gap-questions" className="underline">POST /api/admin/data-gap-questions</Link>.
            Reconsider sufficiency at every quarterly review.
          </p>
        </section>
      </div>
    </main>
  );
}
