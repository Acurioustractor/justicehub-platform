import { getAllClaims, getConfirmedTier1Orgs, getOversightRecommendations, getCharterCommitments } from '@/lib/civic-intelligence/queries';
import { formatCitation, type CivicClaim } from '@/lib/civic-intelligence/citation-format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Civic Intelligence · Advocacy Brief' };

export default async function CivicBriefPrintPage(props: {
  searchParams?: Promise<{ region?: string }>;
}) {
  const params = props.searchParams ? await props.searchParams : {};
  const region = params?.region || 'national';

  const [claims, oversight, commitments, tier1Qld, tier1Nt] = await Promise.all([
    getAllClaims(),
    getOversightRecommendations(25),
    getCharterCommitments(25),
    getConfirmedTier1Orgs('QLD'),
    getConfirmedTier1Orgs('NT'),
  ]);

  const accessClaims = Object.values(claims).filter((c) => c.chapter === 'access');
  const promiseClaims = Object.values(claims).filter((c) => c.chapter === 'promises');
  const oversightClaims = Object.values(claims).filter((c) => c.chapter === 'oversight');

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="print-brief">
      <style>{`
        @page { size: A4; margin: 0; }
        body { margin: 0; }
        .print-brief {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #1c1917;
          background: #fafaf9;
          padding: 0;
          max-width: 210mm;
          margin: 0 auto;
          font-size: 11pt;
          line-height: 1.5;
        }
        .pb-cover {
          padding: 30mm 20mm;
          page-break-after: always;
          background: #0c0a09;
          color: #fafaf9;
        }
        .pb-cover h1 { font-size: 36pt; line-height: 1.05; margin: 0 0 12mm; font-weight: 800; letter-spacing: -0.02em; }
        .pb-cover .kicker { font-family: 'IBM Plex Mono', monospace; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.2em; color: #a8a29e; margin-bottom: 6mm; }
        .pb-cover .sub { font-size: 14pt; max-width: 140mm; color: #d6d3d1; }
        .pb-cover .meta { margin-top: 20mm; font-family: 'IBM Plex Mono', monospace; font-size: 9pt; color: #78716c; }

        .pb-section { padding: 15mm 20mm; page-break-inside: avoid; }
        .pb-section + .pb-section { page-break-before: always; }
        .pb-chapter-label { font-family: 'IBM Plex Mono', monospace; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.2em; color: #78716c; }
        .pb-chapter-title { font-size: 28pt; line-height: 1.1; font-weight: 800; margin: 3mm 0 5mm; letter-spacing: -0.01em; }
        .pb-chapter-tagline { font-size: 13pt; color: #44403c; margin-bottom: 10mm; max-width: 150mm; }

        .pb-stat { border: 1px solid #d6d3d1; padding: 8mm; margin-bottom: 6mm; border-radius: 2mm; background: white; }
        .pb-stat-headline { background: #fef2f2; border-color: #fca5a5; }
        .pb-stat-positive { background: #ecfdf5; border-color: #6ee7b7; }
        .pb-stat-value { font-size: 22pt; font-weight: 800; line-height: 1.1; color: #1c1917; }
        .pb-stat-headline .pb-stat-value { font-size: 28pt; }
        .pb-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.18em; color: #78716c; margin-top: 3mm; }
        .pb-stat-context { font-size: 10pt; color: #57534e; margin-top: 2mm; }
        .pb-stat-citation { font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; color: #78716c; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #d6d3d1; }

        .pb-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
        .pb-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }

        .pb-list { margin: 4mm 0; padding: 0; list-style: none; }
        .pb-list li { padding: 3mm 0; border-bottom: 1px solid #e7e5e4; font-size: 10pt; }
        .pb-list li:last-child { border-bottom: none; }
        .pb-list .label { font-family: 'IBM Plex Mono', monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.15em; color: #78716c; margin-right: 2mm; }

        .pb-sub { font-family: 'IBM Plex Mono', monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.18em; color: #78716c; margin: 10mm 0 3mm; }

        .pb-tier-1 { columns: 2; column-gap: 8mm; font-size: 9pt; line-height: 1.5; }
        .pb-tier-1 .item { break-inside: avoid; padding: 1mm 0; }
        .pb-tier-1 .item .ind { font-family: 'IBM Plex Mono', monospace; font-size: 7pt; color: #92400e; background: #fef3c7; padding: 0 1mm; border-radius: 1mm; margin-left: 2mm; }

        .pb-methodology { padding: 15mm 20mm; background: #f5f5f4; color: #44403c; font-size: 10pt; }
        .pb-methodology h2 { font-size: 14pt; margin: 0 0 4mm; color: #1c1917; }
        .pb-methodology p { margin: 3mm 0; }

        @media print {
          .pb-cover { min-height: 297mm; box-sizing: border-box; }
          .pb-section { break-inside: avoid; }
        }
      `}</style>

      {/* Cover */}
      <section className="pb-cover">
        <div className="kicker">JusticeHub · Civic Intelligence · v1</div>
        <h1>Three chapters on the access gap.</h1>
        <p className="sub">What governments said. Where the money went. What oversight bodies recommended.</p>
        <p className="meta">
          Region: {region} · Computed {today}<br />
          Full methodology: justicehub.com.au/intelligence/civic/methodology
        </p>
      </section>

      {/* Chapter 1: Access */}
      <section className="pb-section">
        <div className="pb-chapter-label">Chapter 01 · Access</div>
        <h2 className="pb-chapter-title">Where the money goes when government talks about fixing youth justice.</h2>
        <p className="pb-chapter-tagline">The headline ratio compares dollars not meetings. The diary register simply did not contain the evidence the meeting ratio framing needed.</p>

        {accessClaims.map((c, i) => (
          <BriefStat key={c.claim_id} claim={c} index={i} />
        ))}

        <h3 className="pb-sub">Confirmed Tier 1 universe · {tier1Qld.length + tier1Nt.length} organisations</h3>
        <div className="pb-tier-1">
          {[...tier1Qld, ...tier1Nt].map((o: any) => (
            <div key={o.organization_id} className="item">
              {o.org_name} <span style={{ color: '#a8a29e', fontFamily: 'IBM Plex Mono, monospace', fontSize: '7pt' }}>{o.state}</span>
              {o.is_indigenous_org && <span className="ind">indigenous</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Chapter 2: Promises */}
      <section className="pb-section">
        <div className="pb-chapter-label">Chapter 02 · Promises</div>
        <h2 className="pb-chapter-title">What governments said they would do.</h2>
        <p className="pb-chapter-tagline">Public charter pledges, parliamentary statements, and funding commitments. The question is not whether the words were spoken. The question is whether the words travelled to action.</p>

        {promiseClaims.map((c) => <BriefStat key={c.claim_id} claim={c} />)}

        <h3 className="pb-sub">Sample of tracked commitments</h3>
        <ul className="pb-list">
          {commitments.slice(0, 6).map((c: any, i: number) => (
            <li key={i}>
              <span className="label">{c.status || 'status unknown'}</span>
              {c.commitment_text}
            </li>
          ))}
        </ul>
      </section>

      {/* Chapter 3: Oversight */}
      <section className="pb-section">
        <div className="pb-chapter-label">Chapter 03 · Oversight</div>
        <h2 className="pb-chapter-title">What independent reviewers recommended.</h2>
        <p className="pb-chapter-tagline">Recommendations from named bodies. Government dispositions in the government's own words. The page does not editorialise. It tracks what happened next.</p>

        {oversightClaims.map((c) => <BriefStat key={c.claim_id} claim={c} />)}

        <h3 className="pb-sub">Sample of recommendations</h3>
        <ul className="pb-list">
          {oversight.slice(0, 6).map((r: any) => (
            <li key={r.id}>
              <span className="label">{r.status || 'status unknown'}</span>
              <strong>{r.oversight_body}:</strong> {r.recommendation_text}
            </li>
          ))}
        </ul>
      </section>

      {/* Methodology / sources */}
      <section className="pb-methodology">
        <h2>How to audit any claim on this page</h2>
        <p>
          Every snapshot stat carries a claim_id that maps to a row in <code>civic_intelligence_claims</code>. The methodology page lists the SQL or computation that produced each value, the source record IDs used, and the timestamp the claim was last computed.
        </p>
        <p>
          v1 covers NT and QLD only. Other states are marked "coming v2". The Tier 1 list is hand-confirmed by JusticeHub against a published definition; Tier 2 and Tier 3 are documented in the methodology but not visualised as primary claims in v1.
        </p>
        <p>
          Full methodology: <strong>justicehub.com.au/intelligence/civic/methodology</strong><br />
          Audit-trail requests: <strong>civic@justicehub.com.au</strong>
        </p>
      </section>
    </div>
  );
}

function BriefStat({ claim, index }: { claim: CivicClaim; index?: number }) {
  const isHeadline = index === 0 && claim.claim_id.includes('ratio.consultancy_vs_tier1');
  const accent = isHeadline ? 'pb-stat-headline' : claim.claim_id.includes('tier_1_grant') ? 'pb-stat-positive' : '';
  const value = claim.value_text || (claim.value_numeric != null ? String(claim.value_numeric) : 'n/a');
  const isInsufficient = value.toLowerCase().includes('insufficient');
  return (
    <div className={`pb-stat ${accent}`}>
      <div className="pb-stat-value" style={isInsufficient ? { color: '#a8a29e', fontStyle: 'italic', fontSize: '14pt' } : {}}>{value}</div>
      <div className="pb-stat-label">{claim.display_label}</div>
      <div className="pb-stat-citation">{formatCitation(claim)}</div>
    </div>
  );
}
