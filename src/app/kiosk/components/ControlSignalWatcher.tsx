'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Polls /api/kiosk/control-signal every 5s. When a signal newer than the
 * one this client last saw arrives, reacts based on signal_type:
 *
 *   reset  -> router.push('/kiosk')
 *   reload -> window.location.reload()
 *   note   -> show transient banner with payload.message
 *
 * The kiosk client only acts on the FIRST new signal it sees per id so
 * the same signal doesn't fire twice across re-renders.
 */

interface ControlSignal {
  id: string;
  signal_type: 'reset' | 'reload' | 'note';
  payload: any;
  sent_at: string;
}

export function ControlSignalWatcher({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  const seenIdRef = useRef<string | null>(null);
  const initialisedRef = useRef(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/kiosk/control-signal', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const sig = json.signal as ControlSignal | null;
        if (!sig) return;
        // First load: just remember the latest id so we don't replay an old signal
        // when the kiosk boots up. Only signals AFTER boot fire actions.
        if (!initialisedRef.current) {
          seenIdRef.current = sig.id;
          initialisedRef.current = true;
          return;
        }
        if (sig.id === seenIdRef.current) return;
        seenIdRef.current = sig.id;
        if (cancelled) return;
        if (sig.signal_type === 'reset') {
          router.push('/kiosk');
        } else if (sig.signal_type === 'reload') {
          window.location.reload();
        } else if (sig.signal_type === 'note') {
          const msg = sig.payload?.message;
          if (typeof msg === 'string' && msg.length > 0) {
            setNote(msg);
            setTimeout(() => setNote(null), 8000);
          }
        }
      } catch {
        // ignore network blip; next poll will try again
      }
    }
    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router, intervalMs]);

  if (!note) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-stone-900 border-b-2 border-amber-700 px-4 py-3 text-center font-semibold shadow-lg">
      {note}
    </div>
  );
}
