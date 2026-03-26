'use client';

import { useState } from 'react';

const PASSCODE = 'contained2026';

// ── Funder Portfolio Data ──

const DUSSELDORP = {
  name: 'Dusseldorp Forum',
  founded: '1997',
  approach: 'Place-based, narrative practice, direct community relationships',
  philosophy: 'Invest deeply in places and people. 30% of funding goes to First Nations organisations — 30x the sector average. Believes in long-term, trust-based relationships over competitive grant rounds.',
  totalTracked: '~$15-20M active portfolio',
  firstNationsShare: '30%',
  keyPeople: [
    { name: 'Teya Dusseldorp', role: 'CEO' },
    { name: 'Scarlett Steven', role: 'Programs — coordinating CONTAINED tour' },
    { name: 'Margot Beach', role: 'Programs — accepted meeting Mar 20' },
    { name: 'Jessica Duffy', role: 'Team — responded to campaign' },
  ],
  portfolio: [
    { name: 'Mounty Yarns', location: 'Mt Druitt, NSW', type: 'Narrative practice', indigenous: true, detail: '7 programs. Youth storytelling. Dual-funded. Documentary in production. CONTAINED Room 3 anchor for Mt Druitt.' },
    { name: 'Just Reinvest NSW', location: 'Bourke / Mt Druitt / Kempsey / Moree', type: 'Justice reinvestment', indigenous: true, detail: '11 programs across 4 sites. Maranguka model in Bourke = the original Australian JR proof point.' },
    { name: 'PLACE Initiative', location: 'National (6 sites)', type: 'Place-based co-investment', indigenous: false, detail: '$38.6M co-investment with PRF, Ian Potter, Bryan Foundation, Commonwealth. The most ambitious place-based investment in Australian philanthropy.' },
    { name: 'Dulwich Centre Foundation', location: 'Adelaide, SA', type: 'Narrative therapy', indigenous: false, detail: 'Narrative practice pioneer. Michael White\'s legacy. Therapeutic framework used across Dusseldorp\'s portfolio.' },
    { name: 'Mannifera Collective', location: 'Melbourne, VIC', type: 'Systems change', indigenous: false, detail: 'Systems thinking, collective impact. Connected to Dusseldorp\'s approach to structural change.' },
    { name: 'Groundswell Foundation', location: 'Sydney, NSW', type: 'Community development', indigenous: false, detail: 'Grassroots community development. Aligned with Dusseldorp\'s place-based philosophy.' },
    { name: 'Big Picture Education', location: 'National', type: 'Education', indigenous: false, detail: 'Alternative education model. Schools where kids design their own learning. ~40 schools nationally.' },
    { name: 'Wilya Janta', location: 'Tennant Creek, NT', type: 'Housing', indigenous: true, detail: 'Dusseldorp-funded housing project in Tennant Creek. Connected to Oonchiumpa and Central Arrernte community.' },
  ],
  strengths: [
    'Deep, long-term relationships with communities',
    '30% First Nations allocation — sector-leading',
    'PLACE co-investment shows ability to coordinate with other funders',
    'Narrative practice framework = coherent theory of change',
    'Already connected to CONTAINED tour (Scarlett coordinating)',
  ],
  gaps: [
    'No digital infrastructure connecting their portfolio',
    'Funded organisations don\'t have a shared evidence base',
    'No public-facing data on what their programs achieve',
    'Philanthropy ecosystem not visible — funders can\'t see overlaps',
  ],
};

