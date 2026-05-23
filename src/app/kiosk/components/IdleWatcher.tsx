'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Watches for any tap/touch/click/scroll/keypress; if none for `timeoutMs`,
 * navigates back to the kiosk hook (/kiosk). For the last `warnMs` of the
 * countdown, renders a small "Resetting in Ns" pill so visitors aren't
 * surprised when the screen changes.
 *
 * Reset events: touchstart, mousedown, keydown, scroll. Any one of them
 * cancels the warning and restarts the countdown.
 */

export function IdleWatcher({
  timeoutMs = 60_000,
  warnMs = 10_000,
}: {
  timeoutMs?: number;
  warnMs?: number;
}) {
  const router = useRouter();
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const navAtRef = useRef<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    function clearAll() {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    }

    function startTick() {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((navAtRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0 && tickRef.current) clearInterval(tickRef.current);
      }, 250);
    }

    function resetTimer() {
      clearAll();
      setSecondsLeft(null);
      navAtRef.current = Date.now() + timeoutMs;
      warnTimerRef.current = setTimeout(() => {
        setSecondsLeft(Math.ceil(warnMs / 1000));
        startTick();
      }, Math.max(0, timeoutMs - warnMs));
      navTimerRef.current = setTimeout(() => {
        router.push('/kiosk');
      }, timeoutMs);
    }

    const events: Array<keyof DocumentEventMap> = ['touchstart', 'mousedown', 'keydown', 'scroll'];
    events.forEach((ev) => document.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, resetTimer));
      clearAll();
    };
  }, [router, timeoutMs, warnMs]);

  if (secondsLeft == null || secondsLeft <= 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      <div className="bg-stone-900 text-white px-4 py-3 rounded-lg shadow-lg border border-stone-700">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-400">Idle reset</p>
        <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {secondsLeft}s · tap anywhere to stay
        </p>
      </div>
    </div>
  );
}
