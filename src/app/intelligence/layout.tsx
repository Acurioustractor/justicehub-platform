import { Suspense } from 'react';
import { KioskReturnBanner } from '@/components/kiosk/KioskReturnBanner';

/**
 * Intelligence Layout
 *
 * NOTE: This layout is intentionally minimal. Each Intelligence page
 * renders its own Navigation/Footer to maintain full control over
 * page structure and avoid double-header issues.
 *
 * KioskReturnBanner mounts here so any /intelligence/* page reached from
 * the kiosk (?from=kiosk) carries a "Return to kiosk" affordance. The
 * banner returns null when the param is missing, so it's a no-op elsewhere.
 */
export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <KioskReturnBanner />
      </Suspense>
      {children}
    </>
  );
}
