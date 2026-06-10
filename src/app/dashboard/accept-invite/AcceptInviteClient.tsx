'use client';

import { useState } from 'react';

export function AcceptInviteClient({ token, email }: { token: string; email: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setState('working');
    setError(null);
    try {
      const res = await fetch('/api/dashboard/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Could not accept the invite');
        setState('error');
        return;
      }
      setState('done');
    } catch {
      setError('Something went wrong. Try again.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="space-y-4">
        <p>
          You are now the owner of your organisation&apos;s profile on
          JusticeHub. You hold the pen: nothing publishes without you.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-4 py-2 rounded bg-emerald-700 text-white text-sm"
        >
          Go to your dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">
        You are signed in as <strong>{email}</strong>. Accepting links this
        account to your organisation as its owner. The invite only works for
        the email address it was issued to.
      </p>
      {error && (
        <p className="text-sm text-red-700 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      <button
        onClick={accept}
        disabled={state === 'working'}
        className="px-4 py-2 rounded bg-emerald-700 text-white text-sm disabled:opacity-50"
      >
        {state === 'working' ? 'Accepting…' : 'Accept invite'}
      </button>
    </div>
  );
}
