'use client';

import { useState } from 'react';

/**
 * Persistent footer on every kiosk screen except the hook.
 *
 * Captures email for the weekly "What Changed" digest (the /intelligence/civic/whats-new
 * feed sent as a digest). Posts to /api/kiosk/subscribe which inserts into
 * whats_new_subscribers and returns success/duplicate/error.
 *
 * On a kiosk touchscreen, the keyboard pops up natively when the input is focused.
 * No own keyboard component needed for v1.
 */

export function EmailCaptureFooter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'error' | 'duplicate'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMsg('Enter a full email address.');
      return;
    }
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/kiosk/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'kiosk' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || 'Something went wrong. Try again.');
        return;
      }
      setStatus(json.duplicate ? 'duplicate' : 'ok');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error. Try again.');
    }
  }

  return (
    <footer className="bg-stone-100 border-t-2 border-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {status === 'ok' && (
          <p className="text-sm font-mono uppercase tracking-widest text-emerald-700">
            Thanks. You'll hear from us weekly.
          </p>
        )}
        {status === 'duplicate' && (
          <p className="text-sm font-mono uppercase tracking-widest text-stone-700">
            Already subscribed. You'll hear from us weekly.
          </p>
        )}
        {(status === 'idle' || status === 'submitting' || status === 'error') && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="sm:flex-1">
              <p className="text-sm sm:text-base font-semibold text-stone-900">Get What Changed in your inbox.</p>
              <p className="text-xs text-stone-600">
                The weekly digest: new claims, evidence, named Tier 1 orgs, classified grants.
              </p>
            </div>
            <form onSubmit={submit} className="flex gap-2 flex-1 sm:max-w-md">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com.au"
                aria-label="Email address"
                className="flex-1 min-h-[48px] px-4 border-2 border-stone-300 bg-white rounded text-base focus:outline-none focus:border-stone-900"
                disabled={status === 'submitting'}
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="min-h-[48px] px-5 bg-stone-900 text-white text-sm font-mono uppercase tracking-widest rounded hover:bg-stone-800 disabled:bg-stone-400 transition-colors"
              >
                {status === 'submitting' ? '...' : 'Subscribe'}
              </button>
            </form>
            <a
              href="/kiosk/card"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center min-h-[48px] px-5 border-2 border-stone-900 text-stone-900 text-sm font-mono uppercase tracking-widest rounded hover:bg-stone-900 hover:text-white transition-colors shrink-0"
            >
              Take a card
            </a>
          </div>
        )}
        {status === 'error' && errorMsg && (
          <p className="mt-2 text-xs text-rose-700">{errorMsg}</p>
        )}
      </div>
    </footer>
  );
}
