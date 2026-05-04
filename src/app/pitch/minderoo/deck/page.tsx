import Link from 'next/link';

export const metadata = {
  title: 'Slide Deck · STAY × Minderoo Foundation',
  description:
    'Sixteen-slide overview of the STAY partnership. Four Aboriginal community-controlled anchors, three rings, three-year envelopes. Print to PDF or share with a password.',
};

const anchors = [
  { name: 'Oonchiumpa', country: 'Eastern Arrernte Country, Mparntwe', metric: '95% diversion. 21 active young people.' },
  { name: 'Palm Island Community Company', country: 'Bwgcolman / Manbarra Country, Townsville', metric: 'Stretch Beds enterprise live.' },
  { name: 'BG Fit', country: 'Kalkadoon Country, Mount Isa', metric: '85% diversion. 400+ young people each year.' },
  { name: 'MMEIC', country: 'Quandamooka Country, Minjerribah', metric: 'Elder-led cultural authority.' },
];

const minderooFit = [
  { pillar: 'Communities pillar', body: 'Same families, twelve years downstream from the Early Years window. Four community-controlled organisations resourced to keep holding children.' },
  { pillar: 'Generation One', body: 'Forty-eight cents in the first dollar lands on community. Cultural authority paid. The upstream infrastructure that was never funded the first time.' },
  { pillar: 'Strategic Impact Fund', body: 'A catalytic bet on systems change. The Australian Living Map of Alternatives indexes every community-led model nationally. CivicGraph surfaces the next four anchors on evidence, not proximity.' },
];

const tiers = [
  { label: 'Light', y1: '$600K', y1Note: '2 anchors held. September postcards send.', mood: 'entry' },
  { label: 'Standard', y1: '$1.1M', y1Note: 'Four anchors. Postcards. First STAY artefact. Contained Perth.', mood: 'recommended' },
  { label: 'Lean-in', y1: '$1.6M', y1Note: 'Four anchors. Africa and Europe integrated. Extended tour.', mood: 'lead' },
];

const envelopes = [
  { mark: '↗', label: 'Lift', total: '~$3.6M', body: 'Y2 grows into 6 anchors. Y3 lands the national exhibition.' },
  { mark: '↔', label: 'Steady', total: '~$3.3M', body: 'Hold at Y1 level for Y2 and Y3. Predictability over growth.' },
  { mark: '↘', label: 'Taper', total: '~$2.5M', body: 'Y2 at 75%. Y3 at 50%. Cohort narrows with the funding.' },
  { mark: '✕', label: 'Conclude', total: '$1.1M', body: 'Year 1 stands as the partnership outcome. Available at any month-10 review.' },
];

const actionPath = [
  { when: '28 April 2026', what: 'Conversation with Lucy. Test the partnership shape.' },
  { when: 'May to June', what: 'Africa and Europe learning trip feeds the platform.' },
  { when: 'July to August', what: 'Contained tour Perth stop. Earliest moment for Year 1 confirm.' },
  { when: 'September', what: 'Postcards to the fifty-five judges. International findings land.' },
  { when: 'By November', what: 'Year 1 confirmed. Public announcement co-designed.' },
  { when: 'Q1 2027', what: 'Year 1 begins. Quarterly sense-making starts.' },
  { when: 'August 2027', what: 'Year 1 review gate. Year 2 conversation with proof in hand.' },
];

const whyTeam = [
  { head: 'Already running, not proposing', body: 'Fifty-five judges sat on Country on 17 April. The Contained tour is moving with eighty-six people. Four anchors are holding children right now.' },
  { head: 'Money lands on community first', body: '$530K of $1.1M direct to Oonchiumpa, PICC, BG Fit, and MMEIC as untied support. Cultural authority paid.' },
  { head: 'The data layer is built and audited', body: 'JusticeHub, Empathy Ledger, the Australian Living Map of Alternatives, CivicGraph. External technical audit publishes month 10.' },
  { head: 'Speed of community, not speed of institution', body: 'No university IP committee. No grant subcommittee. No press office. Decisions move at the speed Mparntwe or Bwgcolman or Kalkadoon move.' },
];

