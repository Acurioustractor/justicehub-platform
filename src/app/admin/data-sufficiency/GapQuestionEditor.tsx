'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TOPICS = ['foundations', 'grants', 'government', 'orgs', 'oversight', 'demographics', 'meta'];
const STATUSES = ['open', 'investigating', 'sourced', 'closed', 'wontfix'] as const;

const STATUS_BADGE: Record<string, string> = {
  open: 'text-rose-700 bg-rose-50 border-rose-300',
  investigating: 'text-amber-700 bg-amber-50 border-amber-300',
  sourced: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  closed: 'text-stone-700 bg-stone-100 border-stone-300',
  wontfix: 'text-stone-500 bg-stone-50 border-stone-200',
};

export function AddGapQuestion() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('foundations');
  const [priority, setPriority] = useState('3');
  const [proposedUrl, setProposedUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 5) {
      setStatus('error');
      setErrorMsg('Question must be at least 5 characters.');
      return;
    }
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/data-gap-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, topic, priority: Number(priority), proposed_source_url: proposedUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || 'Could not save.');
        return;
      }
      setQuestion('');
      setProposedUrl('');
      setStatus('idle');
      setOpen(false);
      router.refresh();
    } catch {
      setStatus('error');
      setErrorMsg('Network error.');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-stone-900 text-white text-xs font-mono uppercase tracking-widest rounded hover:bg-stone-800"
      >
        + Add a gap question
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border-2 border-stone-300 bg-white p-4 rounded space-y-3">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What's the data gap? e.g. State coronial findings on YJ deaths"
        className="w-full min-h-[48px] px-4 border-2 border-stone-200 rounded text-base"
        autoFocus
      />
      <textarea
        value={proposedUrl}
        onChange={(e) => setProposedUrl(e.target.value)}
        placeholder="Proposed source URL (optional)"
        rows={2}
        className="w-full px-4 py-2 border-2 border-stone-200 rounded text-sm"
      />
      <div className="flex flex-wrap gap-3">
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-[40px] px-3 border-2 border-stone-200 rounded text-sm">
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="min-h-[40px] px-3 border-2 border-stone-200 rounded text-sm">
          {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>Priority {p}</option>)}
        </select>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="px-4 py-2 bg-emerald-700 text-white text-xs font-mono uppercase tracking-widest rounded hover:bg-emerald-600 disabled:bg-stone-400"
        >
          {status === 'submitting' ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-stone-300 text-xs font-mono uppercase tracking-widest rounded">Cancel</button>
      </div>
      {status === 'error' && errorMsg && <p className="text-sm text-rose-700">{errorMsg}</p>}
    </form>
  );
}

export function GapQuestionRow({ gap }: { gap: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(gap.outcome_note || '');
  const [editingOutcome, setEditingOutcome] = useState(false);

  async function setStatus(newStatus: string) {
    setBusy(true);
    try {
      await fetch('/api/admin/data-gap-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gap.id, status: newStatus }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveOutcome() {
    setBusy(true);
    try {
      await fetch('/api/admin/data-gap-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gap.id, outcome_note: outcome }),
      });
      setEditingOutcome(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border-2 border-stone-200 bg-white rounded p-4">
      <div className="flex items-start gap-3 mb-2">
        <span className={`shrink-0 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_BADGE[gap.status]}`}>
          {gap.status}
        </span>
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-stone-100 border border-stone-300 text-stone-700">
          {gap.topic} · P{gap.priority}
        </span>
        <p className="flex-1 font-semibold text-stone-900">{gap.question}</p>
      </div>
      {gap.proposed_source_url && (
        <p className="text-xs mt-1 ml-1">
          <a href={gap.proposed_source_url} target="_blank" rel="noreferrer" className="text-stone-600 hover:text-stone-900 underline break-all">
            {gap.proposed_source_url}
          </a>
        </p>
      )}
      {gap.outcome_note && !editingOutcome && (
        <p className="mt-2 text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded p-2">{gap.outcome_note}</p>
      )}
      {editingOutcome && (
        <div className="mt-2 space-y-2">
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={2}
            placeholder="What did you learn / find / decide?"
            className="w-full p-2 border-2 border-stone-200 rounded text-sm"
          />
          <button onClick={saveOutcome} disabled={busy} className="px-3 py-1 bg-stone-900 text-white text-xs font-mono uppercase tracking-widest rounded">Save</button>
          <button onClick={() => setEditingOutcome(false)} className="px-3 py-1 border border-stone-300 text-xs font-mono uppercase tracking-widest rounded ml-2">Cancel</button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono uppercase tracking-widest">
        {STATUSES.filter((s) => s !== gap.status).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            disabled={busy}
            className="px-2 py-1 border border-stone-300 text-stone-700 rounded hover:bg-stone-100"
          >
            → {s}
          </button>
        ))}
        {!editingOutcome && (
          <button onClick={() => setEditingOutcome(true)} className="px-2 py-1 border border-stone-300 text-stone-700 rounded hover:bg-stone-100">
            {gap.outcome_note ? 'Edit outcome' : 'Add outcome note'}
          </button>
        )}
      </div>
    </li>
  );
}
