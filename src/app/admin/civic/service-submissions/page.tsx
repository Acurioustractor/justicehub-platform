import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Service submissions · admin | JusticeHub' };

interface Submission {
  id: string;
  name: string;
  website_url: string | null;
  state: string | null;
  city: string | null;
  abn: string | null;
  description: string;
  proposed_sector: string | null;
  contact_email: string | null;
  submitter_name: string | null;
  acco_certified: boolean;
  cultural_authority: boolean;
  status: string;
  matched_organization_id: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

async function fetchSubmissions(): Promise<Submission[]> {
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('exhibition_service_submissions')
    .select('*')
    .order('status', { ascending: true })
    .order('submitted_at', { ascending: false })
    .limit(100);
  return (data || []) as Submission[];
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  duplicate: 'bg-sky-100 text-sky-800 border-sky-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 border-rose-300',
};

export default async function ServiceSubmissionsPage() {
  const submissions = await fetchSubmissions();
  const byStatus: Record<string, Submission[]> = {};
  for (const s of submissions) {
    if (!byStatus[s.status]) byStatus[s.status] = [];
    byStatus[s.status].push(s);
  }
  const tally: Record<string, number> = {};
  for (const s of submissions) tally[s.status] = (tally[s.status] || 0) + 1;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/admin" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Admin
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Service submissions</span>
        </div>
      </nav>

      <section className="bg-stone-900 text-stone-50 px-6 py-10 border-b border-stone-700">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">Admin · Community submissions</p>
          <h1 className="text-3xl font-bold tracking-tight">Service submissions</h1>
          <p className="mt-2 max-w-2xl text-stone-300">
            Community-submitted services from /add-service. Review each one before it materialises as an
            organisations row in the public catalogue.
          </p>
        </div>
      </section>

      <section className="px-6 py-6 border-b border-stone-200">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['pending', 'duplicate', 'approved', 'rejected'] as const).map((status) => (
            <div key={status} className={`p-4 rounded border-2 ${STATUS_COLOR[status]}`}>
              <div className="text-xs font-mono uppercase tracking-widest mb-1">{status}</div>
              <div className="text-2xl font-bold">{tally[status] || 0}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {submissions.length === 0 ? (
            <p className="text-stone-600 italic">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="border border-stone-200 bg-white rounded-md p-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_COLOR[s.status] || 'bg-stone-100'}`}>
                      {s.status}
                    </span>
                    <span className="font-bold text-stone-900">{s.name}</span>
                    {s.state && <span className="text-xs text-stone-500">{s.state}</span>}
                    {s.city && <span className="text-xs text-stone-500">· {s.city}</span>}
                    {s.acco_certified && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">ACCO claim</span>
                    )}
                    {s.cultural_authority && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Cultural authority claim</span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500">
                    submitted {new Date(s.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-stone-800 mb-2 italic">{s.description}</p>
                <div className="text-xs text-stone-600 flex flex-wrap gap-3">
                  {s.website_url && (
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-stone-700 underline">
                      website ↗
                    </a>
                  )}
                  {s.abn && <span>ABN: {s.abn}</span>}
                  {s.proposed_sector && <span>· Sector: {s.proposed_sector}</span>}
                  {s.contact_email && <span>· Contact: {s.contact_email}</span>}
                  {s.submitter_name && <span>· From: {s.submitter_name}</span>}
                  {s.matched_organization_id && (
                    <span className="text-sky-700">↪ duplicate of existing org id {s.matched_organization_id.slice(0, 8)}</span>
                  )}
                </div>
                <div className="mt-3 text-xs text-stone-500 italic">
                  Status update via Supabase MCP for now: <code className="font-mono">UPDATE exhibition_service_submissions SET status=&apos;approved&apos; WHERE id=&apos;{s.id}&apos;</code>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
