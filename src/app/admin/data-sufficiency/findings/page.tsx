/**
 * /admin/data-sufficiency/findings
 *
 * Review queue for agent-proposed sources. Each pending finding shows the
 * candidate URL, summary, relevance score, rationale, and the original gap
 * question. Buttons accept (with a chance to assign a source_key + name)
 * or reject.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { FindingsList } from './FindingsList';

export const dynamic = 'force-dynamic';

export default async function FindingsPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login?redirect=/admin/data-sufficiency/findings');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/');
  }

  const service = createServiceClient() as any;
  const { data: findings } = await service
    .from('data_agent_findings')
    .select('*, gap:data_gap_questions(id, question, topic)')
    .eq('status', 'pending')
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .limit(100);

  const { data: history } = await service
    .from('data_agent_findings')
    .select('id, candidate_url, candidate_title, status, reviewed_at, topic, resulting_source_key')
    .in('status', ['accepted', 'rejected', 'duplicate'])
    .order('reviewed_at', { ascending: false })
    .limit(30);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/admin/data-sufficiency" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
          ← Data sufficiency
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Agent findings</h1>
        <p className="mt-2 text-stone-700 max-w-2xl">
          Candidate sources proposed by the research agent. Each finding tied to an open gap question. Accept and the source is added to the inventory (planned status); reject to drop. The agent runs nightly via cron — manual triggers from gap rows on the main page.
        </p>

        <FindingsList findings={findings || []} history={history || []} />
      </div>
    </main>
  );
}
