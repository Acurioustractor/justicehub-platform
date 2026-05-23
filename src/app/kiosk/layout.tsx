/**
 * Outer kiosk shell. Hosts the email-capture footer but NOT the lens bar
 * (because the hook screen at /kiosk has no bar; the bar lives in
 * /kiosk/lenses/layout.tsx).
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JusticeHub kiosk — Centre of Excellence for Youth Justice',
  description: 'Touchscreen surface for the Adelaide exhibition. Every fact backed by independent sources.',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {children}
    </div>
  );
}
