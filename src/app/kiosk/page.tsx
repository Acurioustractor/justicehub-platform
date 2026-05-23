/**
 * /kiosk — the cold-start hook screen.
 *
 * One face, one quote, one place. Tap anywhere to enter the lens grid.
 * Rotates through hook entries every 10s for the attract loop.
 */

import { HookRotator } from './components/HookRotator';
import { HOOK_ENTRIES } from './lib/hook-content';

export const dynamic = 'force-static';

export default function KioskHookPage() {
  return <HookRotator entries={HOOK_ENTRIES} />;
}
