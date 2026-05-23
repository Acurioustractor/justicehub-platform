'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'ok' | 'error';

export function ControlPanel() {
  const [pin, setPin] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  async function send(signal_type: 'reset' | 'reload' | 'note', payload?: any) {
    if (pin.length < 4) {
      setStatus('error');
      setErrorMsg('Enter the PIN first.');
      return;
    }
    setStatus('sending');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/kiosk/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, signal_type, payload, sent_by: 'operator' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || 'Send failed.');
        return;
      }
      setStatus('ok');
      setLastSent(`${signal_type} · ${new Date(json.sent_at).toLocaleTimeString()}`);
      if (signal_type === 'note') setNote('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setErrorMsg('Network error.');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">PIN</label>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="w-full min-h-[52px] px-4 bg-stone-900 border-2 border-stone-700 text-white text-lg rounded focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => send('reset')}
          disabled={status === 'sending'}
          className="w-full min-h-[60px] bg-emerald-700 hover:bg-emerald-600 text-white text-base font-mono uppercase tracking-widest rounded disabled:bg-stone-700"
        >
          {status === 'sending' ? '...' : 'Reset kiosk → /kiosk'}
        </button>

        <button
          type="button"
          onClick={() => send('reload')}
          disabled={status === 'sending'}
          className="w-full min-h-[60px] bg-stone-800 hover:bg-stone-700 text-white text-base font-mono uppercase tracking-widest rounded disabled:bg-stone-900"
        >
          Hard reload current page
        </button>
      </div>

      <div className="pt-4 border-t border-stone-800">
        <label className="block text-xs font-mono uppercase tracking-widest text-stone-400 mb-2">Note banner</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Back at 3pm · staff break"
          className="w-full min-h-[52px] px-4 bg-stone-900 border-2 border-stone-700 text-white rounded focus:outline-none focus:border-stone-500 mb-3"
        />
        <button
          type="button"
          onClick={() => note.trim() && send('note', { message: note.trim() })}
          disabled={status === 'sending' || note.trim().length === 0}
          className="w-full min-h-[60px] bg-amber-600 hover:bg-amber-500 text-stone-950 text-base font-mono uppercase tracking-widest rounded disabled:bg-stone-800 disabled:text-stone-500"
        >
          Show banner
        </button>
      </div>

      {status === 'ok' && lastSent && (
        <p className="text-sm font-mono uppercase tracking-widest text-emerald-400">Sent · {lastSent}</p>
      )}
      {status === 'error' && errorMsg && <p className="text-sm text-rose-400">{errorMsg}</p>}
    </div>
  );
}