const PRF = {
  name: 'Paul Ramsay Foundation',
  founded: '2014 (Paul Ramsay bequest)',
  approach: 'Justice reinvestment, systems change, large-scale structural investment',
  philosophy: 'Australia\'s largest private foundation ($3B+ corpus). Committed to "breaking cycles of disadvantage." Justice reinvestment is a core strategy — funding 15 JR sites nationally. "Paying What It Costs" policy = 30% indirect cost standard.',
  totalTracked: '$53.1M (JR portfolio) / $320M+ annual total',
  firstNationsShare: 'Significant but not published as %',
  keyPeople: [
    { name: 'Prof Kristy Muir', role: 'CEO — wrote "Power" letter on philanthropic influence Feb 2026' },
    { name: 'Jonas Kubitscheck', role: 'Programs — visited Container Oct 2025' },
    { name: 'William Frazer', role: 'Programs — visited Container Oct 2025 with Jonas' },
    { name: 'Julia Payne', role: 'Thriving Communities — PICC/Townsville geography' },
  ],
  portfolio: [
    { name: 'Maranguka / Just Reinvest NSW', location: 'Bourke, NSW', type: 'Justice reinvestment', indigenous: true, detail: 'The original Australian JR site. Bourke model. $3.54M PRF allocation. Also funded by Dusseldorp.' },
    { name: 'Olabud Doogethu', location: 'Halls Creek, WA', type: 'Justice reinvestment', indigenous: true, detail: 'JR site in remote WA. $3.54M. In CONTAINED Perth stop as Room 3 org.' },
    { name: 'Yuwaya Ngarra-li / UNSW', location: 'Moree, NSW', type: 'Justice reinvestment', indigenous: true, detail: 'Academic partnership JR model. UNSW partnership. $3.54M.' },
    { name: 'Tiraapendi Wodli / Red Cross', location: 'Adelaide, SA', type: 'Justice reinvestment', indigenous: true, detail: 'Port Adelaide JR site via Red Cross. $3.54M.' },
    { name: 'Anindilyakwa Royalties Aboriginal Corporation', location: 'Groote Eylandt, NT', type: 'Justice reinvestment', indigenous: true, detail: 'Remote NT community. $3.54M. Indigenous-owned royalties corporation.' },
    { name: 'Social Reinvestment WA', location: 'Perth, WA', type: 'Justice reinvestment', indigenous: false, detail: 'WA-wide JR advocacy and coordination. $3.54M.' },
    { name: 'Justice Reform Initiative', location: 'National', type: 'Advocacy', indigenous: false, detail: 'Robert Tickner as Chair. National JR advocacy. Connected to CONTAINED tour.' },
    { name: 'Change the Record', location: 'National', type: 'Advocacy', indigenous: true, detail: 'Aboriginal and Torres Strait Islander-led. Closing the Gap on incarceration.' },
    { name: 'Human Rights Law Centre', location: 'National', type: 'Legal advocacy', indigenous: false, detail: 'Legal strategy on justice reform. $3.54M.' },
    { name: 'Justice Reinvestment Network Australia', location: 'National', type: 'Network coordination', indigenous: false, detail: 'The JR network that connects all sites. $3.54M.' },
    { name: 'Aboriginal Legal Services (NSW/ACT)', location: 'NSW/ACT', type: 'Legal services', indigenous: true, detail: 'Aboriginal legal aid. $3.54M.' },
    { name: 'Justice and Equity Centre', location: 'National', type: 'Research', indigenous: false, detail: 'Formerly Law and Justice Foundation. Research on access to justice.' },
    { name: 'WEstjustice / CMY (Target Zero)', location: 'Melbourne, VIC', type: 'Youth diversion', indigenous: false, detail: 'Western suburbs youth diversion. Target Zero program.' },
    { name: 'NTCOSS', location: 'Darwin, NT', type: 'Peak body', indigenous: false, detail: 'NT Council of Social Service. JR coordination in NT.' },
  ],
  strengths: [
    '$3B+ corpus — can make transformative bets',
    '15 JR sites = genuine national network',
    '"Paying What It Costs" = 30% indirect costs (sector-leading)',
    'Kristy Muir\'s "Power" letter shows genuine self-reflection',
    'JR Community of Practice = shared learning infrastructure',
  ],
  gaps: [
    'No shared data platform across JR sites',
    'PICC (strongest proof point) has zero PRF funding despite being in their geography',
    'Portfolio is heavily intermediary/advocacy — less direct community org funding',
    'No public-facing evidence base connecting their investments',
  ],
};

