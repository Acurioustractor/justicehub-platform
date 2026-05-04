import Link from 'next/link';

export const metadata = {
  title: 'Slide Deck · STAY × Minderoo Foundation',
  description:
    'Sixteen-slide overview of the STAY partnership. Four Aboriginal community-controlled anchors, three rings, three-year envelopes. Print to PDF or share with a password.',
};

const anchors = [
  {
    name: 'Oonchiumpa',
    country: 'Eastern Arrernte Country, Mparntwe',
    metric: '95% diversion. 21 active young people.',
    image: '/images/orgs/oonchiumpa/founders.jpg',
    alt: 'Kristy Bloomfield and Tanya Turner of Oonchiumpa',
  },
  {
    name: 'Palm Island Community Company',
    country: 'Bwgcolman / Manbarra Country, Townsville',
    metric: 'Stretch Beds enterprise live.',
    image: '/images/orgs/picc/stretch-bed-build.jpg',
    alt: 'Palm Island Stretch Beds enterprise build',
  },
  {
    name: 'BG Fit',
    country: 'Kalkadoon Country, Mount Isa',
    metric: '85% diversion. 400+ young people each year.',
    image: '/images/orgs/bg-fit/hero.jpg',
    alt: 'BG Fit on Kalkadoon Country',
  },
  {
    name: 'MMEIC',
    country: 'Quandamooka Country, Minjerribah',
    metric: 'Elder-led cultural authority.',
    image: '/images/orgs/mmeic/hero.jpg',
    alt: 'MMEIC on Quandamooka Country',
  },
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
  { when: 'July to August', what: 'Africa and Europe learning trip feeds the platform.' },
  { when: 'August onwards', what: 'Contained tour Perth stop. Earliest moment for Year 1 confirm.' },
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
        {/* 01 — COVER · split with hero photo */}
        <Slide n={1} total={total}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-6">
                Partnership pitch · Minderoo Foundation · April 2026
              </div>
              <h1 className="text-5xl md:text-7xl leading-[1.02] mb-6" style={{ ...cormorant, fontWeight: 500 }}>
                Keeping children close.
                <br />
                <span className="italic">Changing futures.</span>
              </h1>
              <p className="text-xl md:text-2xl leading-relaxed text-[#5a3f2a]" style={{ ...cormorant, fontStyle: 'italic' }}>
                STAY: a three-year partnership backing four Aboriginal community-controlled
                anchors. Country at the centre.
              </p>
            </div>
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_18px_46px_rgba(122,46,34,0.08)]">
              <img
                src="/images/orgs/oonchiumpa/march-2026/cover-boys-drone.jpg"
                alt="Two young people from Mparntwe with a drone on Country"
                className="w-full h-[520px] object-cover"
              />
            </figure>
          </div>
        </Slide>

        {/* 02 — THE FRAME · split with photo and stats */}
        <Slide n={2} total={total} bg="#f5ecd9">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/judges-on-country/april-2026.jpg"
                alt="Fifty-five judges on Country at Mparntwe, 17 April 2026"
                className="w-full h-[460px] object-cover"
              />
              <figcaption className="px-5 py-3 bg-white border-t border-[#dec9a9]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">17 April 2026</div>
                <div className="text-base mt-0.5 text-[#2a1f15]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>Judges on Country at Mparntwe · Fifty-five gathered, day on Country</div>
              </figcaption>
            </figure>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
                The frame
              </div>
              <h2 className="text-4xl md:text-6xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
                Minderoo named the cost.
                <br />
                The next dollar funds the demonstration.
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-5xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>$22.3B</div>
                  <p className="text-sm text-[#5a3f2a] leading-6">
                    Every year, in Australia, intervening too late. Most of it sits in child protection and youth justice.
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8d6a44]">
                    <a href="https://www.thefrontproject.org.au" target="_blank" rel="noopener noreferrer" className="underline decoration-[#8d6a44] decoration-1 underline-offset-4">CoLI 2024 · Front Project, supported by Minderoo Foundation</a>
                  </p>
                </div>
                <div>
                  <div className="text-5xl mb-2" style={{ ...cormorant, fontWeight: 500 }}>$1.1M</div>
                  <p className="text-sm text-[#5a3f2a] leading-6">
                    Year 1 of STAY Standard. Four communities, three rings, the data infrastructure to make the work travel. The demonstration of acting earlier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* 03 — MINDEROO FIT */}
        <Slide n={3} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            How this aligns
          </div>
          <h2 className="max-w-4xl text-5xl md:text-7xl leading-tight mb-10" style={{ ...cormorant, fontWeight: 500 }}>
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

        {/* 04 — FOUR ANCHORS · cards with photos */}
        <Slide n={4} total={total} bg="#f5ecd9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            What we hold
          </div>
          <h2 className="max-w-4xl text-4xl md:text-6xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
            Four community-controlled organisations.
            <br />
            <span className="italic">Already running. Already proven.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl">
            {anchors.map((a) => (
              <article key={a.name} className="rounded-[24px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_10px_30px_rgba(122,46,34,0.06)]">
                <img src={a.image} alt={a.alt} className="w-full h-44 object-cover" loading="lazy" />
                <div className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a04a3a]">
                    {a.country}
                  </div>
                  <h3 className="mt-2 text-2xl leading-tight" style={{ ...cormorant, fontWeight: 500 }}>
                    {a.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5a3f2a]">{a.metric}</p>
                </div>
              </article>
            ))}
          </div>
        </Slide>

        {/* 05 — KEEPING CHILDREN CLOSE infographic, full-bleed */}
        <Slide n={5} total={total} bg="#fbf5e9">
          <div className="flex items-center justify-center w-full">
            <figure className="w-full max-w-7xl">
              <img
                src="/images/stay/keeping-children-close-infographic.png"
                alt="Keeping children close. Changing futures. STAY model with the problem ($22.3B), three rings (CARRY, SEE, HOLD) around community at the centre, and the impact (fewer children in costly systems, better outcomes, return on investment)."
                className="w-full h-auto"
                loading="lazy"
              />
            </figure>
          </div>
        </Slide>

        {/* 06 — THREE RINGS as chapters of the STAY series */}
        <Slide n={6} total={total}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            How it works
          </div>
          <h2 className="max-w-4xl text-4xl md:text-6xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
            Three rings. <span className="italic">Four chapters.</span>
            <br />
            One library that travels.
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-[#5a3f2a] mb-10" style={{ ...cormorant, fontStyle: 'italic' }}>
            The STAY series holds the work as books. Each chapter does one job. Method, country,
            young people, travel. Recognisable to a judge, a funder, a young person.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-7xl mb-8">
            {[
              { src: '/images/proposals/minderoo/generated-books/three-circles-cover.png', kicker: 'Chapter 01', title: 'The method', body: 'Three rings, on the spine. The architecture explained.' },
              { src: '/images/proposals/minderoo/generated-books/library-shelf.png', kicker: 'Chapter 02', title: 'On Country', body: 'Each anchor a volume. Each Country in its own voice.' },
              { src: '/images/proposals/minderoo/generated-books/travel-diary.png', kicker: 'Chapter 03', title: 'Per young person', body: 'A journal in their own hands. Movement, culture, possibility.' },
              { src: '/images/proposals/minderoo/generated-books/library-slipcase.png', kicker: 'Chapter 04', title: 'The library', body: 'A slipcase that travels into chambers, philanthropy, galleries.' },
            ].map((c) => (
              <article key={c.kicker} className="rounded-[20px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_10px_30px_rgba(122,46,34,0.06)] flex flex-col">
                <img src={c.src} alt={c.title} className="w-full h-48 object-cover" loading="lazy" />
                <div className="p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a04a3a]">{c.kicker}</div>
                  <h3 className="mt-2 text-xl leading-tight" style={{ ...cormorant, fontWeight: 500 }}>{c.title}</h3>
                  <p className="mt-2 text-xs text-[#5a3f2a] leading-5">{c.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">Three rings underneath</span>
            <span className="rounded-full bg-[#a04a3a] px-4 py-1.5 text-xs font-semibold text-white">HOLD</span>
            <span className="rounded-full bg-[#c08a3e] px-4 py-1.5 text-xs font-semibold text-white">SEE</span>
            <span className="rounded-full bg-[#6b8a5a] px-4 py-1.5 text-xs font-semibold text-white">CARRY</span>
          </div>
        </Slide>

        {/* 06 — HOLD · with mentoring photo */}
        <Slide n={7} total={total} bg="#f6e3d8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#a04a3a] mb-4">
                Ring 01 · HOLD
              </div>
              <h2 className="text-5xl md:text-7xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
                Hold the four anchors well.
              </h2>
              <p className="text-xl leading-relaxed text-[#5a3f2a]">
                Untied support to four community-controlled organisations. Time, travel,
                protocol, daily accompaniment. Cultural authority paid. Aunties, Uncles, Elders
                paid. Cross-site exchanges. The annual STAY gathering at the Harvest. Country
                visits Country.
              </p>
            </div>
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/orgs/oonchiumpa/mentoring.jpg"
                alt="Oonchiumpa mentoring on Country"
                className="w-full h-[480px] object-cover"
                loading="lazy"
              />
            </figure>
          </div>
        </Slide>

        {/* 07 — SEE · with empathy ledger image */}
        <Slide n={8} total={total} bg="#f4e6c8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/maps/two-australias.png"
                alt="Two Australias: cost of detention by state on the left, community-controlled organisations holding children on the right"
                className="w-full h-auto"
                loading="lazy"
              />
              <figcaption className="px-5 py-3 bg-white border-t border-[#dec9a9]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">Two Australias</div>
                <div className="text-base mt-0.5 text-[#2a1f15]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>Cost of acting too late · Work already happening</div>
              </figcaption>
            </figure>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7c5a2a] mb-4">
                Ring 02 · SEE
              </div>
              <h2 className="text-5xl md:text-7xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
                Make the work visible as evidence.
              </h2>
              <p className="text-xl leading-relaxed text-[#5a3f2a]">
                Story capture and editorial accompaniment. The data infrastructure underneath:
                JusticeHub publishes the case studies. Empathy Ledger holds the consented
                stories. The Australian Living Map of Alternatives indexes every community-led
                model nationally. CivicGraph reads the funding map against the work map.
              </p>
            </div>
          </div>
        </Slide>

        {/* 08 — CARRY · with library shelf */}
        <Slide n={9} total={total} bg="#dde3cc">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3d5a3a] mb-4">
                Ring 03 · CARRY
              </div>
              <h2 className="text-5xl md:text-7xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
                Move the proof into the rooms where decisions are made.
              </h2>
              <p className="text-xl leading-relaxed text-[#5a3f2a]">
                September postcards to the fifty-five judges who sat on Country at Oonchiumpa
                on 17 April. The first STAY artefact, co-authored across the four anchors. The
                Contained tour through Perth, Mt Druitt, Adelaide, Tennant Creek, Brisbane.
                Year 3 lands as a national exhibition, a book, and a field convening at the
                Harvest.
              </p>
            </div>
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/proposals/minderoo/generated-books/library-shelf.png"
                alt="STAY series library shelf with volumes for each anchor"
                className="w-full h-[480px] object-cover"
                loading="lazy"
              />
            </figure>
          </div>
        </Slide>

        {/* 09 — CENTRE OF EXCELLENCE · big harvest photo */}
        <Slide n={10} total={total}>
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
                Where it gathers
              </div>
              <h2 className="text-4xl md:text-6xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
                The Harvest at Witta.
                <br />
                <span className="italic">Jinibara Country. Sunshine Coast hinterland.</span>
              </h2>
              <p className="text-lg leading-relaxed text-[#5a3f2a]">
                Cohort weeks. Editorial residencies. The annual STAY gathering across the four
                anchors. The first worked exchange already booked: eight Oonchiumpa staff
                travel east in September 2026 to spend a week at the Harvest, sit with
                Quandamooka Elders from MMEIC, and exchange practice with PICC and BG Fit.
              </p>
            </div>
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_18px_46px_rgba(122,46,34,0.08)]">
              <img
                src="/images/harvest/seed-house.jpg"
                alt="The Harvest at Witta on Jinibara Country"
                className="w-full h-[520px] object-cover"
                loading="lazy"
              />
            </figure>
          </div>
        </Slide>

        {/* 10 — TRIPS · aerial Country */}
        <Slide n={11} total={total} bg="#f5ecd9">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/orgs/oonchiumpa/team-true-justice-mural.jpg"
                alt="The Oonchiumpa team in front of the True Justice Indigenous Perspective and Deep Listening on Country mural"
                className="w-full h-[520px] object-cover"
                loading="lazy"
              />
              <figcaption className="px-5 py-3 bg-white border-t border-[#dec9a9]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">True Justice · Eastern Arrernte Country</div>
                <div className="text-base mt-0.5 text-[#2a1f15]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>The Oonchiumpa team, before the trip east</div>
              </figcaption>
            </figure>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
                Country visits Country
              </div>
              <h2 className="text-4xl md:text-6xl leading-tight mb-6" style={{ ...cormorant, fontWeight: 500 }}>
                September 2026.
                <br />
                <span className="italic">Eight Oonchiumpa staff travel east.</span>
              </h2>
              <p className="text-lg leading-relaxed text-[#5a3f2a] mb-6">
                Six days through Minjerribah, Toowoomba, Meanjin, and Witta. The first worked
                example of cross-anchor exchange. Logged in the workspace. Stories travel
                through Empathy Ledger with consent. Films travel with the storyteller, not
                back to a central archive.
              </p>
              <div className="text-sm text-[#8d6a44] font-semibold uppercase tracking-[0.22em]">
                Mon 14 · Tue 15 · Wed 16 · Thu 17 · Fri 18 · Sat 19 September
              </div>
            </div>
          </div>
        </Slide>

        {/* 11 — PROOF POINT · split with portraits row */}
        <Slide n={12} total={total} bg="#fbf5e9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            Already running
          </div>
          <h2 className="max-w-5xl text-4xl md:text-6xl leading-tight mb-10" style={{ ...cormorant, fontWeight: 500 }}>
            <span className="italic">Fifty-five judges. Ninety-five per cent diversion. Eighty-six people on tour.</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-8 items-center max-w-7xl mb-6">
            <figure className="rounded-[24px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_14px_36px_rgba(122,46,34,0.08)]">
              <img
                src="/images/judges-on-country/postcards-grid.png"
                alt="The full set of STAY postcards: front and back, twelve cards in total"
                className="w-full h-auto"
                loading="lazy"
              />
              <figcaption className="px-5 py-3 bg-white border-t border-[#dec9a9]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">September 2026</div>
                <div className="text-base mt-0.5 text-[#2a1f15]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>The first STAY public artefact, on the move</div>
              </figcaption>
            </figure>
            <div>
              <div className="space-y-5 mb-6">
                <div>
                  <div className="text-5xl" style={{ ...cormorant, fontWeight: 500 }}>55</div>
                  <p className="text-sm text-[#5a3f2a] mt-1 leading-6">Judges on Country at Mparntwe, 17 April 2026.</p>
                </div>
                <div>
                  <div className="text-5xl" style={{ ...cormorant, fontWeight: 500 }}>95%</div>
                  <p className="text-sm text-[#5a3f2a] mt-1 leading-6">Operation Luna diversion. 20 of 21 referrals diverted by Dec 2024.</p>
                </div>
                <div>
                  <div className="text-5xl" style={{ ...cormorant, fontWeight: 500 }}>86</div>
                  <p className="text-sm text-[#5a3f2a] mt-1 leading-6">People across fifteen locations have reached out about the Contained tour.</p>
                </div>
              </div>
              <p className="text-sm text-[#5a3f2a] leading-6">
                Each postcard carries a young person, an Elder, or a place. The first STAY
                artefact, designed to land in chambers, philanthropy rooms, and government
                rooms.
              </p>
            </div>
          </div>
        </Slide>

        {/* 12 — DATA SOVEREIGNTY · with empathy ledger accent */}
        <Slide n={13} total={total} bg="#f5ecd9">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
                Sovereignty as architecture
              </div>
              <h2 className="text-4xl md:text-6xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
                Per-record consent. Per-org workspace. Per-cohort review. External audit.
              </h2>
              <p className="text-lg leading-relaxed text-[#5a3f2a] mb-4">
                Year 1 of the partnership funds an external technical audit of the consent
                layer. The audit lands as a public partnership artefact in month 10. Minderoo
                does not have to take our word for it. The architecture is reviewed, named, and
                made public.
              </p>
              <p className="text-base leading-7 text-[#8d6a44] italic">
                Data sovereignty is not a clause in a consent form. It is a publishing practice.
              </p>
            </div>
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/proposals/minderoo/generated-books/three-circles-cover.png"
                alt="The STAY method spine, recognisable to a judge, a funder, a young person"
                className="w-full h-[480px] object-cover"
                loading="lazy"
              />
            </figure>
          </div>
        </Slide>

        {/* 13 — INTERNATIONAL · scrapbook map */}
        <Slide n={14} total={total}>
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
                The breadth
              </div>
              <h2 className="text-4xl md:text-6xl leading-tight mb-8" style={{ ...cormorant, fontWeight: 500 }}>
                July to August 2026:
                <br />
                <span className="italic">Africa and Europe.</span>
              </h2>
              <p className="text-lg leading-relaxed text-[#5a3f2a] mb-4">
                Existing youth justice storytelling work feeds the platform. Australia is in the
                conversation, not consuming it. Findings land on JusticeHub by September.
              </p>
              <p className="text-base text-[#8d6a44] italic">
                The international extension is input to the platform, not export from it.
              </p>
            </div>
            <figure className="rounded-[28px] overflow-hidden border border-[#dec9a9] bg-white shadow-[0_16px_40px_rgba(122,46,34,0.08)]">
              <img
                src="/images/maps/empathy-ledger-where-we-are-going.png"
                alt="Empathy Ledger 'Where We're Going' interactive world map: storytelling work across Africa, Asia, and Oceania feeds the platform"
                className="w-full h-auto"
                loading="lazy"
              />
              <figcaption className="px-5 py-3 bg-white border-t border-[#dec9a9]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">Empathy Ledger · Where we're going</div>
                <div className="text-base mt-0.5 text-[#2a1f15]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>The international layer feeds the platform first</div>
              </figcaption>
            </figure>
          </div>
        </Slide>

        {/* 15 — THE ASK · per-year menu, agile, no total */}
        <Slide n={15} total={total} bg="#fbf5e9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44] mb-4">
            The ask
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-end mb-10 max-w-6xl">
            <div>
              <h2 className="text-5xl md:text-7xl leading-[0.95] mb-3" style={{ ...cormorant, fontWeight: 500 }}>
                $1.1M
                <br />
                <span className="italic">a year.</span>
              </h2>
              <p className="text-base text-[#5a3f2a]" style={{ ...cormorant, fontStyle: 'italic' }}>
                Year 1 Standard. Four anchors held. The work that travels.
              </p>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-[#5a3f2a] mb-3">
                Below is the breakdown. Not a fixed package. It is how Minderoo can move
                dollars into the form that fits the partnership best. Pick any of these.
                Combine them. Shape Year 1 against where the work most wants to land.
              </p>
              <p className="text-base text-[#8d6a44] italic">
                Agile, relational, reversible. Every line stands on its own at every gate.
              </p>
            </div>
          </div>

          <div className="border-2 border-[#5a3a2a] bg-white max-w-6xl">
            {[
              { ring: 'HOLD', tone: '#a04a3a', name: 'Anchor support · local funding to do the work', perYear: '$100K per anchor / year', body: 'Untied support to a community-controlled organisation. Cultural authority paid. Travel and protocol covered. The local funding that keeps the work running on Country.' },
              { ring: 'HOLD', tone: '#a04a3a', name: 'Cross-site exchange · Country visits Country', perYear: '$25K per exchange', body: 'One anchor-to-anchor visit. Co-signed by both ends. The September Oonchiumpa trip east is the first worked example.' },
              { ring: 'SEE', tone: '#c08a3e', name: 'Engagement, storytelling, and capture', perYear: '$45K per anchor / year', body: 'Local support to engage with young people, families, and Elders on Country. Filmmakers, photographers, transcription, consent workflow. Per-storyteller, withdrawable.' },
              { ring: 'SEE', tone: '#c08a3e', name: 'JusticeHub platform · data and evidence', perYear: '$160K / year', body: 'Australian Living Map of Alternatives, CivicGraph, JusticeHub case studies, consent UI, hosting, and the external technical audit published in month 10.' },
              { ring: 'CARRY', tone: '#6b8a5a', name: 'Book, postcards, and exhibition', perYear: '$140K per cycle', body: 'STAY series book co-authored with the four anchors. Postcards send to chambers, philanthropy, and government rooms. An exhibition stop each year, building toward the Year 3 national exhibition at the Harvest.' },
              { ring: 'CARRY', tone: '#6b8a5a', name: 'Contained tour stop', perYear: '$30K per stop', body: 'A live tour stop carrying STAY images, postcards, and journals into the room. Perth, Mt Druitt, Adelaide, Tennant Creek, Brisbane.' },
              { ring: 'EXTEND', tone: '#5a3a2a', name: 'International trip (if available)', perYear: '$80K one-off', body: 'July to August 2026: Africa and Europe storytelling work feeds the platform. Australia in the conversation, not consuming it. Adds breadth to Year 1.' },
            ].map((row, i) => (
              <div key={row.name} className={`grid grid-cols-[100px_1fr_180px] items-start gap-4 px-5 py-4 ${i > 0 ? 'border-t border-[#dec9a9]' : ''}`}>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.22em] px-2 py-1 inline-block text-white text-center"
                  style={{ background: row.tone }}
                >
                  {row.ring}
                </span>
                <div>
                  <div className="text-base font-semibold text-[#2a1f15]">{row.name}</div>
                  <div className="text-xs text-[#5a3f2a] leading-5 mt-1">{row.body}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl text-[#5a3a2a]" style={{ ...cormorant, fontWeight: 500 }}>{row.perYear}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-4xl text-sm text-[#8d6a44]">
            How the dollars activate the system change. Minderoo picks the shape that fits the
            partnership. The partnership flexes year on year as the work and the relationship
            travel.
          </p>
        </Slide>

        {/* 16 — WHY THIS TEAM + CLOSE · with founders portrait */}
        <Slide n={16} total={total} bg="#5a3a2a">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d4b07a] mb-4">
                Why this team. Why now.
              </div>
              <h2 className="text-3xl md:text-5xl leading-tight mb-8 text-[#fbf5e9]" style={{ ...cormorant, fontWeight: 500 }}>
                <span className="italic">The next dollar should not fund another report.</span> It should fund the demonstration of acting earlier, in four communities, with the infrastructure to make it travel.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whyTeam.map((w) => (
                  <div key={w.head} className="rounded-[20px] border border-[#7a5a3a] bg-[#3a2516] p-4">
                    <h3 className="text-lg mb-2" style={{ ...cormorant, fontWeight: 500, color: '#d4b07a' }}>{w.head}</h3>
                    <p className="text-sm leading-6 text-[#e7d4b3]">{w.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <figure className="rounded-[28px] overflow-hidden border border-[#7a5a3a] bg-[#3a2516] mb-4 shadow-[0_18px_46px_rgba(0,0,0,0.4)]">
                <img
                  src="/images/orgs/oonchiumpa/founders.jpg"
                  alt="Kristy Bloomfield and Tanya Turner, Oonchiumpa"
                  className="w-full h-[420px] object-cover"
                />
                <figcaption className="px-5 py-3 text-xs text-[#e7d4b3] tracking-[0.18em] uppercase">
                  Kristy Bloomfield · Tanya Turner · Oonchiumpa
                </figcaption>
              </figure>
              <div className="border-t border-[#7a5a3a] pt-4">
                <div className="text-xs uppercase tracking-[0.22em] text-[#d4b07a] mb-2">Continue with</div>
                <div className="flex flex-wrap gap-3 text-sm text-[#e7d4b3]">
                  <Link href="/pitch/minderoo" className="underline decoration-[#d4b07a] underline-offset-4">The full pitch</Link>
                  <Link href="/pitch/minderoo/background-paper" className="underline decoration-[#d4b07a] underline-offset-4">The background paper</Link>
                  <Link href="/centre-of-excellence/system-map" className="underline decoration-[#d4b07a] underline-offset-4">The system map</Link>
                  <a href="mailto:partners@justicehub.com.au" className="underline decoration-[#d4b07a] underline-offset-4">partners@justicehub.com.au</a>
                </div>
              </div>
            </div>
          </div>
        </Slide>
      </div>
    </main>
  );
}