function Slide({
  n,
  total,
  bg = '#fbf5e9',
  children,
}: {
  n: number;
  total: number;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="slide relative w-full min-h-screen flex flex-col"
      style={{ background: bg, breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      <div className="flex-grow flex flex-col justify-center px-6 py-16 md:px-16 md:py-24">
        {children}
      </div>
      <div className="absolute bottom-6 right-8 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44]">
        {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <div className="absolute bottom-6 left-8 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44]">
        STAY × Minderoo
      </div>
    </section>
  );
}

export default function MinderooDeckPage() {
  const total = 16;
  const cormorant = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

  return (
    <main className="min-h-screen text-[#2a1f15]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @media print {
          .slide { min-height: 100vh; page-break-after: always; }
          .no-print { display: none !important; }
        }
        .deck-scroll { scroll-snap-type: y mandatory; }
        .slide { scroll-snap-align: start; }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <Link
          href="/pitch/minderoo"
          className="rounded-full bg-[#5a3a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#fbf5e9] hover:bg-[#7a2e22]"
        >
          Back to pitch
        </Link>
        <span className="rounded-full border border-[#5a3a2a] bg-[#fbf5e9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5a3a2a]">
          Press cmd-P to save as PDF
        </span>
      </div>

      <div className="deck-scroll">
        {/* 01 — COVER */}
        <Slide n={1} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-6">
            Partnership pitch · Minderoo Foundation · April 2026
          </div>
          <h1 className="max-w-5xl text-6xl md:text-8xl leading-[1.02] mb-6" style={{ ...cormorant, fontWeight: 500 }}>
            Keeping children close.
            <br />
            <span className="italic">Changing futures.</span>
          </h1>
          <p className="max-w-3xl text-2xl leading-relaxed text-[#5a3f2a]" style={{ ...cormorant, fontStyle: 'italic' }}>
            STAY: a three-year partnership backing four Aboriginal community-controlled anchors.
            $1.1M Year 1 Standard. Four reversibility gates. Country at the centre.
          </p>
        </Slide>

        {/* 02 — THE FRAME */}
        <Slide n={2} total={total} bg="#f5ecd9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            The frame
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Minderoo named the cost.
            <br />
            The next dollar funds the demonstration.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div>
              <div className="text-6xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>$22.3B</div>
              <p className="text-base text-[#5a3f2a] leading-7">
                Every year, in Australia, intervening too late. CoLI 2024 named the spend, with
                most of it sitting in child protection and youth justice.
              </p>
            </div>
            <div>
              <div className="text-6xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>$1.1M</div>
              <p className="text-base text-[#5a3f2a] leading-7">
                Year 1 of STAY Standard. Four communities, three rings, the data infrastructure
                to make the work travel. The demonstration of acting earlier.
              </p>
            </div>
          </div>
        </Slide>

        {/* 03 — MINDEROO FIT */}
        <Slide n={3} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            How this aligns
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            The same families, twelve years downstream.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
            {minderooFit.map((m) => (
              <div key={m.pillar} className="rounded-[24px] border border-[#dec9a9] bg-white p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a] mb-2">
                  {m.pillar}
                </div>
                <p className="text-base leading-7 text-[#3a2a1c]">{m.body}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 04 — FOUR ANCHORS */}
        <Slide n={4} total={total} bg="#f5ecd9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            What we hold
          </div>
          <h2 className="max-w-4xl text-5xl md:text-6xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Four community-controlled organisations.
            <br />
            <span className="italic">Already running. Already proven.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl">
            {anchors.map((a) => (
              <article key={a.name} className="rounded-[24px] border border-[#dec9a9] bg-white p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">
                  {a.country}
                </div>
                <h3 className="mt-3 text-3xl leading-tight" style={{ ...cormorant, fontWeight: 500 }}>
                  {a.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[#5a3f2a]">{a.metric}</p>
              </article>
            ))}
          </div>
        </Slide>

        {/* 05 — THE MODEL: THREE RINGS */}
        <Slide n={5} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            How it works
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Three rings.
            <br />
            <span className="italic">Community at the centre. Funder on the outer edge.</span>
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-8" style={{ ...cormorant, fontStyle: 'italic' }}>
            Read inside-out. The four community-controlled organisations are doing the work.
            The partnership funds the time to keep doing it, the platform that makes it visible,
            and the public form that lets it travel.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="rounded-full bg-[#a04a3a] px-5 py-2 text-sm font-semibold text-white">HOLD</span>
            <span className="rounded-full bg-[#c08a3e] px-5 py-2 text-sm font-semibold text-white">SEE</span>
            <span className="rounded-full bg-[#6b8a5a] px-5 py-2 text-sm font-semibold text-white">CARRY</span>
          </div>
        </Slide>

        {/* 06 — HOLD */}
        <Slide n={6} total={total} bg="#f6e3d8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#a04a3a] mb-4">
            Ring 01 · HOLD
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Hold the four anchors well.
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a]">
            Untied support to four community-controlled organisations. Time, travel, protocol,
            daily accompaniment. Cultural authority paid. Aunties, Uncles, Elders paid. Cross-site
            exchanges. The annual STAY gathering at the Harvest. Country visits Country.
          </p>
        </Slide>

        {/* 07 — SEE */}
        <Slide n={7} total={total} bg="#f4e6c8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7c5a2a] mb-4">
            Ring 02 · SEE
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Make the work visible as evidence.
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-6">
            Story capture and editorial accompaniment. The data infrastructure underneath:
            JusticeHub publishes the case studies. Empathy Ledger holds the consented stories.
            The Australian Living Map of Alternatives indexes every community-led model
            nationally. CivicGraph reads the funding map against the work map.
          </p>
        </Slide>

        {/* 08 — CARRY */}
        <Slide n={8} total={total} bg="#dde3cc">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3d5a3a] mb-4">
            Ring 03 · CARRY
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Move the proof into the rooms where decisions are made.
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a]">
            September postcards to the fifty-five judges who sat on Country at Oonchiumpa on
            17 April. The first STAY artefact, co-authored across the four anchors. The Contained
            tour through Perth, Mt Druitt, Adelaide, Tennant Creek, Brisbane. Year 3 lands as a
            national exhibition, a book, and a field convening at the Harvest.
          </p>
        </Slide>

        {/* 09 — CENTRE OF EXCELLENCE */}
        <Slide n={9} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            Where it gathers
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
            The Harvest at Witta.
            <br />
            <span className="italic">Jinibara Country. Sunshine Coast hinterland.</span>
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-6">
            Cohort weeks. Editorial residencies. The annual STAY gathering across the four
            anchors. The first worked exchange already booked: eight Oonchiumpa staff travel
            east in September 2026 to spend a week at the Harvest, sit with Quandamooka Elders
            from MMEIC, and exchange practice with PICC and BG Fit.
          </p>
          <div className="rounded-[24px] overflow-hidden border border-[#dec9a9] max-w-3xl">
            <img
              src="/images/harvest/seed-house.jpg"
              alt="The Harvest at Witta on Jinibara Country"
              className="w-full h-64 object-cover"
              loading="lazy"
            />
          </div>
        </Slide>

        {/* 10 — TRIPS */}
        <Slide n={10} total={total} bg="#f5ecd9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            Country visits Country
          </div>
          <h2 className="max-w-4xl text-5xl md:text-6xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
            September 2026.
            <br />
            <span className="italic">Eight Oonchiumpa staff travel east.</span>
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-6">
            Six days through Minjerribah, Toowoomba, Meanjin, and Witta. The first worked
            example of cross-anchor exchange. Logged in the workspace. Stories travel through
            Empathy Ledger with consent. Films travel with the storyteller, not back to a
            central archive.
          </p>
          <div className="text-base text-[#8d6a44] font-semibold uppercase tracking-[0.22em]">
            Mon 14 · Tue 15 · Wed 16 · Thu 17 · Fri 18 · Sat 19 September
          </div>
        </Slide>

        {/* 11 — PROOF POINT */}
        <Slide n={11} total={total} bg="#fbf5e9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            Already running
          </div>
          <h2 className="max-w-5xl text-5xl md:text-7xl leading-tight mb-10" style={{ ...cormorant, fontWeight: 500 }}>
            <span className="italic">Fifty-five judges. Ninety-five per cent diversion. Eighty-six people on tour.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
            <div>
              <div className="text-6xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>55</div>
              <p className="text-base leading-7 text-[#5a3f2a]">
                Judges sat on Country at Oonchiumpa on 17 April 2026. ANU Law residency since 2022.
              </p>
            </div>
            <div>
              <div className="text-6xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>95%</div>
              <p className="text-base leading-7 text-[#5a3f2a]">
                Operation Luna diversion. Of 21 high-need young people referred, only 1 remained on case management by Dec 2024.
              </p>
            </div>
            <div>
              <div className="text-6xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>86</div>
              <p className="text-base leading-7 text-[#5a3f2a]">
                People across fifteen locations have reached out about the Contained tour. The carrying vehicle is already on the road.
              </p>
            </div>
          </div>
        </Slide>

        {/* 12 — DATA SOVEREIGNTY */}
        <Slide n={12} total={total} bg="#f5ecd9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            Sovereignty as architecture
          </div>
          <h2 className="max-w-5xl text-5xl md:text-6xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Per-record consent. Per-org workspace. Per-cohort review. External audit.
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-6">
            Year 1 of the partnership funds an external technical audit of the consent layer.
            The audit lands as a public partnership artefact in month 10. Minderoo does not have
            to take our word for it. The architecture is reviewed, named, and made public.
          </p>
          <p className="max-w-3xl text-base leading-7 text-[#8d6a44]">
            Data sovereignty is not a clause in a consent form. It is a publishing practice.
          </p>
        </Slide>

        {/* 13 — INTERNATIONAL */}
        <Slide n={13} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            The breadth
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            May to June 2026: Africa and Europe.
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-4">
            Existing youth justice storytelling work feeds the platform. Australia is in the
            conversation, not consuming it. Findings land on JusticeHub by September.
          </p>
          <p className="max-w-3xl text-base leading-7 text-[#8d6a44] italic">
            The international extension is input to the platform, not export from it.
          </p>
        </Slide>

        {/* 14 — ACTION PATH */}
        <Slide n={14} total={total} bg="#f5ecd9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            When and how
          </div>
          <h2 className="max-w-4xl text-5xl md:text-6xl leading-tight mb-10" style={{ ...cormorant, fontWeight: 500 }}>
            From now to Year 1 begins.
          </h2>
          <ol className="max-w-4xl space-y-3">
            {actionPath.map((step) => (
              <li key={step.when} className="grid grid-cols-[180px_1fr] gap-6 border-l-2 border-[#dec9a9] pl-5 py-1">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a04a3a]">{step.when}</span>
                <span className="text-base leading-7 text-[#3a2a1c]">{step.what}</span>
              </li>
            ))}
          </ol>
        </Slide>

        {/* 15 — THE ASK + TIERS */}
        <Slide n={15} total={total} bg="#fbf5e9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            The ask
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-4" style={{ ...cormorant, fontWeight: 500 }}>
            $1.1M Year 1 Standard.
          </h2>
          <p className="max-w-3xl text-xl leading-relaxed text-[#5a3f2a] mb-10">
            Four anchors held. Postcards send. First STAY artefact. Contained Perth stop. Four
            reversibility gates over three years. Conclude at any month-10 review with the
            deliverables standing on their own.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mb-8">
            {tiers.map((t) => (
              <article
                key={t.label}
                className={`rounded-[24px] border p-6 ${
                  t.mood === 'recommended'
                    ? 'border-[#5a3a2a] bg-[#5a3a2a] text-[#fbf5e9]'
                    : 'border-[#dec9a9] bg-white text-[#3a2a1c]'
                }`}
              >
                <div className={`text-[10px] font-semibold uppercase tracking-[0.28em] mb-2 ${
                  t.mood === 'recommended' ? 'text-[#d4b07a]' : 'text-[#8d6a44]'
                }`}>
                  {t.label}{t.mood === 'recommended' ? ' · recommended' : ''}
                </div>
                <div className="text-5xl mb-3" style={{ ...cormorant, fontWeight: 500 }}>{t.y1}</div>
                <p className={`text-sm leading-6 ${t.mood === 'recommended' ? 'text-[#e7d4b3]' : 'text-[#5a3f2a]'}`}>
                  {t.y1Note}
                </p>
              </article>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl">
            {envelopes.map((e) => (
              <div key={e.label} className="rounded-[20px] border border-[#dec9a9] bg-white p-4">
                <div className="text-3xl text-[#a04a3a]" style={{ ...cormorant, fontWeight: 500 }}>{e.mark} {e.label}</div>
                <div className="text-xl mt-1" style={{ ...cormorant, fontWeight: 500 }}>{e.total}</div>
                <p className="mt-2 text-xs leading-5 text-[#5a3f2a]">{e.body}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 16 — WHY THIS TEAM + CLOSE */}
        <Slide n={16} total={total} bg="#5a3a2a">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d4b07a] mb-4">
            Why this team. Why now.
          </div>
          <h2 className="max-w-5xl text-4xl md:text-6xl leading-tight mb-10 text-[#fbf5e9]" style={{ ...cormorant, fontWeight: 500 }}>
            <span className="italic">The next dollar should not fund another report.</span> It should fund the demonstration of acting earlier, in four communities, with the infrastructure to make it travel.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mb-10">
            {whyTeam.map((w) => (
              <div key={w.head} className="rounded-[20px] border border-[#7a5a3a] bg-[#3a2516] p-5">
                <h3 className="text-xl mb-2" style={{ ...cormorant, fontWeight: 500, color: '#d4b07a' }}>{w.head}</h3>
                <p className="text-sm leading-6 text-[#e7d4b3]">{w.body}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#7a5a3a] pt-6 text-base text-[#e7d4b3]">
            <div className="font-semibold mb-2 text-[#fbf5e9]">Continue with</div>
            <div className="flex flex-wrap gap-3">
              <Link href="/pitch/minderoo" className="underline decoration-[#d4b07a] underline-offset-4">The full pitch</Link>
              <Link href="/pitch/minderoo/background-paper" className="underline decoration-[#d4b07a] underline-offset-4">The background paper</Link>
              <Link href="/centre-of-excellence/system-map" className="underline decoration-[#d4b07a] underline-offset-4">The system map</Link>
              <a href="mailto:partners@justicehub.com.au" className="underline decoration-[#d4b07a] underline-offset-4">partners@justicehub.com.au</a>
            </div>
          </div>
        </Slide>
      </div>
    </main>
  );
}
