'use client';

import { useState, useEffect, useCallback } from 'react';

interface PendingNomination {
  id: string;
  nominee_name: string;
  nominee_title?: string | null;
  nominee_org?: string | null;
  category: string;
  reason: string;
  nominator_name?: string | null;
  nominator_email?: string | null;
  created_at: string;
}

export function ModerationQueue() {
  const [pending, setPending] = useState<PendingNomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contained/nomination-moderation');
      const data = await res.json();
      setPending(data.pending || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(payload: {
    id?: string;
    all?: boolean;
    reject?: boolean;
    updates?: Partial<Pick<PendingNomination, 'nominee_name' | 'nominee_title' | 'nominee_org' | 'reason'>>;
  }) {
    setBusy(payload.id || 'all');
    try {
      await fetch('/api/admin/contained/nomination-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (payload.all) setPending([]);
      else setPending((prev) => prev.filter((p) => p.id !== payload.id));
    } finally {
      setBusy(null);
    }
  }

  function edit(id: string, field: keyof PendingNomination, value: string) {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  if (loading) {
    return <div className="border border-[#0A0A0A]/15 p-4 font-mono text-sm text-[#0A0A0A]/60">Checking the review queue...</div>;
  }

  if (pending.length === 0) {
    return (
      <div className="border border-[#059669] bg-[#059669]/5 p-4 font-mono text-sm text-[#0A0A0A]/70">
        Review queue is clear. New nominations publish their message only after you approve them here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[#0A0A0A]/60">
          {pending.length} awaiting review. Names and counts are already live; the message text publishes on approve.
        </p>
        <button
          onClick={() => act({ all: true })}
          disabled={busy !== null}
          className="bg-[#0A0A0A] px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-[#F5F0E8] hover:bg-[#0A0A0A]/80 disabled:opacity-50"
        >
          Approve all
        </button>
      </div>
      {pending.map((p) => (
        <div key={p.id} className="border border-[#DC2626]/40 bg-white/60 p-4">
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="border border-[#0A0A0A]/25 bg-white px-3 py-2 text-sm font-bold focus:border-[#0A0A0A] focus:outline-none"
              value={p.nominee_name}
              onChange={(e) => edit(p.id, 'nominee_name', e.target.value)}
              aria-label="Nominee name"
            />
            <input
              className="border border-[#0A0A0A]/25 bg-white px-3 py-2 text-sm focus:border-[#0A0A0A] focus:outline-none"
              value={p.nominee_title || ''}
              placeholder="Title or role"
              onChange={(e) => edit(p.id, 'nominee_title', e.target.value)}
              aria-label="Nominee title"
            />
            <input
              className="border border-[#0A0A0A]/25 bg-white px-3 py-2 text-sm focus:border-[#0A0A0A] focus:outline-none"
              value={p.nominee_org || ''}
              placeholder="Organisation"
              onChange={(e) => edit(p.id, 'nominee_org', e.target.value)}
              aria-label="Nominee organisation"
            />
          </div>
          <textarea
            className="mt-2 w-full border border-[#0A0A0A]/25 bg-white px-3 py-2 text-sm focus:border-[#0A0A0A] focus:outline-none"
            rows={2}
            value={p.reason}
            onChange={(e) => edit(p.id, 'reason', e.target.value)}
            aria-label="Nomination reason"
          />
          <div className="mt-1 flex items-baseline justify-between font-mono text-xs text-[#0A0A0A]/50">
            <span>
              by {p.nominator_name || 'Anonymous'}
              {p.nominator_email ? ` <${p.nominator_email}>` : ''}
            </span>
            <span>{p.category}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() =>
                act({
                  id: p.id,
                  updates: {
                    nominee_name: p.nominee_name,
                    nominee_title: p.nominee_title || '',
                    nominee_org: p.nominee_org || '',
                    reason: p.reason,
                  },
                })
              }
              disabled={busy !== null}
              className="bg-[#059669] px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-white hover:bg-[#059669]/85 disabled:opacity-50"
            >
              Approve as shown
            </button>
            <button
              onClick={() => act({ id: p.id, reject: true })}
              disabled={busy !== null}
              className="border border-[#DC2626] px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#DC2626] hover:bg-[#DC2626] hover:text-white disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
