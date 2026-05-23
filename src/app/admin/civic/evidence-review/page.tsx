import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Evidence review · admin | JusticeHub' };

interface SummaryRow {
  claim_id: string;
  display_label: string;
  chapter: string;
  region: string;
  supporting_sources: number;
  contradicting_sources: number;
  verified_sources: number;
  avg_confidence: number | null;
  triangulation_tier: string;
}

interface EvidenceRow {
  id: string;
  claim_id: string;
  source_table: string;
  supports: boolean;
  confidence: number | null;
  methodology_note: string | null;
  contributed_by: string | null;
  reviewer_status: string;
  reviewed_at: string | null;
  notes: string | null;
}

async function fetchData() {
  const supabase = createServiceClient() as any;
  const [summaryRes, evidenceRes] = await Promise.all([
    supabase.from('v_claim_evidence_summary').select('*'),
    supabase.from('civic_claim_evidence').select('*').order('reviewer_status').order('claim_id'),
  ]);
  return {
    summary: (summaryRes.data || []) as SummaryRow[],
    evidence: (evidenceRes.data || []) as EvidenceRow[],
  };
}

const TIER_COLOR: Record<string, string> = {
  triangulated: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  corroborated: 'bg-amber-100 text-amber-800 border-amber-300',
  single_source: 'bg-rose-100 text-rose-800 border-rose-300',
  no_evidence: 'bg-stone-200 text-stone-700 border-stone-300',
};
const STATUS_COLOR: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-rose-100 text-rose-800',
  auto_high_confidence: 'bg-stone-100 text-stone-700',
  pending: 'bg-amber-100 text-amber-800',
};

export default async function EvidenceReviewPage() {
  const { summary, evidence } = await fetchData();

  const tierTally: Record<string, number> = {};
  for (const s of summary) tierTally[s.triangulation_tier] = (tierTally[s.triangulation_tier] || 0) + 1;

  const statusTally: Record<string, number> = {};
  for (const e of evidence) statusTally[e.reviewer_status] = (statusTally[e.reviewer_status] || 0) + 1;

  const evidenceByClaim: Record<string, EvidenceRow[]> = {};
  for (const e of evidence) {
    if (!evidenceByClaim[e.claim_id]) evidenceByClaim[e.claim_id] = [];
    evidenceByClaim[e.claim_id].push(e);
  }

  // Default sort: weakest triangulation first
  const tierOrder: Record<string, number> = { no_evidence: 0, single_source: 1, corroborated: 2, triangulated: 3 };
  const sorted = [...summary].sort((a, b) =>
    (tierOrder[a.triangulation_tier] || 9) - (tierOrder[b.triangulation_tier] || 9) ||
    a.claim_id.localeCompare(b.claim_id)
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/admin" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Admin
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Evidence review</span>
        </div>
      </nav>

      <section className="bg-stone-900 text-stone-50 px-6 py-12 border-b border-stone-700">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">Admin · Human-in-the-loop</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Civic claim evidence review</h1>
          <p className="mt-3 max-w-2xl text-stone-300">
            Per-claim triangulation status. Sense-check what auto-seeding produced. Mark verified
            or flag disputed evidence rows to lift them to publishable confidence.
          </p>
        </div>
      </section>

      {/* Tally cards */}
      <section className="px-6 py-8 border-b border-stone-200">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-4 rounded border-2 ${TIER_COLOR.triangulated}`}>
            <div className="text-xs font-mono uppercase tracking-widest mb-1">Triangulated</div>
            <div className="text-2xl font-bold">{tierTally.triangulated || 0}</div>
            <div className="text-xs">3+ sources</div>
          </div>
          <div className={`p-4 rounded border-2 ${TIER_COLOR.corroborated}`}>
            <div className="text-xs font-mono uppercase tracking-widest mb-1">Corroborated</div>
            <div className="text-2xl font-bold">{tierTally.corroborated || 0}</div>
            <div className="text-xs">2 sources</div>
          </div>
          <div className={`p-4 rounded border-2 ${TIER_COLOR.single_source}`}>
            <div className="text-xs font-mono uppercase tracking-widest mb-1">Single source</div>
            <div className="text-2xl font-bold">{tierTally.single_source || 0}</div>
          </div>
          <div className={`p-4 rounded border-2 ${TIER_COLOR.no_evidence}`}>
            <div className="text-xs font-mono uppercase tracking-widest mb-1">No evidence</div>
            <div className="text-2xl font-bold">{tierTally.no_evidence || 0}</div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div className="border border-stone-200 bg-white p-3 rounded text-sm">
            <div className="text-xs font-mono uppercase text-stone-500">Verified evidence</div>
            <div className="text-xl font-bold text-emerald-700">{statusTally.verified || 0}</div>
          </div>
          <div className="border border-stone-200 bg-white p-3 rounded text-sm">
            <div className="text-xs font-mono uppercase text-stone-500">Auto-high-confidence</div>
            <div className="text-xl font-bold text-stone-900">{statusTally.auto_high_confidence || 0}</div>
          </div>
          <div className="border border-stone-200 bg-white p-3 rounded text-sm">
            <div className="text-xs font-mono uppercase text-stone-500">Pending</div>
            <div className="text-xl font-bold text-amber-700">{statusTally.pending || 0}</div>
          </div>
          <div className="border border-stone-200 bg-white p-3 rounded text-sm">
            <div className="text-xs font-mono uppercase text-stone-500">Disputed</div>
            <div className="text-xl font-bold text-rose-700">{statusTally.disputed || 0}</div>
          </div>
        </div>
      </section>

      {/* Per-claim list */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-stone-700 mb-4">
            Sorted weakest first. Each block shows the claim + its evidence rows. Action affordances
            (mark verified / flag disputed) are read-only in v1 — update via Supabase MCP or the
            seed-claim-evidence script.
          </p>
          <div className="space-y-3">
            {sorted.map((s) => {
              const tierCls = TIER_COLOR[s.triangulation_tier] || TIER_COLOR.no_evidence;
              const rows = evidenceByClaim[s.claim_id] || [];
              return (
                <div key={s.claim_id} className="border border-stone-200 bg-white rounded-md p-4">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${tierCls}`}>{s.triangulation_tier}</span>
                      <span className="font-medium text-stone-900">{s.claim_id}</span>
                      <span className="text-xs text-stone-500">{s.chapter} · {s.region}</span>
                    </div>
                    <span className="text-xs font-mono text-stone-500">
                      {s.supporting_sources} supports{s.contradicting_sources ? ` · ${s.contradicting_sources} contradicts` : ''}
                      {s.avg_confidence != null && ` · conf ${s.avg_confidence.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 mb-3 italic">{s.display_label}</p>
                  {rows.length > 0 && (
                    <ul className="space-y-1.5 text-sm">
                      {rows.map((r) => (
                        <li key={r.id} className="flex items-baseline gap-3 flex-wrap pl-3 border-l-2 border-stone-200">
                          <span className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${STATUS_COLOR[r.reviewer_status] || 'bg-stone-100 text-stone-600'}`}>
                            {r.reviewer_status}
                          </span>
                          <span className="font-mono text-xs text-stone-700">{r.source_table}</span>
                          {r.confidence != null && (
                            <span className="text-xs text-stone-500">conf {Number(r.confidence).toFixed(2)}</span>
                          )}
                          {r.methodology_note && (
                            <span className="text-xs text-stone-600 italic">{r.methodology_note}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
