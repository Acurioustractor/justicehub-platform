/**
 * /admin/kiosk/control — PIN-gated remote control for the exhibition kiosk.
 *
 * Operator opens this on their phone in the gallery, enters the PIN, and
 * taps a button to nudge the kiosk back to /kiosk or post a note banner.
 * PIN is verified server-side via the env var KIOSK_CONTROL_PIN.
 *
 * Not behind the admin auth wall on purpose — the PIN is the gate. This
 * means the link can be saved to a phone home screen without a login flow.
 */

import { ControlPanel } from './ControlPanel';

export const metadata = {
  title: 'Kiosk control',
};

export const dynamic = 'force-dynamic';

export default function KioskControlPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Kiosk control</h1>
        <p className="text-sm text-stone-400 mb-8">
          Remote PIN-gated control for the Adelaide exhibition kiosk. The kiosk polls every 5 seconds and reacts to the latest signal.
        </p>
        <ControlPanel />
      </div>
    </main>
  );
}