// ── Shared / Overlapping investments ──
const SHARED = [
  { name: 'Just Reinvest NSW / Maranguka', detail: 'Both funders invest in Australia\'s original JR site. Dusseldorp funds the community side (Mounty Yarns, narrative practice). PRF funds the JR infrastructure.' },
  { name: 'PLACE Initiative', detail: 'PRF is anchor funder ($38.6M co-investment). Dusseldorp also contributes. The biggest co-investment in Australian place-based philanthropy.' },
  { name: 'Justice Reform Initiative', detail: 'PRF funds directly. Robert Tickner (JRI Chair) is in CONTAINED tour network. Dusseldorp connection through Scarlett Steven\'s logistics work.' },
];

// ── Components ──

function PasscodeGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  return (
    <div style={{ background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>CONTAINED</h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#666', marginBottom: 32 }}>Funder Landscape — March 2026</p>
        <form onSubmit={(e) => { e.preventDefault(); if (input === PASSCODE) { onAuth(); } else { setError(true); } }}>
          <input type="password" value={input} onChange={(e) => { setInput(e.target.value); setError(false); }} placeholder="Enter passcode" autoFocus
            style={{ background: '#1a1a1a', border: error ? '1px solid #DC2626' : '1px solid #333', color: '#F5F0E8', padding: '12px 16px', fontSize: '1rem', width: '100%', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }} />
          {error && <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: 8 }}>Incorrect passcode</p>}
          <button type="submit" style={{ marginTop: 16, background: '#F5F0E8', color: '#0A0A0A', padding: '12px 32px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', width: '100%' }}>Enter</button>
        </form>
      </div>
    </div>
  );
}

