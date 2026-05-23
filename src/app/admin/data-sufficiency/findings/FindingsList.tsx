'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FindingsList({ findings, history }: { findings: any[]; history: any[] }) {
  if (findings.length === 0) {
    return (
      <div className="mt-8">
        <div className="border-2 border-stone-200 bg-white rounded p-6 text-center">
          <p className="text-stone-700">No pending findings.</p>
          <p className="mt-2 text-xs font-mono uppercase tracking-widest text-stone-500">
            The agent runs nightly. Trigger a manual run via /api/cron/data-sufficiency/agent with the CRON_SECRET.
          </p>
        </div>
        {history.length > 0 && <HistoryList history={history} />}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {findings.map((f) => (
        <FindingCard key={f.id} finding={f} />
      ))}
      <HistoryList history={history} />
    </div>
  );
}

function FindingCard({ finding }: { finding: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [sourceKey, setSourceKey] = useState(suggestedKey(finding));
  const [displayName, setDisplayName] = useState(finding.candidate_title || '');

  async function act(action: 'accept' | 'reject' | 'duplicate') {
    setBusy(true);
    try {
      const body: any = { id: finding.id, action };
      if (action === 'accept' && sourceKey) {
        body.source_key = sourceKey;
        body.display_name = displayName;
      }
      await fetch('/api/admin/data-agent-findings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const score = finding.relevance_score ? Math.round(finding.relevance_score * 100) : 0;
  const highRelevance = score >= 70;

  return (
    <article className={`border-2 ${highRelevance ? 'border-emerald-400' : 'border-stone-300'} bg-white rounded p-5`}>
      <div className="flex items-baseline flex-wrap gap-2 mb-2">
        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${highRelevance ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-stone-700 bg-stone-100 border-stone-300'}`}>
          {score}% relevant
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{finding.topic}</span>
        {finding.gap?.question && (
          <span className="text-[10px] text-stone-500 italic flex-1 truncate">→ {finding.gap.question}</span>
        )}
      </div>
      <h3 className="text-lg font-bold text-stone-900">{finding.candidate_title || 'Untitled'}</h3>
      <a href={finding.candidate_url} target="_blank" rel="noreferrer" className="text-sm text-stone-600 underline break-all block mb-2">
        {finding.candidate_url}
      </a>
      {finding.summary && <p className="text-sm text-stone-800 mb-1">{finding.summary}</p>}
      {finding.rationale && (
        <p className="text-xs text-stone-600 italic">Rationale: {finding.rationale}</p>
      )}

      {showAccept ? (
        <div className="mt-4 border-t border-stone-200 pt-3 space-y-2">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500">Source key (lowercase, underscores)</label>
          <input
            value={sourceKey}
            onChange={(e) => setSourceKey(e.target.value)}
            className="w-full px-3 py-2 border-2 border-stone-200 rounded text-sm font-mono"
            placeholder="e.g. niaa_programs"
          />
          <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border-2 border-stone-200 rounded text-sm"
          />
          <div className="flex gap-2">
            <button onClick={() => act('accept')} disabled={busy || !sourceKey} className="px-4 py-2 bg-emerald-700 text-white text-xs font-mono uppercase tracking-widest rounded hover:bg-emerald-600 disabled:bg-stone-400">
              Save as planned source
            </button>
            <button onClick={() => setShowAccept(false)} className="px-4 py-2 border border-stone-300 text-xs font-mono uppercase tracking-widest rounded">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowAccept(true)}
            disabled={busy}
            className="px-3 py-2 bg-emerald-700 text-white text-xs font-mono uppercase tracking-widest rounded hover:bg-emerald-600"
          >
            Accept → add to inventory
          </button>
          <button
            onClick={() => act('reject')}
            disabled={busy}
            className="px-3 py-2 border border-rose-300 text-rose-700 text-xs font-mono uppercase tracking-widest rounded hover:bg-rose-50"
          >
            Reject
          </button>
          <button
            onClick={() => act('duplicate')}
            disabled={busy}
            className="px-3 py-2 border border-stone-300 text-stone-700 text-xs font-mono uppercase tracking-widest rounded hover:bg-stone-100"
          >
            Mark duplicate
          </button>
        </div>
      )}
    </article>
  );
}

function HistoryList({ history }: { history: any[] }) {
  if (history.length === 0) return null;
  return (
    <section className="mt-10">
      <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Reviewed history</p>
      <ul className="border-2 border-stone-200 rounded bg-white divide-y divide-stone-100 max-h-96 overflow-y-auto">
        {history.map((h) => (
          <li key={h.id} className="px-4 py-2 text-sm flex items-baseline justify-between gap-3">
            <span className="truncate flex-1">
              <span className={`text-[10px] font-mono uppercase tracking-widest mr-2 ${
                h.status === 'accepted' ? 'text-emerald-700' : h.status === 'duplicate' ? 'text-stone-500' : 'text-rose-700'
              }`}>{h.status}</span>
              {h.candidate_title || h.candidate_url}
              {h.resulting_source_key && <span className="ml-2 text-xs text-stone-500 font-mono">→ {h.resulting_source_key}</span>}
            </span>
            <span className="text-xs text-stone-500 shrink-0">{h.reviewed_at ? new Date(h.reviewed_at).toLocaleDateString() : ''}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function suggestedKey(finding: any): string {
  try {
    const u = new URL(finding.candidate_url);
    return u.hostname
      .replace(/^www\./, '')
      .replace(/[.-]/g, '_')
      .replace(/_au_?/, '_au_')
      .replace(/[^a-z0-9_]/g, '')
      .toLowerCase()
      .slice(0, 40);
  } catch {
    return '';
  }
}
