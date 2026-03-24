'use client';

import { useState } from 'react';

const PASSCODE = 'contained2026';

export default function MomentumPage() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!authed) {
    return (
      <div style={{ background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>CONTAINED</h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#666', marginBottom: 32 }}>Momentum Report — March 2026</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input === PASSCODE) { setAuthed(true); setError(false); } else { setError(true); } }}>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="Enter passcode"
              autoFocus
              style={{ background: '#1a1a1a', border: error ? '1px solid #DC2626' : '1px solid #333', color: '#F5F0E8', padding: '12px 16px', fontSize: '1rem', width: '100%', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
            />
            {error && <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Incorrect passcode</p>}
            <button type="submit" style={{ marginTop: 16, background: '#F5F0E8', color: '#0A0A0A', padding: '12px 32px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', width: '100%' }}>
              View Report
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .mm-body { background: #0A0A0A; color: #F5F0E8; font-family: 'Space Grotesk', sans-serif; min-height: 100vh; }
        .mm-mono { font-family: 'IBM Plex Mono', monospace; }
        .mm-hero { padding: 80px 40px 60px; max-width: 1200px; margin: 0 auto; }
        .mm-hero h1 { font-size: 3.5rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px; }
        .mm-hero .mm-subtitle { font-size: 1.1rem; color: #999; max-width: 700px; line-height: 1.6; }
        .mm-hero .mm-date { font-family: 'IBM Plex Mono', monospace; font-size: 0.85rem; color: #666; margin-bottom: 24px; }
        .mm-section { max-width: 1200px; margin: 0 auto; padding: 0 40px 60px; }
        .mm-section-title { font-size: 0.75rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #666; margin-bottom: 24px; font-family: 'IBM Plex Mono', monospace; }
        .mm-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #222; margin-bottom: 60px; }
        .mm-stat-card { background: #0A0A0A; padding: 32px 24px; text-align: center; }
        .mm-stat-number { font-size: 3rem; font-weight: 700; letter-spacing: -0.03em; }
        .mm-stat-number.mm-red { color: #DC2626; }
        .mm-stat-number.mm-green { color: #059669; }
        .mm-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #888; margin-top: 8px; letter-spacing: 0.05em; }
        .mm-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 60px; }
        .mm-compare-col { border: 1px solid #333; padding: 32px; }
        .mm-compare-col h3 { font-size: 1rem; font-weight: 700; margin-bottom: 4px; }
        .mm-compare-col .mm-period { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #666; margin-bottom: 20px; }
        .mm-compare-stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a1a1a; }
        .mm-compare-stat .mm-label { color: #999; font-size: 0.9rem; }
        .mm-compare-stat .mm-value { font-weight: 700; font-family: 'IBM Plex Mono', monospace; }
        .mm-city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-bottom: 60px; }
        .mm-city-card { border: 1px solid #333; padding: 24px; position: relative; }
        .mm-city-card.mm-confirmed { border-color: #059669; }
        .mm-city-card.mm-confirmed::before { content: 'CONFIRMED'; position: absolute; top: 8px; right: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem; background: #059669; color: #fff; padding: 2px 8px; letter-spacing: 0.1em; }
        .mm-city-card.mm-demand::before { content: 'DEMAND'; position: absolute; top: 8px; right: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem; background: #DC2626; color: #fff; padding: 2px 8px; letter-spacing: 0.1em; }
        .mm-city-name { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
        .mm-city-count { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #059669; margin-bottom: 12px; }
        .mm-city-quote { font-size: 0.85rem; color: #999; line-height: 1.5; font-style: italic; margin-bottom: 8px; }
        .mm-city-quote .mm-name { font-style: normal; color: #F5F0E8; font-weight: 500; }
        .mm-voices { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 60px; }
        .mm-voice { border-left: 3px solid #333; padding: 16px 24px; }
        .mm-voice.mm-highlight { border-color: #DC2626; }
        .mm-voice blockquote { font-size: 0.95rem; line-height: 1.6; color: #ccc; margin-bottom: 12px; }
        .mm-voice .mm-attribution { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #666; }
        .mm-voice .mm-attribution strong { color: #F5F0E8; font-weight: 500; }
        .mm-offers-list { margin-bottom: 60px; }
        .mm-offer { display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #1a1a1a; }
        .mm-offer-type { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; padding: 2px 10px; height: fit-content; letter-spacing: 0.1em; font-weight: 500; white-space: nowrap; }
        .mm-offer-type.mm-host { background: #059669; color: #fff; }
        .mm-offer-type.mm-fund { background: #DC2626; color: #fff; }
        .mm-offer-type.mm-amplify { background: #2563EB; color: #fff; }
        .mm-offer-type.mm-connect { background: #7C3AED; color: #fff; }
        .mm-offer-type.mm-research { background: #D97706; color: #fff; }
        .mm-offer-body .mm-offer-name { font-weight: 700; font-size: 0.9rem; }
        .mm-offer-body .mm-offer-role { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #666; }
        .mm-offer-body .mm-offer-quote { font-size: 0.85rem; color: #999; margin-top: 4px; line-height: 1.4; }
        .mm-coalition { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: #222; margin-bottom: 60px; }
        .mm-coalition-table { background: #0A0A0A; padding: 24px; }
        .mm-coalition-table h4 { font-size: 0.9rem; font-weight: 700; margin-bottom: 4px; }
        .mm-coalition-table .mm-count { font-family: 'IBM Plex Mono', monospace; font-size: 1.5rem; font-weight: 700; color: #059669; margin-bottom: 8px; }
        .mm-coalition-table .mm-names { font-size: 0.75rem; color: #666; line-height: 1.5; }
        .mm-cta { background: #DC2626; padding: 60px 40px; text-align: center; margin-top: 40px; }
        .mm-cta h2 { font-size: 2rem; font-weight: 700; margin-bottom: 12px; }
        .mm-cta p { font-size: 1rem; color: rgba(255,255,255,0.8); max-width: 600px; margin: 0 auto 24px; line-height: 1.5; }
        .mm-cta a { display: inline-block; background: #0A0A0A; color: #F5F0E8; padding: 14px 32px; font-weight: 700; text-decoration: none; font-size: 0.9rem; letter-spacing: 0.05em; }
        .mm-footer { max-width: 1200px; margin: 0 auto; padding: 40px; text-align: center; }
        .mm-footer p { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #444; }
        @media (max-width: 768px) {
          .mm-hero h1 { font-size: 2rem; }
          .mm-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .mm-compare { grid-template-columns: 1fr; }
          .mm-voices { grid-template-columns: 1fr; }
          .mm-coalition { grid-template-columns: repeat(2, 1fr); }
          .mm-hero, .mm-section { padding-left: 20px; padding-right: 20px; }
        }
      `}} />
      <div className="mm-body">
        <div className="mm-hero">
          <div className="mm-date">MOMENTUM REPORT — MARCH 2026</div>
          <h1>CONTAINED is building a movement.</h1>
          <p className="mm-subtitle">Three LinkedIn posts. 4,200+ reactions. 285 comments. 56 senior leaders. 30 offers to host, fund, or amplify. 10+ cities requesting tour stops. This is what happened when we stopped asking for permission and started building pressure.</p>
        </div>

        <div className="mm-section">
          <div className="mm-section-title">The Numbers</div>
          <div className="mm-stats-grid">
            <div className="mm-stat-card"><div className="mm-stat-number">4,238</div><div className="mm-stat-label">Total Reactions</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number">285</div><div className="mm-stat-label">Comments</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number mm-red">56</div><div className="mm-stat-label">Senior Leaders Engaged</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number mm-green">30</div><div className="mm-stat-label">Offers to Help</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number">117</div><div className="mm-stat-label">Potential Allies Identified</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number">10+</div><div className="mm-stat-label">Cities Requesting Stops</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number mm-red">2</div><div className="mm-stat-label">State MPs Engaged</div></div>
            <div className="mm-stat-card"><div className="mm-stat-number mm-green">8K</div><div className="mm-stat-label">LinkedIn Followers</div></div>
          </div>
        </div>

        <div className="mm-section">
          <div className="mm-section-title">Growth — October 2025 vs March 2026</div>
          <div className="mm-compare">
            <div className="mm-compare-col">
              <h3>Post 1 — &quot;We Bought a Container&quot;</h3>
              <div className="mm-period">October 2025 · Launch announcement</div>
              <div className="mm-compare-stat"><span className="mm-label">Reactions</span><span className="mm-value">2,195</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Comments</span><span className="mm-value">166</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Tour stops confirmed</span><span className="mm-value">1 (Sydney)</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Funding partners</span><span className="mm-value">0</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Hosting offers</span><span className="mm-value">5</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Status</span><span className="mm-value" style={{color:'#D97706'}}>Concept</span></div>
            </div>
            <div className="mm-compare-col" style={{borderColor:'#059669'}}>
              <h3>Posts 2 &amp; 3 — &quot;Pick a Fight&quot; + &quot;Spanish Youth&quot;</h3>
              <div className="mm-period">March 2026 · National tour announcement</div>
              <div className="mm-compare-stat"><span className="mm-label">Reactions</span><span className="mm-value" style={{color:'#059669'}}>2,043+</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Comments</span><span className="mm-value" style={{color:'#059669'}}>166+</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Tour stops confirmed</span><span className="mm-value" style={{color:'#059669'}}>5 cities</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Funding partners</span><span className="mm-value" style={{color:'#059669'}}>3 in pipeline</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Hosting offers</span><span className="mm-value" style={{color:'#059669'}}>8+ cities</span></div>
              <div className="mm-compare-stat"><span className="mm-label">Status</span><span className="mm-value" style={{color:'#059669'}}>Tour Locked</span></div>
            </div>
          </div>
        </div>

        <div className="mm-section">
          <div className="mm-section-title">Where People Want CONTAINED</div>
          <div className="mm-city-grid">
            <div className="mm-city-card mm-confirmed"><div className="mm-city-name">Sydney</div><div className="mm-city-count">8 mentions · Launch city</div><div className="mm-city-quote"><span className="mm-name">Joy Woods</span>, Founder: &quot;What are the details for Sydney? Keen to show my support!&quot;</div></div>
            <div className="mm-city-card mm-confirmed"><div className="mm-city-name">Brisbane</div><div className="mm-city-count">2 mentions · YAC hosting</div><div className="mm-city-quote"><span className="mm-name">Jonty Bush</span>, QLD MP: &quot;I love this concept, where is it touring in Queensland?&quot;</div></div>
            <div className="mm-city-card mm-confirmed"><div className="mm-city-name">Perth</div><div className="mm-city-count">8 mentions · UWA partnership</div><div className="mm-city-quote"><span className="mm-name">Hayley Passmore</span>, Criminology Lecturer: &quot;We can&apos;t wait to have this in Perth!!!&quot;</div></div>
            <div className="mm-city-card mm-confirmed"><div className="mm-city-name">Adelaide</div><div className="mm-city-count">3 mentions · Reintegration Conference</div><div className="mm-city-quote"><span className="mm-name">Kirsty Stark</span>: &quot;Yes, bring this to Adelaide!!&quot;</div></div>
            <div className="mm-city-card mm-confirmed"><div className="mm-city-name">Alice Springs</div><div className="mm-city-count">Oonchiumpa partnership</div><div className="mm-city-quote">Indigenous community-led activation with Oonchiumpa Aboriginal Corporation</div></div>
            <div className="mm-city-card mm-demand"><div className="mm-city-name">Canberra</div><div className="mm-city-count">10 mentions · Highest demand</div><div className="mm-city-quote"><span className="mm-name">Robert Tickner</span>, JRI Chair: &quot;Don&apos;t forget the drive to Canberra to deliver a message to the PM&quot;</div><div className="mm-city-quote"><span className="mm-name">Rebecca Minty</span>, Inspector of Custodial Services: &quot;Govt recently committed to a new model of care&quot;</div></div>
            <div className="mm-city-card mm-demand"><div className="mm-city-name">Melbourne</div><div className="mm-city-count">8 mentions</div><div className="mm-city-quote"><span className="mm-name">Nadja Kostich</span>, Artistic Director: &quot;This needs to be seen in Melbourne. Overwhelming community support.&quot;</div></div>
            <div className="mm-city-card mm-demand"><div className="mm-city-name">Tasmania</div><div className="mm-city-count">2 mentions</div><div className="mm-city-quote"><span className="mm-name">Ruth Forrest</span>, Member of Parliament: &quot;Can you also bring it to Tasmania?&quot;</div></div>
            <div className="mm-city-card mm-demand"><div className="mm-city-name">International</div><div className="mm-city-count">13 mentions · NZ, UK, US</div><div className="mm-city-quote"><span className="mm-name">Gemma Livingston</span> (NZ): &quot;We have the same issue with youth detention in NZ&quot;</div></div>
          </div>
        </div>

        <div className="mm-section">
          <div className="mm-section-title">What People Are Saying</div>
          <div className="mm-voices">
            <div className="mm-voice mm-highlight"><blockquote>&quot;We need lots more innovation like this in our campaign to end this discredited annual billion dollar plus failed youth incarceration system.&quot;</blockquote><div className="mm-attribution"><strong>Robert Tickner</strong> · Chair, Justice Reform Initiative</div></div>
            <div className="mm-voice mm-highlight"><blockquote>&quot;Closing the gap is impossible with the current paradigm. Doing the same thing over and over and expecting a different outcome is delusional.&quot;</blockquote><div className="mm-attribution"><strong>Paul Kelly</strong> · Former Chief Medical Officer of Australia</div></div>
            <div className="mm-voice"><blockquote>&quot;As one of the few people who have stood in both rooms I can honestly say you&apos;ve captured their essence perfectly. It was heartbreaking to see a young man remembering how cold he used to be.&quot;</blockquote><div className="mm-attribution"><strong>Kate Bjur</strong> · Lived experience advocate</div></div>
            <div className="mm-voice"><blockquote>&quot;This should be exhibited in an Art Gallery. It&apos;s installation art. It provokes critical thinking on an issue that needs national attention.&quot;</blockquote><div className="mm-attribution"><strong>Sally Anderson</strong> · Women&apos;s Safety Services SA</div></div>
            <div className="mm-voice mm-highlight"><blockquote>&quot;This is the argument that needs to be had and the evidence is there to win it. Our program Futures Radio runs 24/7 inside youth detention. Different medium, same fight.&quot;</blockquote><div className="mm-attribution"><strong>Musicians Making A Difference (MMAD)</strong></div></div>
            <div className="mm-voice"><blockquote>&quot;Some decision makers will never be persuaded with words, manufacturing real feels though can be a whole different ballgame.&quot;</blockquote><div className="mm-attribution"><strong>Linda Ryle</strong> · Senior Lawyer</div></div>
            <div className="mm-voice mm-highlight"><blockquote>&quot;How can people help not just see the shipping containers... yet how everything you&apos;re about can be brought to life in multiple communities at once?&quot;</blockquote><div className="mm-attribution"><strong>Tom Donaghy</strong> · Tagged 19 senior leaders in response</div></div>
            <div className="mm-voice"><blockquote>&quot;This is literally the best thing I&apos;ve read in weeks. This is what is needed.&quot;</blockquote><div className="mm-attribution"><strong>Erin Newall</strong> · Youth Worker</div></div>
          </div>
        </div>

        <div className="mm-section">
          <div className="mm-section-title">People Offering to Help</div>
          <div className="mm-offers-list">
            <div className="mm-offer"><span className="mm-offer-type mm-host">HOST</span><div className="mm-offer-body"><div className="mm-offer-name">Shannon Cant — Youth Affairs Council QLD</div><div className="mm-offer-role">YAC wants to HOST the Container in Brisbane</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-host">HOST</span><div className="mm-offer-body"><div className="mm-offer-name">Michelle Wieberneit — University of Western Australia</div><div className="mm-offer-role">Academic partnership for Perth campus installation</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-host">HOST</span><div className="mm-offer-body"><div className="mm-offer-name">PJ Hewitt — Director of Health Services</div><div className="mm-offer-quote">&quot;Host in Canberra!&quot;</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-host">HOST</span><div className="mm-offer-body"><div className="mm-offer-name">Jacqueline Dortmans — Government Relations</div><div className="mm-offer-quote">&quot;Need to bring this to Tassie — let me know what an invitation needs to look like!&quot;</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-fund">FUND</span><div className="mm-offer-body"><div className="mm-offer-name">Teya Dusseldorp — Dusseldorp Forum</div><div className="mm-offer-role">Engaged</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-fund">FUND</span><div className="mm-offer-body"><div className="mm-offer-name">Jonas Kubitscheck &amp; William Frazer — Paul Ramsay Foundation</div><div className="mm-offer-role">Visited Container Oct 2025. Re-engaging on tour funding.</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-fund">FUND</span><div className="mm-offer-body"><div className="mm-offer-name">Lucy Stronach — Minderoo Foundation</div><div className="mm-offer-role">Expressed interest. Board decision June 2026.</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-amplify">AMPLIFY</span><div className="mm-offer-body"><div className="mm-offer-name">Tom Donaghy — HousingPLUS</div><div className="mm-offer-quote">Tagged 19 senior leaders including PRF, Ash Barty, Mark Bouris, Jim Betts</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-amplify">AMPLIFY</span><div className="mm-offer-body"><div className="mm-offer-name">Peter Rowe — First Nations News</div><div className="mm-offer-role">Invited op-ed submission</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-connect">POLICY</span><div className="mm-offer-body"><div className="mm-offer-name">Jonty Bush — QLD Member of Parliament</div><div className="mm-offer-quote">&quot;I love this concept, where is it touring in Queensland?&quot;</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-connect">POLICY</span><div className="mm-offer-body"><div className="mm-offer-name">Ruth Forrest — Tasmanian Member of Parliament</div><div className="mm-offer-quote">&quot;Can you also bring it to Tasmania?&quot;</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-connect">POLICY</span><div className="mm-offer-body"><div className="mm-offer-name">Rebecca Minty — ACT Inspector of Custodial Services</div><div className="mm-offer-quote">&quot;Govt recently committed to a new model of care for youth detention&quot;</div></div></div>
            <div className="mm-offer"><span className="mm-offer-type mm-research">RESEARCH</span><div className="mm-offer-body"><div className="mm-offer-name">Kate McKenzie — UWA Research Partnerships</div><div className="mm-offer-role">Shared ARC Centre of Excellence for Prisoner Reintegration</div></div></div>
          </div>
        </div>

        <div className="mm-section">
          <div className="mm-section-title">The Coalition Is Already Forming</div>
          <div className="mm-coalition">
            <div className="mm-coalition-table"><h4>Community Governance</h4><div className="mm-count">8</div><div className="mm-names">Oonchiumpa, BackTrack, YAC, JustReinvest, Palm Island CC, Mounty Yarns, JRI Perth, MMAD</div></div>
            <div className="mm-coalition-table"><h4>Evidence</h4><div className="mm-count">5</div><div className="mm-names">UWA (McKenzie, Flatau, Wieberneit), Juanita (Criminology), ARC Centre</div></div>
            <div className="mm-coalition-table"><h4>Capital</h4><div className="mm-count">5</div><div className="mm-names">Dusseldorp Forum, Paul Ramsay Foundation, Minderoo, The Justice Project, individual donors</div></div>
            <div className="mm-coalition-table"><h4>Policy</h4><div className="mm-count">6</div><div className="mm-names">Jonty Bush (QLD MP), Ruth Forrest (TAS MP), Rebecca Minty (ACT), Robert Tickner (JRI), Jim Betts</div></div>
            <div className="mm-coalition-table"><h4>Amplification</h4><div className="mm-count">15+</div><div className="mm-names">Tom Donaghy, Peter Rowe (First Nations News), MMAD, Nadja Kostich, Sophie Bretag (Mayor)</div></div>
          </div>
        </div>

        <div className="mm-section" style={{paddingBottom: 0}}>
          <div className="mm-section-title">The Opportunity</div>
          <div style={{maxWidth: 800}}>
            <p style={{fontSize: '1.1rem', lineHeight: 1.8, color: '#ccc', marginBottom: 24}}>CONTAINED is not a campaign looking for an audience. The audience is already here — asking where, when, and how they can help. The demand outstrips our capacity to deliver.</p>
            <p style={{fontSize: '1.1rem', lineHeight: 1.8, color: '#ccc', marginBottom: 24}}>Five cities are confirmed. Eight more are requesting. Two state MPs have publicly asked for tour dates. A former Chief Medical Officer called the current system &quot;delusional.&quot;</p>
            <p style={{fontSize: '1.1rem', lineHeight: 1.8, color: '#ccc', marginBottom: 24}}>Behind the Container sits <strong>ALMA</strong> — 981 verified community alternatives to youth detention, mapped nationally with cost data. And <strong>JusticeHub</strong> — tracking $71M+ in youth justice funding across every state.</p>
            <p style={{fontSize: '1.1rem', lineHeight: 1.8, color: '#F5F0E8', fontWeight: 500}}>Each tour stop costs $30–50K. Each one generates measurable community engagement, coalition formation, and policy pressure. The infrastructure exists. The demand is proven. The coalition is forming. We need partners who want to accelerate it.</p>
          </div>
        </div>

        <div className="mm-cta">
          <h2>Join the Coalition</h2>
          <p>CONTAINED starts in Sydney end of April 2026. Then Adelaide. Then Perth. Then wherever communities are ready.</p>
          <a href="https://www.justicehub.com.au/contained">SEE THE TOUR →</a>
        </div>

        <div className="mm-footer">
          <p>CONTAINED — A Curious Tractor × JusticeHub · Data scraped from 3 LinkedIn posts, March 2026</p>
          <p style={{marginTop: 8}}>Contact: benjamin@act.place · +61 422 883 943</p>
        </div>
      </div>
    </>
  );
}
