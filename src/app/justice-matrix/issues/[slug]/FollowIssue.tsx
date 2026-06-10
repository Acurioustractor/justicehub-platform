'use client';

import { useState } from 'react';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export function FollowIssue({ slug, title }: { slug: string; title: string }) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || state === 'done') return;
    setState('busy');
    try {
      const res = await fetch('/api/justice-matrix/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, issue_slug: slug, issue_title: title, hp }),
      });
      const json = await res.json();
      setState(json.success ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-lg border p-5" style={{ background: 'rgba(5,150,105,0.06)', borderColor: '#d1e7dd' }}>
        <div className="text-[14px] font-semibold" style={{ color: '#047857' }}>
          Following. We will email you when this issue moves.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border p-5" style={{ background: '#ffffff', borderColor: '#e4e4e7' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: '#71717a' }} className="uppercase mb-1">
        Follow this issue
      </div>
      <p className="text-[13px] leading-5 mb-3" style={{ color: '#3f3f46' }}>
        Get an email when new cases, campaigns, or evidence land on this issue. Nothing else.
      </p>
      <div className="flex items-stretch gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@organisation.org"
          aria-label="Email address"
          className="flex-1 rounded-md px-3 py-2.5 text-[14px] focus:outline-none"
          style={{ border: '1px solid #d4d4d8', color: '#18181b' }}
        />
        {/* Honeypot: visually hidden, bots fill it, handler discards. */}
        <input
          type="text"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />
        <button
          type="submit"
          disabled={state === 'busy'}
          className="rounded-md px-4 text-sm font-semibold disabled:opacity-60"
          style={{ background: '#4a2560', color: '#fff' }}
        >
          {state === 'busy' ? 'Saving…' : 'Follow'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-[12px] mt-2" style={{ color: '#b91c1c' }}>
          That did not save. Try again in a moment.
        </p>
      )}
    </form>
  );
}
