'use client';

import { useState } from 'react';

const PASSCODE = 'contained2026';

// ── Funder Portfolio Data ──

const DUSSELDORP = {
  name: 'Dusseldorp Forum',
  founded: '1997',
  approach: 'Place-based, long-term relationships, First Nations leadership, climate justice',
  philosophy: 'Three strategic pillars: Education Grounded in Place (33%), Climate & Environment (37%), and First Nations Leading Change (30%). 30% of giving goes to First Nations-led initiatives — 30x the sector average. Climate giving tripled from $225K (2023) to $675K (2025). Member of Mannifera Collective since 2022. Committed to 10+ year partnerships.',
  totalTracked: '~$1.75M/year (2025)',
  firstNationsShare: '30%',
  keyPeople: [
    { name: 'Teya Dusseldorp', role: 'Executive Director' },
    { name: 'Tom Dusseldorp', role: 'Board Chair' },
    { name: 'Scarlett Steven', role: 'Programs — coordinating CONTAINED tour' },
    { name: 'Margot Beach', role: 'Programs — accepted meeting Mar 20' },
  ],
  portfolio: [
    { name: 'Nawarddeken Academy', location: 'West Arnhem Land, NT', type: 'Education / First Nations', indigenous: true, detail: '10+ year partnership. Secondary school at Manmoyi and Mamardawerre outstations. First time senior students in Warddeken IPA accessed formal secondary education on homelands.' },
    { name: 'Homeland School Company', location: 'Djelk IPA, NT', type: 'Education / First Nations', indigenous: true, detail: 'First independent primary school in Djelk IPA opening early 2026. Custom curriculum grounded in intergenerational knowledge and seasonal calendar.' },
    { name: 'Karrkad Kanjdji Trust (KKT)', location: 'West & Central Arnhem Land', type: 'First Nations / Conservation', indigenous: true, detail: 'Shared resource for 8 First Nations community-controlled organisations. 50,000+ sq km of land and sea Country. "Educating future custodians" funding pillar.' },
    { name: 'Yoorrook Justice Commission', location: 'Victoria', type: 'Truth-telling / Justice', indigenous: true, detail: 'Australia\'s first formal truth-telling inquiry. Independent digital platform for testimony. Walk for Truth — 500+ km Portland to Parliament. First Treaty signed Nov 2025.' },
    { name: 'Woor-Dungin', location: 'Victoria', type: 'Systems change / First Nations', indigenous: true, detail: 'Decolonising Wealth: Cultural Audit & Toolkit. Cultivating Connections Forum. "Changing systems because it is the right thing to do." — Shaun Middlebrook' },
    { name: 'Mounty Yarns (MAYCS)', location: 'Mt Druitt, NSW', type: 'Youth / Community', indigenous: true, detail: 'Youth programs, advocacy, community engagement. Young people as leaders driving systems change. CONTAINED Room 3 anchor for Mt Druitt.' },
    { name: 'IndigiGrow', location: 'La Perouse, NSW', type: 'First Nations enterprise', indigenous: true, detail: 'First Nations-owned nursery and social enterprise. Bringing back native plants that shaped the landscape and Aboriginal lives for thousands of years.' },
    { name: 'Wilya Janta', location: 'Tennant Creek, NT', type: 'Housing / First Nations', indigenous: true, detail: 'First Explain Home lands Dec 2025. Community-designed homes shaped by culture, climate and community leadership. New standards for remote Aboriginal housing.' },
    { name: 'Groundswell Giving — Caring for Country', location: 'National', type: 'Climate / First Nations', indigenous: false, detail: '$1M generated for 30 First Nations-led climate initiatives. Spawned Just Futures Collab — Aboriginal-led giving circle for climate justice.' },
    { name: 'Supercharge Australia', location: 'National', type: 'Climate / Innovation', indigenous: false, detail: '41 startups supported. A$100M+ raised. Innovation Challenge Awards. Liberate Minerals recognised for low-emissions critical mineral processing.' },
    { name: 'Surfers for Climate', location: 'NSW', type: 'Climate / Advocacy', indigenous: false, detail: 'SAVE BEACHWATCH campaign. NSW Government recommitted funding for water quality testing on Sydney beaches.' },
    { name: 'Mannifera Collective', location: 'National', type: 'Democracy / Collective giving', indigenous: false, detail: '27 members, $5.6M in grants to 67 civil society orgs over 5 years. Democracy 100 roundtables in Adelaide and Perth. 90+ connection events.' },
    { name: 'PLACE', location: 'National (53 places)', type: 'Place-based', indigenous: false, detail: 'Community Roadshow visiting 53 places, engaging 75 initiatives. "From the Ground Up" content series. Co-investment with PRF, Ian Potter, Bryan Foundation, Commonwealth.' },
    { name: 'Accountable Futures Collective', location: 'National', type: 'Youth / Systems change', indigenous: false, detail: 'NEW partner Sep 2025. Young people and adults solving the accountability void — gap between promises and reality. Tasha Ritchie as Youth Engagement Coordinator.' },
    { name: 'Our Place (Colman Foundation)', location: 'Victoria', type: 'Education', indigenous: false, detail: 'Schools as central hubs for learning and wrap-around support. Evaluation report showed increased participation and family connection.' },
    { name: 'Learning the Macleay', location: 'Macleay Valley, NSW', type: 'Education / Place-based', indigenous: false, detail: 'Yuwa Nyinda Youth Summit: 140 community leaders, 384 young people across 27 cultural backgrounds sharing what they need.' },
    { name: 'Centre for Public Impact', location: 'National', type: 'Storytelling', indigenous: false, detail: 'Four Story Circles connecting theory and practice. Story-kit for changemakers distilling years of research into stories\' power to transform systems.' },
    { name: 'ChangeFest', location: 'Walayup, WA', type: 'Place-based', indigenous: false, detail: 'Nov 2025 in Walayup WA. Connecting partners to build thriving, just and resilient communities shaped by the people who live there.' },
    { name: 'UTS Impact Studios / Hey History!', location: 'National', type: 'Education / Media', indigenous: false, detail: 'Walk for Truth curriculum episode. Gold Signal Podcast Award (Kids Single Episode). Stage 2-3 history learning on truth-telling and Treaty.' },
  ],
  strengths: [
    'Deep, long-term relationships — 10+ year Arnhem Land partnership',
    '30% First Nations allocation — 30x the sector average',
    'Climate giving tripled in 2 years ($225K → $675K)',
    'Mannifera network leverages $5.6M across 27 funders',
    'PLACE co-investment shows ability to coordinate at scale',
    'Already connected to CONTAINED tour (Scarlett coordinating)',
  ],
  gaps: [
    'No digital infrastructure connecting their 19+ partners',
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
  { name: 'PLACE Initiative', detail: 'PRF is anchor funder ($38.6M co-investment). Dusseldorp contributes + visited 53 places in 2025 Community Roadshow. The biggest co-investment in Australian place-based philanthropy.' },
  { name: 'Our Place (Colman Foundation)', detail: 'PRF funds Place-Based Education ($13.5M). Dusseldorp also supports. Schools as community hubs model — evaluation showed increased participation and family connection.' },
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
            Dusseldorp Forum (~$1.75M/year across 19 partners) and Paul Ramsay Foundation ($320M/year, 15 JR sites)
            represent two fundamentally different models of philanthropic investment. One invests deeply in places
            and relationships over decades. The other deploys transformative capital at national scale. They share
            grantees, co-invest in PLACE, and both fund organisations connected to the CONTAINED tour.
          </p>
          <p style={{ fontSize: '1.05rem', color: '#ccc', maxWidth: 700, lineHeight: 1.7, marginTop: 16 }}>
            This page maps both portfolios — built from Dusseldorp&apos;s Year in Review 2025 and PRF&apos;s public reporting — and shows where JusticeHub connects them.
          </p>
        </section>

        {/* Side by side comparison strip */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#222' }}>
            <div style={{ background: '#0A0A0A', padding: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Dusseldorp Forum</p>
              <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5, marginBottom: 0 }}>
                Three pillars: Education (33%), Climate (37%), First Nations (30%). 19 partners. 10+ year commitments. Patient capital through Mannifera&apos;s 27-funder network. Funds the <em>community</em> side.
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

        {/* ═══ THE MONEY — What we actually track ═══ */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 60px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Follow the money — what JusticeHub actually tracks
          </p>
          <p style={{ fontSize: '0.95rem', color: '#888', maxWidth: 700, lineHeight: 1.7, marginBottom: 24 }}>
            These are verified funding records from government sources, AusTender, NIAA, state grants portals,
            and philanthropic disclosures — flowing through the same organisations both funders support.
          </p>

          {/* Mounty Yarns example */}
          <div style={{ border: '1px solid #333', padding: 24, marginBottom: 16, background: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Mounty Yarns — full funding picture</h3>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#059669' }}>$4.3M tracked</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { source: 'Australian Government (Justice Reinvestment)', amount: '$2.3M', year: '2023-24', note: 'Federal JR funding — Mounty Yarns + Just Reinvest NSW joint' },
                { source: 'NSW Government', amount: '$1.0M', year: '2023-24', note: 'State government direct' },
                { source: 'Philanthropic (including Dusseldorp)', amount: '$1.0M', year: '2022-23', note: '3 separate grants — Dusseldorp is primary funder' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: '#059669', marginBottom: 0 }}>{f.amount}</p>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: 0 }}>{f.year}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: 2 }}>{f.source}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: 0 }}>{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 12, fontStyle: 'italic', marginBottom: 0 }}>
              7 programs mapped in ALMA. Indigenous-led. Mt Druitt. CONTAINED Room 3 anchor.
              Funded by Dusseldorp (philanthropic), Australian Government (JR), and NSW Government — three sources, one community org.
            </p>
          </div>

          {/* Maranguka example */}
          <div style={{ border: '1px solid #333', padding: 24, marginBottom: 16, background: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Maranguka (Bourke) — where both funders meet</h3>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#F5F0E8' }}>$3.87M tracked</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { source: 'Paul Ramsay Foundation (JR Portfolio)', amount: '$3.54M', year: '2021-25', note: 'PRF JR allocation — one of 15 sites nationally' },
                { source: 'NIAA (Federal — Senate Order 16)', amount: '$331K', year: '2024-25', note: 'National Indigenous Australians Agency direct funding' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#DC2626' : '#059669', marginBottom: 0 }}>{f.amount}</p>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: 0 }}>{f.year}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: 2 }}>{f.source}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: 0 }}>{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 12, fontStyle: 'italic', marginBottom: 0 }}>
              The original Australian JR site. Dusseldorp funds Just Reinvest NSW (which coordinates Bourke).
              PRF funds Maranguka directly. NIAA provides federal Indigenous funding. Three funders, one community, no shared data layer.
            </p>
          </div>

          {/* PLACE */}
          <div style={{ border: '1px solid #333', padding: 24, marginBottom: 16, background: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>PLACE — the co-investment</h3>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#F5F0E8' }}>$38.6M tracked</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { source: 'Philanthropic consortium (PRF anchor)', amount: '$19.3M', year: '2024-34', note: 'PRF, Ian Potter, Bryan Foundation, Dusseldorp — 10-year commitment' },
                { source: 'Commonwealth Government (matched)', amount: '$19.3M', year: '2024-34', note: 'Federal government matched the philanthropic consortium dollar-for-dollar' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#DC2626' : '#059669', marginBottom: 0 }}>{f.amount}</p>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: 0 }}>{f.year}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: 2 }}>{f.source}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: 0 }}>{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 12, fontStyle: 'italic', marginBottom: 0 }}>
              The National Centre for Place-Based Collaboration. The most ambitious co-investment in Australian place-based philanthropy.
              PRF is the anchor funder. Dusseldorp contributes. Commonwealth matches. 6 sites over 10 years.
              This is what happens when funders coordinate — and exactly what JusticeHub makes visible across the whole system.
            </p>
          </div>

          {/* ALS — government + philanthropic */}
          <div style={{ border: '1px solid #333', padding: 24, marginBottom: 16, background: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Aboriginal Legal Service (NSW/ACT)</h3>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#F5F0E8' }}>$4.13M tracked</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { source: 'Paul Ramsay Foundation (JR Portfolio)', amount: '$3.54M', year: '2021-25', note: 'PRF JR allocation' },
                { source: 'AusTender (Federal contract)', amount: '$586K', year: '2025-26', note: 'Commonwealth government direct procurement' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? '#DC2626' : '#059669', marginBottom: 0 }}>{f.amount}</p>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: 0 }}>{f.year}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: 2 }}>{f.source}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: 0 }}>{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 12, fontStyle: 'italic', marginBottom: 0 }}>
              PRF funds the JR work. Commonwealth funds the legal service. Without JusticeHub, these funding streams are invisible to each other.
            </p>
          </div>

          {/* Summary */}
          <div style={{ border: '1px solid #F5F0E8', padding: 24, background: '#0A0A0A', marginTop: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>The total picture across both ecosystems</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#222', marginBottom: 16 }}>
              {[
                { n: '$314M+', label: 'Total funding tracked', color: '#F5F0E8' },
                { n: '13', label: 'Funding sources', color: '#F5F0E8' },
                { n: '60+', label: 'Orgs funded', color: '#059669' },
                { n: '4', label: 'Shared grantees', color: '#DC2626' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0A0A0A', padding: '16px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color, marginBottom: 0 }}>{s.n}</p>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: '#666', textTransform: 'uppercase', marginBottom: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: 1.6, marginBottom: 0 }}>
              This is money from Dusseldorp ($1.75M/year, 19 partners), PRF ($53.1M JR), PLACE ($38.6M co-investment),
              Commonwealth, NIAA, AusTender, QLD/NSW state governments — all flowing through organisations that both funders support.
              No single funder sees the full picture. JusticeHub does.
            </p>
          </div>
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
                  ['Scale', '~$1.75M/year (2025)', '$320M/year ($53M JR)'],
                  ['Theory of change', 'Place-based, long-term relationships, three pillars', 'Justice reinvestment — redirect funding from prisons to communities'],
                  ['Unit of investment', 'Places, relationships, 10+ year commitments', 'Sites and systems'],
                  ['First Nations', '30% of giving ($524K) — 30x sector avg', 'Significant (8/15 JR sites are Indigenous-led)'],
                  ['Climate', '37% of giving ($675K) — tripled since 2023', 'Not a focus area'],
                  ['Evidence model', 'Stories, lived experience, practice wisdom', 'Evaluation frameworks, data, JR Community of Practice'],
                  ['Network leverage', 'Mannifera: 27 funders, $5.6M to 67 orgs', 'JR Community of Practice, 15 sites'],
                  ['Indirect costs', 'Unknown', '30% — "Paying What It Costs" policy'],
                  ['Power reflection', 'Scaling Deep (Tatiana Fraser). Haumanu Framework.', 'Explicit — Kristy Muir\'s "Power" letter Feb 2026'],
                  ['CONTAINED connection', 'Scarlett coordinating Mt Druitt. Teya = lead funder ask.', 'Jonas + William visited Oct 2025. Robert Tickner on tour.'],
                  ['JusticeHub value', 'Connect 19 partners. Make YIR portfolio visible with evidence.', 'Shared data layer for 15 JR sites. PICC as missing piece.'],
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
              Dusseldorp&apos;s 19 partners don&apos;t know what PRF&apos;s 15 JR sites are learning, and vice versa.
              Mannifera&apos;s 27-funder network has no shared evidence layer. The JR Community of Practice meets monthly
              but has no platform connecting outcomes across sites. A $1.75M funder and a $320M funder — 180x difference
              in scale — both investing in the same communities without seeing each other&apos;s work.
            </p>
            <p style={{ fontSize: '1rem', color: '#888', lineHeight: 1.7, marginBottom: 16 }}>
              JusticeHub is that layer. 1,076 community programs mapped. 824 with cost data. 570 evidence records.
              Every organisation funded by either funder can see what&apos;s working elsewhere — not through a report
              that arrives 18 months later, but through a living platform updated by community.
            </p>
            <p style={{ fontSize: '1rem', color: '#ccc', lineHeight: 1.7, fontWeight: 500 }}>
              The question for both funders: would your portfolio be stronger if every grantee could see what the others are learning?
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 32 }}>
            {[
              { label: 'For Dusseldorp', items: ['Connect 19 YIR partners with evidence + cost data', 'Arnhem Land education outcomes visible nationally', 'Mannifera network\'s $5.6M impact mapped', 'CONTAINED tour integrated with JusticeHub stories'] },
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
