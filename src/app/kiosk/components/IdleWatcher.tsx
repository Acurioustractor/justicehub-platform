'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Watches for 60s of no tap/touch/click anywhere on the page and then
 * redirects back to the hook (/kiosk). Mounted inside the lens layout so
 * every screen beneath /kiosk/lenses inherits the reset behaviour.
 *
 * Reset triggers: touchstart, mousedown, keydown, scroll. The interval is
 * passed via prop so it can be lengthened during testing.
 */

export function IdleWatcher({ timeoutMs = 60_000 }: { timeoutMs?: number }) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.push('/kiosk');
      }, timeoutMs);
    }

    const events: Array<keyof DocumentEventMap> = ['touchstart', 'mousedown', 'keydown', 'scroll'];
    events.forEach((ev) => document.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router, timeoutMs]);

  return null;
}