function FunderSection({ funder, color }: { funder: typeof DUSSELDORP; color: string }) {
  const [showAll, setShowAll] = useState(false);
  const indigenous = funder.portfolio.filter(p => p.indigenous);
  const nonIndigenous = funder.portfolio.filter(p => !p.indigenous);

  return (
    <div style={{ border: `1px solid ${color}30`, background: '#111', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{funder.name}</h2>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666' }}>Est. {funder.founded}</span>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: 1.6, marginBottom: 20 }}>{funder.philosophy}</p>

      {/* Key numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#222', marginBottom: 24 }}>
        <div style={{ background: '#0A0A0A', padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{funder.totalTracked}</p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>Portfolio tracked</p>
        </div>
        <div style={{ background: '#0A0A0A', padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{funder.firstNationsShare}</p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>First Nations allocation</p>
        </div>
      </div>

      {/* Key people */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Key people</p>
        <div style={{ display: 'grid', gap: 4 }}>
          {funder.keyPeople.map((p, i) => (
            <p key={i} style={{ fontSize: '0.8rem', marginBottom: 0 }}>
              <span style={{ fontWeight: 600, color: '#ddd' }}>{p.name}</span>
              <span style={{ color: '#666' }}> — {p.role}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Portfolio */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          Portfolio — {funder.portfolio.length} investments ({indigenous.length} First Nations)
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {(showAll ? funder.portfolio : funder.portfolio.slice(0, 6)).map((p, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${p.indigenous ? '#059669' : '#333'}`, padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ddd' }}>{p.name}</span>
                {p.indigenous && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#059669' }}>First Nations</span>}
              </div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#666', marginBottom: 4 }}>{p.location} · {p.type}</p>
              <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.4, marginBottom: 0 }}>{p.detail}</p>
            </div>
          ))}
        </div>
        {funder.portfolio.length > 6 && !showAll && (
          <button onClick={() => setShowAll(true)} style={{ background: 'none', border: 'none', color, fontSize: '0.8rem', cursor: 'pointer', marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
            Show all {funder.portfolio.length} →
          </button>
        )}
      </div>

      {/* Strengths & gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#059669', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Strengths</p>
          {funder.strengths.map((s, i) => (
            <p key={i} style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.5, paddingLeft: 12, position: 'relative', marginBottom: 4 }}>
              <span style={{ position: 'absolute', left: 0, color: '#059669' }}>+</span>{s}
            </p>
          ))}
        </div>
        <div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Gaps JusticeHub fills</p>
          {funder.gaps.map((g, i) => (
            <p key={i} style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.5, paddingLeft: 12, position: 'relative', marginBottom: 4 }}>
              <span style={{ position: 'absolute', left: 0, color: '#DC2626' }}>→</span>{g}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function LandscapePage() {
  const [authed, setAuthed] = useState(false);

  if (!authed) return <PasscodeGate onAuth={() => setAuthed(true)} />;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }}>

        {/* Hero */}
        <section style={{ padding: '80px 40px 40px', maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#666', marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Funder Landscape — Internal Analysis
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
            Two approaches to<br />justice reinvestment.
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#888', maxWidth: 700, lineHeight: 1.7 }}>
            Dusseldorp Forum and Paul Ramsay Foundation are the two most significant philanthropic investors
            in justice reinvestment in Australia. They share grantees, they co-invest in PLACE, and they both
            fund organisations now connected to the CONTAINED tour. But their approaches are fundamentally different.
          </p>
          <p style={{ fontSize: '1.05rem', color: '#ccc', maxWidth: 700, lineHeight: 1.7, marginTop: 16 }}>
            This page maps what we know about both portfolios and where JusticeHub connects them.
          </p>
        </section>

        {/* Side by side comparison strip */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#222' }}>
            <div style={{ background: '#0A0A0A', padding: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Dusseldorp Forum</p>
              <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5, marginBottom: 0 }}>
                Place-based. Narrative practice. Deep relationships. 30% First Nations. Smaller, patient capital. Funds the <em>community</em> side of JR.
              </p>
            </div>
            <div style={{ background: '#0A0A0A', padding: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Paul Ramsay Foundation</p>
              <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5, marginBottom: 0 }}>
                Systems change. Justice reinvestment infrastructure. $3B+ corpus. 15 JR sites nationally. Funds the <em>structural</em> side of JR.
              </p>
            </div>
          </div>
        </section>

        {/* Dusseldorp */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 40px' }}>
          <FunderSection funder={DUSSELDORP} color="#059669" />
        </section>

        {/* PRF */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 40px' }}>
          <FunderSection funder={PRF} color="#DC2626" />
        </section>

        {/* Where they overlap */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 60px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 20, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Where they overlap
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {SHARED.map((s, i) => (
              <div key={i} style={{ borderLeft: '2px solid #F5F0E8', padding: '12px 16px', background: '#111' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{s.name}</p>
                <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5, marginBottom: 0 }}>{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The approach comparison */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 60px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 20, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Approach comparison
          </p>
          <div style={{ border: '1px solid #333', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#1a1a1a' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dimension</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#059669', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase' }}>Dusseldorp</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#DC2626', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase' }}>PRF</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Scale', '~$15-20M active', '$320M/year ($53M JR)'],
                  ['Theory of change', 'Narrative practice — change the story, change the system', 'Justice reinvestment — redirect funding from prisons to communities'],
                  ['Unit of investment', 'Places and relationships', 'Sites and systems'],
                  ['First Nations', '30% of portfolio (stated)', 'Significant (8/15 JR sites are Indigenous-led)'],
                  ['Evidence model', 'Stories, lived experience, practice wisdom', 'Evaluation frameworks, data, JR Community of Practice'],
                  ['Intermediaries', 'Few — direct to community', 'Many — JRNA, HRLC, JRI, Change the Record'],
                  ['Indirect costs', 'Unknown', '30% — "Paying What It Costs" policy'],
                  ['Power reflection', 'Implicit — long-term trust', 'Explicit — Kristy Muir\'s "Power" letter Feb 2026'],
                  ['CONTAINED connection', 'Scarlett coordinating Mt Druitt. Teya = lead funder ask.', 'Jonas + William visited Oct 2025. Robert Tickner on tour.'],
                  ['JusticeHub value', 'Make portfolio visible. Connect Mounty Yarns to evidence.', 'Shared data layer for 15 JR sites. PICC as missing piece.'],
                ].map(([dim, d, p], i) => (
                  <tr key={i} style={{ borderTop: '1px solid #222' }}>
                    <td style={{ padding: '10px 16px', color: '#888', fontWeight: 600, verticalAlign: 'top' }}>{dim}</td>
                    <td style={{ padding: '10px 16px', color: '#ccc', verticalAlign: 'top' }}>{d}</td>
                    <td style={{ padding: '10px 16px', color: '#ccc', verticalAlign: 'top' }}>{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* What JusticeHub does for both */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px', borderTop: '1px solid #222', paddingTop: 60 }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
            What JusticeHub does for both
          </h2>
          <div style={{ maxWidth: 700 }}>
            <p style={{ fontSize: '1rem', color: '#888', lineHeight: 1.7, marginBottom: 16 }}>
              Neither funder has a shared data layer. Dusseldorp&apos;s portfolio organisations don&apos;t know what PRF&apos;s are learning,
              and vice versa. The JR Community of Practice meets monthly but has no platform connecting evidence across sites.
            </p>
            <p style={{ fontSize: '1rem', color: '#888', lineHeight: 1.7, marginBottom: 16 }}>
              JusticeHub is that layer. 1,117 community programs mapped. 824 with cost data. 570 evidence records.
              Every organisation funded by either funder can see what&apos;s working elsewhere — not through a report
              that arrives 18 months later, but through a living platform updated by community.
            </p>
            <p style={{ fontSize: '1rem', color: '#ccc', lineHeight: 1.7, fontWeight: 500 }}>
              The question for both funders: would your portfolio be stronger if every grantee could see what the others are learning?
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 32 }}>
            {[
              { label: 'For Dusseldorp', items: ['Mounty Yarns profile with evidence + cost data', 'All 4 NSW JR sites visible in one view', 'PLACE partner network mapped', 'CONTAINED tour integrated with JusticeHub stories'] },
              { label: 'For PRF', items: ['Shared data layer for 15 JR sites', 'PICC: 21 programs, zero PRF funding — the gap', 'JR Community of Practice gets a platform', 'Cross-site evidence comparison'] },
              { label: 'For both', items: ['Portfolio overlap visible (Just Reinvest, PLACE)', 'CivicScope tracks whether govt follows their investment', 'Community-verified evidence — not funder-commissioned', 'National discussion driven by community data'] },
            ].map((col, i) => (
              <div key={i} style={{ border: '1px solid #333', padding: 20 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: i === 0 ? '#059669' : i === 1 ? '#DC2626' : '#F5F0E8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{col.label}</p>
                {col.items.map((item, j) => (
                  <p key={j} style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5, marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#555' }}>·</span>{item}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ maxWidth: 1100, margin: '0 auto', padding: '40px', borderTop: '1px solid #222' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#444', lineHeight: 1.6 }}>
            Internal analysis by A Curious Tractor. Data from JusticeHub campaign engine, ACNC, public reporting, and direct engagement.
            Not for distribution without permission.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            <a href="/for-funders" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>Funder Hub →</a>
            <a href="/for-funders/report/dusseldorp" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>Dusseldorp Report →</a>
            <a href="/for-funders/report/prf" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>PRF Report →</a>
            <a href="/contained/community" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#DC2626', textDecoration: 'none' }}>Community Demand →</a>
          </div>
        </footer>
      </div>
    </>
  );
}
