/**
 * /kiosk/card — printable A6 take-away card.
 *
 * Server-rendered. Opens in a new tab (or print modal) from the kiosk's
 * email-capture footer. Visitor taps "Take a card" → prints from kiosk
 * (if a printer is attached) or photographs the screen.
 *
 * Layout: A6 portrait (105mm × 148mm), one-page. QR code links to the
 * current /kiosk URL so a phone scan returns the visitor home.
 *
 * Why print and not just QR-on-screen: some visitors don't have a phone
 * camera handy; a physical card lasts longer than memory.
 */

import QRCode from 'qrcode';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const revalidate = 600;

async function getCardData() {
  const supabase = createServiceClient() as any;
  const [tri, total, accos, tier1] = await Promise.all([
    supabase
      .from('v_claim_evidence_summary')
      .select('claim_id', { count: 'exact', head: true })
      .eq('triangulation_tier', 'triangulated'),
    supabase.from('v_claim_evidence_summary').select('claim_id', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('acco_certified', true)
      .eq('is_active', true),
    supabase
      .from('civic_org_classifications')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 1)
      .not('confirmed_at', 'is', null),
  ]);
  return {
    triangulated: tri.count || 0,
    totalClaims: total.count || 0,
    accos: accos.count || 0,
    tier1: tier1.count || 0,
  };
}

export default async function CardPage() {
  const counts = await getCardData();
  const url = 'https://justicehub.com.au/intelligence/civic/centre-of-excellence';
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: { dark: '#0A0A0A', light: '#F5F0E8' },
    errorCorrectionLevel: 'M',
  });

  return (
    <html lang="en">
      <head>
        <title>Take this with you · JusticeHub Centre of Excellence</title>
        <style>{`
          @page { size: A6 portrait; margin: 6mm; }
          body { font-family: 'Space Grotesk', -apple-system, system-ui, sans-serif; margin: 0; background: #F5F0E8; color: #0A0A0A; }
          .card { width: 105mm; height: 148mm; padding: 8mm; box-sizing: border-box; display: flex; flex-direction: column; background: #F5F0E8; }
          .kicker { font-family: 'IBM Plex Mono', monospace; font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: #555; margin: 0 0 4mm 0; }
          h1 { font-size: 13pt; font-weight: 700; line-height: 1.15; margin: 0 0 4mm 0; max-width: 88mm; }
          h1 em { font-style: normal; color: #059669; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 0 0 5mm 0; }
          .stat { border-left: 1mm solid #059669; padding-left: 2.5mm; }
          .stat .n { font-size: 18pt; font-weight: 700; line-height: 1; }
          .stat .l { font-family: 'IBM Plex Mono', monospace; font-size: 6pt; letter-spacing: 0.18em; text-transform: uppercase; color: #555; margin-top: 1.5mm; line-height: 1.25; }
          .punch { border-top: 0.4mm solid #0A0A0A; padding-top: 3mm; margin-top: auto; }
          .ratio-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.5mm; font-size: 8pt; }
          .ratio-row .v { font-weight: 700; }
          .ratio-row.detention .v { color: #DC2626; }
          .ratio-row.community .v { color: #059669; }
          .ratio-final { font-size: 16pt; font-weight: 700; margin-top: 2mm; }
          .qr-row { display: flex; align-items: flex-end; gap: 4mm; margin-top: 5mm; }
          .qr-row svg { width: 22mm; height: 22mm; flex-shrink: 0; }
          .qr-row .meta { font-family: 'IBM Plex Mono', monospace; font-size: 6pt; line-height: 1.4; color: #555; }
          .qr-row .meta .url { color: #0A0A0A; font-weight: 600; word-break: break-all; }
          .print-controls { padding: 20px; background: #0A0A0A; color: white; text-align: center; }
          .print-controls button { font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 14px; padding: 12px 24px; min-height: 44px; border: 0; background: #059669; color: white; border-radius: 6px; cursor: pointer; margin: 0 6px; font-weight: 600; letter-spacing: 0.05em; }
          .print-controls button.secondary { background: transparent; border: 1px solid white; }
          .print-controls .hint { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.7; margin-bottom: 12px; }
          @media print {
            .print-controls { display: none; }
            html, body { background: white; }
          }
        `}</style>
      </head>
      <body>
        <div className="print-controls">
          <p className="hint">Take this with you · A6 print</p>
          <button onClick="window.print()">Print this card</button>
          <button className="secondary" onClick="window.close()">Close</button>
        </div>
        <article className="card">
          <p className="kicker">JusticeHub · Centre of Excellence for Youth Justice</p>
          <h1>
            Every fact here earns its headline by <em>multiple independent sources</em>.
          </h1>
          <div className="stats">
            <div className="stat">
              <div className="n">{counts.triangulated}</div>
              <div className="l">Triangulated claims</div>
            </div>
            <div className="stat">
              <div className="n">{counts.totalClaims}</div>
              <div className="l">Sourced facts</div>
            </div>
            <div className="stat">
              <div className="n">{counts.tier1}</div>
              <div className="l">Confirmed Tier 1 orgs</div>
            </div>
            <div className="stat">
              <div className="n">{counts.accos.toLocaleString()}</div>
              <div className="l">Named ACCOs</div>
            </div>
          </div>
          <div className="punch">
            <div className="ratio-row detention">
              <span>Detention, per child / year</span>
              <span className="v">$1,330,000</span>
            </div>
            <div className="ratio-row community">
              <span>Community supervision</span>
              <span className="v">$36,869</span>
            </div>
            <div className="ratio-final">= 32× cheaper to support than to lock up.</div>
          </div>
          <div className="qr-row">
            <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div className="meta">
              <div>Scan to see the full evidence trail · sources by name · who is doing the work near you.</div>
              <div className="url" style={{ marginTop: '2mm' }}>justicehub.com.au/intelligence/civic/centre-of-excellence</div>
            </div>
          </div>
        </article>
      </body>
    </html>
  );
}
