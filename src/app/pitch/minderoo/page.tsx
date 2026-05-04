import type { Metadata } from 'next'
import { HandHeart, Search, Megaphone } from 'lucide-react'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.justicehub.com.au'),
  title: 'STAY · A three-year community partnership · for Minderoo Foundation',
  description:
    'A three-year partnership backing four Aboriginal community-controlled anchors. $1.1M Year 1 anchor, with a clear decision point in month 10. Full pathway $4.5M over three years.',
  openGraph: {
    title: 'STAY · A three-year community partnership · for Minderoo Foundation',
    description:
      'A three-year partnership backing four Aboriginal community-controlled anchors. $1.1M Year 1 anchor, with a clear decision point in month 10. Full pathway $4.5M over three years.',
    url: '/pitch/minderoo',
    siteName: 'JusticeHub',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/images/orgs/oonchiumpa/boys-drone.jpg',
        alt: 'Young people on Country with Oonchiumpa in Mparntwe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STAY · A three-year community partnership · for Minderoo Foundation',
    description:
      'A three-year partnership backing four Aboriginal community-controlled anchors. $1.1M Year 1 anchor, with a clear decision point in month 10.',
    images: ['/images/orgs/oonchiumpa/boys-drone.jpg'],
  },
  robots: {
    index: false,
    follow: false,
  },
}

// Brand palette — STAY warm watercolour
// hold (inner ring): #a04a3a terracotta · see (middle): #c08a3e ochre · carry (outer): #6b8a5a sage
// problem accent: #9c3a2e brick · impact accent: #3d5a3a forest
// background cream: #f5ecd9 · text deep: #2a1f15 · gold kicker: #8d6a44

const rings: Array<{
  name: string
  icon: typeof Megaphone
  body: string
  colour: string
  deep: string
  platforms?: { label: string; url: string }[]
}> = [
  {
    name: 'CARRY',
    icon: Megaphone,
    body: 'Moves proof into decision rooms. Postcards, journals, exchanges, exhibitions, books.',
    colour: '#6b8a5a',
    deep: '#3d5a3a',
  },
  {
    name: 'SEE',
    icon: Search,
    body: 'Makes the work visible as evidence. Per-storyteller consent.',
    platforms: [
      { label: 'JusticeHub', url: 'https://justicehub.com.au' },
      { label: 'Empathy Ledger', url: 'https://www.empathyledger.com' },
      { label: 'CivicGraph', url: 'https://civicgraph.app' },
    ],
    colour: '#c08a3e',
    deep: '#8a5a2a',
  },
  {
    name: 'HOLD',
    icon: HandHeart,
    body: 'Community keeps children close. Daily relationships, cultural authority, time, and trust.',
    colour: '#a04a3a',
    deep: '#7a2e22',
  },
]

const caseStudies = [
  {
    ring: 'HOLD',
    colour: '#a04a3a',
    deep: '#7a2e22',
    title: 'Supporting young people in Mparntwe',
    image: '/images/orgs/oonchiumpa/mentoring.jpg',
    imageAlt: 'Young people supported by Oonchiumpa in Mparntwe',
    blurb:
      'Daily presence is the practice. Workers, Aunties, and Elders stay through the moments that matter, in the gym, on Country, and across Mparntwe. Hold is not a program. It is a relationship.',
  },
  {
    ring: 'SEE',
    colour: '#c08a3e',
    deep: '#8a5a2a',
    title: 'The Empathy Ledger',
    image: '/images/stay/empathy-ledger-home.png',
    imageAlt: 'Empathy Ledger homepage: every community has a story, we help you own it',
    blurb:
      'Per-storyteller consent. Communities own their stories, and storytellers can withdraw at any time. Ninety-plus stories from the four anchors already held under OCAP principles. The work becomes evidence the community itself controls.',
    link: { label: 'empathyledger.com', url: 'https://www.empathyledger.com' },
  },
  {
    ring: 'CARRY',
    colour: '#6b8a5a',
    deep: '#3d5a3a',
    title: 'The STAY books',
    image: '/images/proposals/minderoo/generated-books/three-circles-cover.png',
    imageAlt: 'STAY series book cover',
    blurb:
      'A volume per anchor community. A journal per young person. The September postcards send. Carry is what makes proof travel into chambers, philanthropy, and government rooms without flattening place.',
  },
]

const anchors = [
  {
    name: 'Oonchiumpa',
    region: 'Mparntwe (Alice Springs), NT',
    detail:
      '100% Aboriginal-led. Kristy Bloomfield and Tanya Turner work across seven Central Australian language groups, with cultural authority held by Aunty Bev and Uncle Terry and an on-Country home at Atnarpa.',
    stats: ['95% diversion', '7 language groups', '2.4% of detention cost'],
    image: '/images/orgs/oonchiumpa/founders.jpg',
    imageAlt: 'Kristy Bloomfield and Tanya Turner standing together outdoors',
    objectPosition: 'center 25%',
    ring: 'HOLD',
  },
  {
    name: 'Palm Island Community Company',
    region: 'Bwgcolman (Palm Island), QLD',
    detail:
      'Community-owned company at scale. $29M annual turnover, 208 FTE. Rachel Atkinson leads alongside the Palm Island Elders Group, who have already recorded sixteen stories with Empathy Ledger.',
    stats: ['$29M turnover', '208 FTE', '48 storytellers consented'],
    image: '/images/orgs/picc/hero.jpg',
    imageAlt: 'Palm Island Community Company on Bwgcolman country',
    objectPosition: 'center 25%',
    ring: 'HOLD',
  },
  {
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    detail:
      'Brodie Germaine’s method blends sport, cultural camps, and remote outreach into Doomadgee and the Lower Gulf. The hold is daily structure, Elder presence, and the discipline of attendance.',
    stats: ['5→<1 police contacts/yr', 'Doomadgee outreach', 'Sport + Elders + discipline'],
    image: '/images/orgs/bg-fit/hero.jpg',
    imageAlt: 'BG Fit group outside the gym',
    objectPosition: 'center 75%',
    ring: 'HOLD',
  },
  {
    name: 'MMEIC',
    region: 'Quandamooka country (Minjerribah), QLD',
    detail:
      'Minjerribah Moorgumpin Elders-in-Council. Continuous Elder governance since 1993. Justice and healing held by Elder authority on Country.',
    stats: ['Founded 1993', 'Quandamooka country', 'Elder governance'],
    image: '/images/orgs/mmeic/hero.jpg',
    imageAlt: 'MMEIC on Quandamooka country, Minjerribah',
    objectPosition: 'center 78%',
    ring: 'HOLD',
  },
]

const yearOneTiers = [
  {
    label: 'Light',
    amount: '$600K',
    summary: 'Two anchors held for twelve months. Baseline captured. September postcards send.',
    fit: 'When Minderoo wants the lowest-commitment entry to test the partnership shape.',
    recommended: false,
  },
  {
    label: 'Standard',
    amount: '$1.1M',
    summary:
      'Four anchors held. Baseline. Postcards. First public artefact, co-authored with young people. Quarterly sense-making cycle.',
    fit: 'When Minderoo wants the full Year 1 anchor across all four communities.',
    recommended: true,
  },
  {
    label: 'Lean-in',
    amount: '$1.6M',
    summary:
      'Four anchors + cross-site exchange + Africa and Europe learning integrated into JusticeHub. Two artefacts published.',
    fit: 'When Minderoo wants to lead a movement, not just back a Year 1 hold.',
    recommended: false,
  },
]

const yearOnePieces = [
  'The four anchors held for twelve months. Untied support that lets the daily work continue without project compliance overhead.',
  'The baseline evidence layer captured: cohort size, current diversion and police-contact rates, cultural connection indicators nominated by community, education and employment engagement.',
  'The September 2026 postcards send to the fifty-five judges who attended Oonchiumpa on 17 April. Currently in editorial production.',
  'A first STAY public artefact, co-authored with young people from the four anchors.',
  'One quarterly sense-making cycle: four meetings on Country or community-chosen format.',
]

const rampShapes = [
  {
    icon: '↗',
    label: 'Ramp up',
    headline: 'Lead anchor through to FY2028.',
    detail: '$1.5M Year 2 + $1.9M Year 3. Total partnership $4.5M from a Standard Y1.',
    trigger:
      'When Year 1 outcomes are strong: four anchors retained, baseline visible across the cohort, two or more community-authored artefacts in public.',
    colour: '#3d5a3a',
    accent: '#cbd5b9',
  },
  {
    icon: '↔',
    label: 'Steady',
    headline: 'Hold at Year 1 level for Year 2 and Year 3.',
    detail: 'Three years at the same annual quantum. Total roughly three times Y1.',
    trigger:
      'When Year 1 outcomes are solid but Minderoo wants predictability over growth. Four anchors retained, at least one artefact published.',
    colour: '#7c5a2a',
    accent: '#e7d4b3',
  },
  {
    icon: '↘',
    label: 'Taper',
    headline: 'Step the partnership down gracefully.',
    detail: 'Year 2 at 75% of Y1, Year 3 at 50%. Total roughly 2.25 times Y1. The cohort narrows with the funding.',
    trigger:
      'When scope narrows. Two or three anchors retained, baseline only, no artefact yet. Minderoo and STAY agree to ease out without a cliff.',
    colour: '#9c3a2e',
    accent: '#f0d9a8',
  },
  {
    icon: '✕',
    label: 'Conclude after Year 1',
    headline: 'Year 1 stands as the partnership outcome.',
    detail: 'No Year 2 commitment. Year 1 deliverables published as a stand-alone partnership artefact.',
    trigger:
      'Available at any month-10 review, regardless of outcome. The Year 1 work has standing on its own terms.',
    colour: '#5a3a2a',
    accent: '#e7d4b3',
  },
]

const insideY1 = [
  {
    ring: 'HOLD',
    colour: '#a04a3a',
    accent: '#f6e3d8',
    title: 'Holding four anchors well',
    amount: '$420K',
    pct: '38%',
    detail:
      'Untied support to four community-controlled organisations. Time, travel, protocol, daily accompaniment. Roughly $100K per anchor for twelve months. No project compliance overhead.',
    pieces: [
      'Anchor coordinator time across Oonchiumpa, PICC, BG Fit, MMEIC',
      'Cultural authority compensation: Aunties, Elders, Elders-in-Council',
      'Travel and protocol costs across remote work',
      'Quarterly sense-making cycles, four meetings on Country or community-chosen format',
    ],
  },
  {
    ring: 'HOLD',
    colour: '#a04a3a',
    accent: '#f6e3d8',
    title: 'Cross-site exchanges',
    amount: '$110K',
    pct: '10%',
    detail:
      'Anchor-to-anchor visits. Communities meet, share approaches, and build relationships across Country. The first exchange already in motion: eight Oonchiumpa staff travel to South East Queensland in June 2026.',
    pieces: [
      'Three to four cross-site trips per year (one led by each anchor)',
      'Travel, accommodation, per diem for travelling teams',
      'Annual STAY gathering of all four anchors, hosted on Country',
      'Documentation of each exchange as a community artefact, not a funder report',
    ],
  },
  {
    ring: 'SEE',
    colour: '#c08a3e',
    accent: '#f4e6c8',
    title: 'Story capture and editorial',
    amount: '$180K',
    pct: '16%',
    detail:
      'Photographers, filmmakers, editors, and transcription paid days. Approximately two to three story-capture trips per anchor per year, scheduled around community readiness, not a publishing calendar.',
    pieces: [
      'Two to three storytelling trips per anchor per year',
      'Per-storyteller consent workflow training and support',
      'Editorial accompaniment for community-authored journals',
      'Theme tagging, transcription, and indexing on Empathy Ledger',
    ],
  },
  {
    ring: 'SEE',
    colour: '#c08a3e',
    accent: '#f4e6c8',
    title: 'JusticeHub platform layer',
    amount: '$160K',
    pct: '15%',
    detail:
      'The infrastructure that lets the See ring scale beyond the four anchors. The Australian Living Map of Alternatives holds the national database of community-led models, indexed on the terms of the people doing the work. CivicGraph reads the funding map against the Living Map to surface the communities currently overlooked: the organisations holding children every day who have never received philanthropic dollars. JusticeHub publishes the case studies that keep the model legible, with the community, owned by the community, withdrawable by the community. Data sovereignty is not a clause in a consent form. It is a publishing practice.',
    pieces: [
      'Australian Living Map of Alternatives stewardship: every community-led model indexed on the terms of the people doing the work, the national reference for what is already working',
      'CivicGraph discovery layer: the funding map read against the work map, so the next four anchors are chosen on evidence, not proximity',
      'JusticeHub case studies: one per anchor, per year, co-authored, withdrawable, the community-owned model made legible to system stewards',
      'Platform engineering, consent UI, hosting, monitoring, restore procedures, and the external technical audit published as a partnership artefact in month 10',
    ],
  },
  {
    ring: 'CARRY',
    colour: '#6b8a5a',
    accent: '#dde3cc',
    title: 'September postcards + first artefact',
    amount: '$140K',
    pct: '13%',
    detail:
      'The first major Carry deliverable, already in production. Plus a first STAY public artefact, co-authored with young people from the four anchors, designed to travel into chambers, philanthropy, and government rooms.',
    pieces: [
      'September 2026 postcards send to the fifty-five judges who attended on 17 April',
      'First STAY public artefact, co-authored with young people from the four anchors',
      'Editorial production, design, print, and distribution',
      'Documentation of how the artefact was received, for the Year 2 conversation',
    ],
  },
  {
    ring: 'CARRY',
    colour: '#6b8a5a',
    accent: '#dde3cc',
    title: 'Contained tour as a vehicle',
    amount: '$90K',
    pct: '8%',
    detail:
      'Contained is already touring with eighty-six people across fifteen locations who have reached out. STAY rides that momentum: visibility, distribution, and a public face that brings the partnership to where the conversations already are. Perth in July or August lands first, with UWA and JRI Perth as anchors.',
    pieces: [
      'Contained Perth stop (July to August): co-anchor visibility with UWA and JRI Perth',
      'Tour-stop integrations across Mt Druitt, Adelaide, Tennant Creek, Brisbane',
      'Postcards and STAY artefacts travel as exhibition material at each stop',
      'Towards Year 3 destination: book, national exhibition, field convening',
    ],
  },
]

const tierBreakdown = [
  {
    label: 'Light',
    amount: '$600K',
    recommended: false,
    fit: 'Lowest-commitment entry. Two anchors, postcards send.',
    rings: [
      { ring: 'HOLD', colour: '#a04a3a', amount: '$290K', pct: 48, detail: '2 anchors held + 1 cross-site exchange' },
      { ring: 'SEE', colour: '#c08a3e', amount: '$190K', pct: 32, detail: 'Core platform + storytelling for 2 anchors' },
      { ring: 'CARRY', colour: '#6b8a5a', amount: '$120K', pct: 20, detail: 'September postcards send only' },
    ],
  },
  {
    label: 'Standard',
    amount: '$1.1M',
    recommended: true,
    fit: 'Full Year 1 anchor across all four communities.',
    rings: [
      { ring: 'HOLD', colour: '#a04a3a', amount: '$530K', pct: 48, detail: '4 anchors held + cross-site exchanges' },
      { ring: 'SEE', colour: '#c08a3e', amount: '$340K', pct: 31, detail: 'Platform + editorial for 4 anchors' },
      { ring: 'CARRY', colour: '#6b8a5a', amount: '$230K', pct: 21, detail: 'Postcards + first STAY artefact + Contained Perth' },
    ],
  },
  {
    label: 'Lean-in',
    amount: '$1.6M',
    recommended: false,
    fit: 'Lead a movement. Africa and Europe learning integrated.',
    rings: [
      { ring: 'HOLD', colour: '#a04a3a', amount: '$770K', pct: 48, detail: '4 anchors + extended protocol + intensive exchanges' },
      { ring: 'SEE', colour: '#c08a3e', amount: '$500K', pct: 31, detail: 'Platform + editorial + Africa/Europe integration' },
      { ring: 'CARRY', colour: '#6b8a5a', amount: '$330K', pct: 21, detail: 'Postcards + 2 artefacts + extended Contained tour' },
    ],
  },
]

const optionalArchitecture = [
  {
    label: 'Co-anchor option',
    detail:
      'At any month-10 review, Minderoo can move from sole lead to co-anchor with a peer foundation (Paul Ramsay, Ian Potter, or Myer most likely). Costs and credit shared from Year 2.',
  },
  {
    label: 'Evidence-only narrow',
    detail:
      'If Minderoo wants to anchor the See ring specifically (JusticeHub, Empathy Ledger, CivicGraph) rather than the whole partnership, Year 2-3 can scope to that ring alone at smaller annual quantum.',
  },
  {
    label: 'Full pathway shapes',
    detail:
      'Five detailed partnership shapes for the November conversation, including syndicated and evidence-partner-only options, are documented in the background paper.',
  },
]

const actionPath = [
  { when: '28 April 2026', what: 'Conversation with Lucy. Test the partnership shape.', input: 'Open conversation. No decision required.' },
  { when: 'May to June 2026', what: 'Minderoo internal consultation. Ben travels to Africa and Europe to learn from existing youth justice storytelling work that will feed into the JusticeHub platform.', input: 'Whatever shape Minderoo’s review takes.' },
  { when: 'July to August 2026', what: 'Contained tour Perth stop with UWA and JRI Perth. The earliest natural moment for Year 1 to be confirmed if Minderoo is ready.', input: 'Optional Minderoo presence at Perth. Optional early confirmation.' },
  { when: 'September 2026', what: 'Judges postcards send. STAY’s first major Carry deliverable lands. Africa and Europe learning lands on JusticeHub.', input: 'None. Minderoo can review the artefacts.' },
  { when: 'By November 2026', what: 'Year 1 partnership confirmed at the latest. Public announcement co-designed. Earlier landing welcome at any of the prior steps.', input: 'Standard partnership documentation.' },
  { when: 'Q1 2027 or earlier', what: 'Year 1 of STAY begins.', input: 'Y1 dashboard live. Quarterly sense-making starts.' },
  { when: 'Around August 2027', what: 'Year 1 review gate. Minderoo and STAY decide what comes next, six to nine months in, with proof in hand.', input: 'The Year 2 conversation. Reversible at every gate.' },
]

const youthVoices = [
  {
    name: 'Jackquann',
    age: 14,
    place: 'Upper Camp, Mparntwe',
    image: '/images/orgs/oonchiumpa/jackquann.jpg',
    imageAlt: 'Jackquann, 14, Upper Camp Mparntwe',
    quote: 'At six o’clock you get locked down. You wait till tomorrow.',
    quoteContext: 'On detention.',
    second: 'Looking after my family.',
    secondContext: 'On what would stop him getting into trouble.',
  },
  {
    name: 'Nigel',
    age: 14,
    place: 'Double Camp, Mparntwe',
    image: '/images/orgs/oonchiumpa/nigel.jpg',
    imageAlt: 'Nigel, 14, Double Camp Mparntwe',
    quote: 'I want to play AFL. Going to school every day is the path to that.',
    quoteContext: 'On the future.',
    second: 'Oonchiumpa picks me up. Takes me to school. Takes me to the cinema.',
    secondContext: 'On what consistency looks like.',
  },
  {
    name: 'Laquisha',
    age: 16,
    place: 'Mparntwe',
    image: '/images/orgs/oonchiumpa/laquisha.jpg',
    imageAlt: 'Laquisha, 16, Mparntwe',
    quote: 'I don’t like going to Darwin because I have no family there.',
    quoteContext: 'On detention 1,500 km from home.',
    second: 'Oppression.',
    secondContext: 'When asked why young people get into trouble.',
  },
]

const stayBooks = [
  { title: 'The library, held as an object', detail: 'A shelf and a slipcase of method books and community volumes that travel into real rooms.', image: '/images/proposals/minderoo/generated-books/library-slipcase.png', imageAlt: 'Generated slipcase of the STAY series' },
  { title: 'The method has a recognisable spine', detail: 'STAY is one volume inside a system. Recognisable to a judge, to a funder, to a young person.', image: '/images/proposals/minderoo/generated-books/three-circles-cover.png', imageAlt: 'Generated STAY method book cover' },
  { title: 'Each young person can hold a journal of their own', detail: 'The system scales down: one child, one journal, one record of movement, culture, and possibility.', image: '/images/proposals/minderoo/generated-books/travel-diary.png', imageAlt: 'Generated travel diary journal' },
]

export default function MinderooPitchPage() {
  return (
    <main className="min-h-screen bg-[#f5ecd9] text-[#2a1f15]">
      {/* SECTION 1 · HERO + INFOGRAPHIC */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 md:px-10 md:pt-20 md:pb-16">
          <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44]">
            STAY · A three-year partnership backing four community-controlled anchors · Minderoo Foundation · April 2026
          </div>

          <h1
            className="max-w-5xl text-5xl leading-[1.05] md:text-6xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            Keeping children close.{' '}
            <span className="relative inline-block">
              <span className="relative z-10 italic">Changing futures.</span>
              <span
                aria-hidden
                className="absolute bottom-1 left-0 right-0 h-[6px] -z-0 rounded-full"
                style={{ background: '#a04a3a', opacity: 0.55 }}
              />
            </span>
          </h1>

          <p
            className="mt-6 max-w-3xl text-xl leading-relaxed text-[#5a3f2a] md:text-2xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
          >
            Two weeks ago, fifty-five judges sat on Country at Oonchiumpa. STAY backs four
            Aboriginal community-controlled organisations already holding children, makes that
            work visible as evidence, and carries the proof into the rooms where decisions are
            made.
          </p>
        </div>

        {/* Hero infographic — STAY model image */}
        <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-20">
          <figure className="overflow-hidden rounded-[28px] border border-[#dec9a9] bg-[#fbf5e9] shadow-[0_18px_46px_rgba(122,46,34,0.08)]">
            <img
              src="/images/stay/keeping-children-close.png"
              alt="STAY model. Community at the centre, surrounded by three rings: Hold (community keeps children close), See (makes the work visible as evidence), and Carry (moves proof into decision rooms). The problem panel names $22.3B every year spent intervening late in children's lives, with most of it sitting in child protection and youth justice. The impact panel names fewer children entering costly systems, better outcomes for families and communities, and better return on Australia's investment. Together: CoLI shows the cost of waiting, STAY shows what works, and we can invest earlier and change futures."
              className="w-full h-auto"
              loading="eager"
            />
          </figure>
          {/* Bottom band removed — the same message lives inside the infographic image. */}
          <div className="hidden">
            <div>
              <p>
                <strong>CoLI</strong> shows the cost of waiting.
              </p>
              <p>
                <strong>STAY</strong> shows what works.
              </p>
              <p>
                Together, we can invest earlier and{' '}
                <strong>change futures</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1.5 · THE MODEL IN MORE DETAIL */}
      <section className="bg-[#fbf5e9] border-y border-[#dec9a9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The model, in more detail
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Three rings. The community at the centre. The funding partner on the outer edge.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
              Read inside-out, the model says: the four community-controlled organisations are
              doing the work. The partnership funds the time to keep doing it, the platform that
              makes it visible, and the public form that lets it travel.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {rings
              .slice()
              .reverse()
              .map((ring) => (
                <article
                  key={ring.name}
                  className="rounded-[28px] border p-7 shadow-[0_14px_36px_rgba(122,46,34,0.06)]"
                  style={{ background: '#ffffff', borderColor: '#dec9a9' }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: ring.colour }}
                    >
                      <ring.icon className="h-5 w-5 text-white" strokeWidth={1.6} />
                    </span>
                    <div
                      className="text-sm font-semibold tracking-[0.22em]"
                      style={{ color: ring.deep }}
                    >
                      {ring.name}
                    </div>
                  </div>
                  <p className="mt-5 text-base leading-7 text-[#3a2a1c]">{ring.body}</p>
                  {ring.platforms && (
                    <ul className="mt-4 space-y-1.5">
                      {ring.platforms.map((p) => (
                        <li key={p.label}>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium underline decoration-[#c08a3e] decoration-1 underline-offset-4 hover:decoration-2"
                            style={{ color: ring.deep }}
                          >
                            {p.label} →
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
          </div>
        </div>
      </section>

      {/* SECTION 1.6 · CASE STUDY ROW (one example per ring) */}
      <section className="bg-[#f5ecd9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              One example per ring
            </div>
            <h2
              className="mt-3 text-4xl leading-tight md:text-5xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              The model is not abstract. Each ring is already producing something real.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {caseStudies.map((cs) => (
              <article
                key={cs.title}
                className="overflow-hidden rounded-[28px] border border-[#dec9a9] bg-white shadow-[0_14px_36px_rgba(122,46,34,0.06)]"
              >
                <div className="relative">
                  <img
                    src={cs.image}
                    alt={cs.imageAlt}
                    className="h-56 w-full object-cover"
                    style={{ objectPosition: 'center 40%' }}
                    loading="lazy"
                  />
                  <span
                    className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white"
                    style={{ background: cs.colour }}
                  >
                    {cs.ring}
                  </span>
                </div>
                <div className="p-6">
                  <h3
                    className="text-2xl leading-tight"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontWeight: 500,
                      color: cs.deep,
                    }}
                  >
                    {cs.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#3a2a1c]">{cs.blurb}</p>
                  {'link' in cs && cs.link && (
                    <a
                      href={cs.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline decoration-1 underline-offset-4 hover:decoration-2"
                      style={{ color: cs.deep, textDecorationColor: cs.colour }}
                    >
                      {cs.link.label} →
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 · THE PROOF POINT ALREADY RUNNING */}
      <section className="border-y border-[#dec9a9] bg-[#fbf5e9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                Proof point already running
              </div>
              <h2
                className="mt-3 text-5xl leading-tight md:text-6xl"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                Two weeks ago, fifty-five judges sat on Country at Oonchiumpa.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
                On 17 April 2026, fifty-five judges and magistrates from across Australia spent the
                day with Kristy Bloomfield and Tanya Turner. The infrastructure this partnership
                would fund was already capturing consented stories. Postcards from that visit go
                out to those judges in September.
              </p>
              <p className="mt-4 text-base leading-7 text-[#5a3f2a]">
                STAY is not a concept seeking permission to begin. It has begun. What Minderoo’s
                named partnership unlocks is the scale, continuity, and visibility of more such
                moments across the cohort.
              </p>
              <blockquote className="mt-6 rounded-[24px] border border-[#dec9a9] bg-white p-6">
                <p
                  className="text-2xl italic leading-snug text-[#2a1f15]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  &ldquo;Our young people are just collateral in a bigger issue. The issue
                  doesn&rsquo;t sit with them.&rdquo;
                </p>
                <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                  Kristy Bloomfield &amp; Tanya Turner · Oonchiumpa · 17 April 2026
                </footer>
              </blockquote>
            </div>
            <div className="rounded-[28px] border border-[#dec9a9] bg-white p-4 shadow-[0_16px_44px_rgba(122,46,34,0.07)]">
              <img
                src="/images/judges-on-country/april-2026.jpg"
                alt="Judges and magistrates on Country at Oonchiumpa with Kristy Bloomfield and Tanya Turner, 17 April 2026"
                className="h-[460px] w-full rounded-[20px] object-cover"
                style={{ objectPosition: 'center 35%' }}
                loading="eager"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-[#dec9a9] bg-[#fbf5e9] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    On Country
                  </div>
                  <div
                    className="mt-2 text-3xl text-[#a04a3a]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    55
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#5a3f2a]">
                    Judges and magistrates at Oonchiumpa, 17 April 2026.
                  </p>
                </div>
                <div className="rounded-[16px] border border-[#dec9a9] bg-[#fbf5e9] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    September send
                  </div>
                  <div
                    className="mt-2 text-3xl text-[#3d5a3a]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    Postcards
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#5a3f2a]">
                    Carrying community voice into chambers across Australia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom image — judges + young people in circle on Country */}
          <figure className="mt-10 overflow-hidden rounded-[28px] border border-[#dec9a9] bg-white shadow-[0_16px_44px_rgba(122,46,34,0.08)]">
            <img
              src="/images/judges-on-country/april-2026-circle.png"
              alt="Judges and magistrates in circle with Oonchiumpa team and young people on Country, 17 April 2026"
              className="w-full h-auto"
              loading="lazy"
            />
            <figcaption className="border-t border-[#f0e1c6] px-6 py-4 text-center">
              <p className="text-sm leading-6 italic text-[#5a3f2a]">
                The infrastructure was already doing its work, already being read by the
                institutional audience it serves.
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* SECTION 2.5 · THE YOUNG PEOPLE */}
      <section className="bg-[#f5ecd9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The young people
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Three of the young people you would be helping communities hold.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
              These voices are drawn from Empathy Ledger transcripts under per-storyteller
              consent. Names used with permission. They are not subjects of this proposal. They
              are co-authors of it.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {youthVoices.map((youth) => (
              <article
                key={youth.name}
                className="overflow-hidden rounded-[28px] border border-[#dec9a9] bg-white shadow-[0_16px_42px_rgba(122,46,34,0.06)]"
              >
                <img
                  src={youth.image}
                  alt={youth.imageAlt}
                  className="h-72 w-full object-cover"
                  style={{ objectPosition: 'center 20%' }}
                  loading="lazy"
                />
                <div className="p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    {youth.place}
                  </div>
                  <h3
                    className="mt-2 text-3xl"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {youth.name}, {youth.age}
                  </h3>
                  <blockquote className="mt-5 border-l-2 border-[#a04a3a] pl-4">
                    <p
                      className="text-xl italic leading-snug text-[#2a1f15]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      &ldquo;{youth.quote}&rdquo;
                    </p>
                    <footer className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a44]">
                      {youth.quoteContext}
                    </footer>
                  </blockquote>
                  <blockquote className="mt-4 border-l-2 border-[#6b8a5a] pl-4">
                    <p
                      className="text-xl italic leading-snug text-[#2a1f15]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      &ldquo;{youth.second}&rdquo;
                    </p>
                    <footer className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a44]">
                      {youth.secondContext}
                    </footer>
                  </blockquote>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-6 italic text-[#5a3f2a]">
            Three young people, in different conversations, all named the same thing as the
            most painful part of detention. Not the loss of freedom. The loss of family.
          </p>
        </div>
      </section>

      {/* SECTION 3 · THE FOUR ANCHORS */}
      <section className="bg-[#f5ecd9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The current cohort
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Four Aboriginal community-controlled anchors, with two to three more being chosen
              carefully.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
              These are not backdrop service providers. They are the heroes of this paper. STAY
              backs the work they are already doing every day, often remotely, often through deep
              Indigenous knowledge that rarely gets treated as the centre of the story even when
              it is the thing keeping children safe.
            </p>
            <div className="mt-6 max-w-3xl rounded-[20px] border border-[#dec9a9] bg-white px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Community approvals
              </div>
              <p className="mt-2 text-sm leading-6 text-[#5a3f2a]">
                Portraits and quotes on this page sit inside per-storyteller and community-level
                approvals held by each anchor organisation. Imagery and stories are released under
                each community’s own governance. Withdrawable at any time across every surface.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {anchors.map((anchor) => (
              <article
                key={anchor.name}
                className="overflow-hidden rounded-[28px] border border-[#dec9a9] bg-white shadow-[0_16px_42px_rgba(122,46,34,0.06)]"
              >
                {anchor.image ? (
                  <img
                    src={anchor.image}
                    alt={anchor.imageAlt}
                    className="h-56 w-full object-cover"
                    style={{ objectPosition: anchor.objectPosition || 'center 30%' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center border-b border-[#e7d4b3] bg-[#fbf5e9] px-6 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                      Imagery pending community framing
                    </div>
                    <div
                      className="mt-3 text-3xl text-[#a04a3a]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {anchor.name}
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    {anchor.region}
                  </div>
                  <h3
                    className="mt-2 text-2xl"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {anchor.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5a3f2a]">{anchor.detail}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {anchor.stats.map((stat) => (
                      <span
                        key={stat}
                        className="rounded-full border border-[#dec9a9] bg-[#fbf5e9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8d6a44]"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm leading-6 text-[#5a3f2a] italic">
            Two to three further relationships are being co-selected through 2026. Communities
            come before coverage; this paper names only relationships that are ready.
          </p>
        </div>
      </section>

      {/* SECTION 4.5 · WHERE THE WORK GATHERS */}
      <section className="bg-[#f5ecd9] border-y border-[#dec9a9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                Where the work gathers
              </div>
              <h2
                className="mt-3 text-4xl leading-tight md:text-5xl"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                A physical centre at Witta. A virtual ring across the country.
              </h2>
              <div className="mt-6 space-y-4 text-base leading-7 text-[#3a2a1c] md:text-[17px] md:leading-8">
                <p>
                  The four anchors do not work alone. They gather at the Harvest, in Witta,
                  Sunshine Coast hinterland, on Jinibara Country. The Centre of Excellence is the
                  physical home for cohort weeks, training cohorts, editorial work, and the long
                  exchange between the basecamps. <span className="italic">Country visits Country.</span>
                </p>
                <p>
                  The first worked example is already booked. The Oonchiumpa team flies east from
                  Mparntwe to spend a week at the Harvest, sit with Quandamooka Elders from MMEIC,
                  and exchange practice with BG Fit and Palm Island Community Company. Cultural
                  authority leads in both directions.
                </p>
                <p>
                  And the centre is broader than youth justice. It centres the young person, then
                  works across justice, child protection, education, and disability as four sides
                  of one room. The system gives a young person four file numbers. Community gives
                  them one name.
                </p>
                <p>
                  Year 1 advances three things at the Harvest at once. The first three cohort
                  weeks. The editorial residency that holds the journals. And a tour rhythm that
                  carries Witta out to the basecamps. Perth in July. Mt Druitt in spring. Adelaide
                  and Tennant Creek through summer. Brisbane in autumn 2027. Place-based, in
                  Minderoo&apos;s sense of the word. The Centre is not a building. It is a rhythm
                  that lets community-led practice travel without flattening place.
                </p>
              </div>
              <a
                href="/centre-of-excellence"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#5a3a2a] px-5 py-2.5 text-sm font-medium text-[#5a3a2a] transition-colors hover:bg-[#5a3a2a] hover:text-[#fbf5e9]"
              >
                Open the Centre of Excellence
                <span aria-hidden>→</span>
              </a>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-[#dec9a9] bg-[#fbf5e9] p-8 shadow-[0_16px_40px_rgba(122,46,34,0.06)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                  The ring, named
                </div>
                <ul className="mt-5 space-y-4 text-[15px] leading-6 text-[#3a2a1c]">
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#5a3a2a]" />
                    <span>
                      <span className="font-semibold">Witta, QLD.</span> Jinibara Country. The
                      physical centre. Eat. Gather. Make. Grow.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#7a2e22]" />
                    <span>
                      <span className="font-semibold">Oonchiumpa.</span> Mparntwe. Eastern Arrernte
                      Country. 95% diversion. 21 active young people.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#7a2e22]" />
                    <span>
                      <span className="font-semibold">Palm Island Community Company.</span> The
                      Centre, Townsville. Bwgcolman / Manbarra Country. Stretch Beds enterprise live.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#7a2e22]" />
                    <span>
                      <span className="font-semibold">BG Fit.</span> Mount Isa. Kalkadoon Country.
                      85% diversion. 400+ young people each year.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#7a2e22]" />
                    <span>
                      <span className="font-semibold">MMEIC.</span> Minjerribah / North Stradbroke
                      Island. Quandamooka Country. Elder-led cultural authority.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4.7 · WHY THIS TEAM (vs JRI / researchers / framework-builders) */}
      <section className="bg-[#fbf5e9] border-y border-[#dec9a9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              Why this team. Why now.
            </div>
            <h2
              className="mt-3 text-4xl leading-tight md:text-5xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Justice Reform Initiative writes submissions. Researchers write proposals. A Curious Tractor shows you a thing already running.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
              Minderoo has already funded the report on what acting too late costs. The next dollar
              should not fund another report. It should fund the demonstration of acting earlier,
              in four communities, with the infrastructure to make it travel.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                kicker: 'Already running',
                title: 'Not a proposal. A practice.',
                body: 'Fifty-five judges sat on Country at Oonchiumpa on 17 April. The Contained tour is moving with eighty-six people across fifteen locations. Four anchors are holding children right now. ACT is asking Minderoo to back the next twelve months of a thing that is already breathing.',
              },
              {
                kicker: 'Money lands on community',
                title: '48% direct. Untied. No project compliance.',
                body: 'Forty-eight cents of every Year 1 dollar lands on Oonchiumpa, PICC, BG Fit, and MMEIC as untied support. Cultural authority is paid. Aunties and Elders are paid. A research grant of similar size sends most of itself to staff and reports. ACT inverts that ratio on purpose.',
              },
              {
                kicker: 'The data layer is built',
                title: 'Sovereignty as architecture, not as a clause.',
                body: 'JusticeHub. Empathy Ledger. CivicGraph. The Australian Living Map of Alternatives. Per-storyteller consent. Withdrawable. OCAP-aligned. External technical audit lands as a public artefact in month 10. JRI does not have this layer. Researchers would need a year and a million dollars to build a worse version. ACT brings it on day one.',
              },
              {
                kicker: 'Frameworks are downstream',
                title: 'The model already exists in community practice.',
                body: 'Researchers ask: fund us to develop a framework. ACT says: the framework already exists in community practice, fund us to make it visible, indexed, and able to travel. The Living Map is not a literature review of what should work. It is the registry of what is already working, on the terms of the people doing it.',
              },
              {
                kicker: 'A real public vehicle',
                title: 'A tour, not a launch event.',
                body: 'Contained moves through Perth, Mt Druitt, Adelaide, Tennant Creek, Brisbane. STAY images, postcards, journals travel with it. JRI runs forums. Universities run symposia. ACT runs a tour that arrives in chambers, galleries, and community halls where the conversation already is.',
              },
              {
                kicker: 'Speed of community',
                title: 'Founder-held relationships, no institutional drag.',
                body: 'Ben and Nic carry the relationships personally, in a small Pty structure with a charitable arm. No university IP committee. No grant subcommittee. No press office. Decisions move at the speed Mparntwe or Bwgcolman or Kalkadoon Country move.',
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] border border-[#dec9a9] bg-white p-7 shadow-[0_14px_36px_rgba(122,46,34,0.06)]"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a04a3a]">
                  {card.kicker}
                </div>
                <h3
                  className="mt-3 text-2xl leading-tight text-[#2a1f15]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#3a2a1c]">{card.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[28px] border border-[#dec9a9] bg-white p-7">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7c5a2a]">
                What ACT does not claim
              </div>
              <p className="mt-3 text-sm leading-6 text-[#3a2a1c]">
                Justice Reform Initiative has policy reach into Canberra ACT does not match.
                Researchers carry peer-reviewed credibility ACT does not match. The honest pitch
                is not that ACT replaces them. ACT is the connective tissue that lets community
                work feed JRI&apos;s policy ask and the researchers&apos; evidence base, with the
                data sovereignty layer none of them was going to build.
              </p>
            </div>
            <div className="rounded-[28px] border border-[#5a3a2a] bg-[#5a3a2a] p-7 text-[#fbf5e9]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4b07a]">
                The reframe to walk in with
              </div>
              <p
                className="mt-3 text-2xl leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontStyle: 'italic' }}
              >
                The next dollar should not fund another report. It should fund the demonstration of acting earlier, in four communities, with the infrastructure to make it travel.
              </p>
              <a
                href="/pitch/minderoo/background-paper"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#d4b07a] underline decoration-[#d4b07a] decoration-1 underline-offset-4 hover:decoration-2"
              >
                Read the full case in the background paper
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 · THE ASK */}
      <section className="bg-[#5a3a2a] text-[#fbf5e9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-4xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d4b07a]">
              The ask
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              <span style={{ color: '#f0d9a8' }}>Year 1 from $600K.</span>{' '}
              <span className="italic" style={{ color: '#d4b07a' }}>
                Then up, steady, or down with proof in hand.
              </span>
            </h2>
            <p className="mt-5 text-base leading-7 text-[#e9d9b8]">
              The Year 1 commitment is bounded and reversible. Three entry tiers let Minderoo size
              the test. At month-10 review, four ramp shapes let the partnership flex up, hold
              steady, taper down, or conclude, based on what Year 1 actually produces.
            </p>
          </div>

          {/* BLOCK A · YEAR 1 ENTRY TIERS */}
          <div className="mt-12">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4b07a]">
              Year 1 · Three entry tiers
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#e9d9b8]">
              Pick the tier that fits Minderoo&rsquo;s appetite. Each tier carries the same
              partnership frame; only the Y1 scope and dollar amount change.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {yearOneTiers.map((tier) => (
                <article
                  key={tier.label}
                  className={`relative rounded-[24px] border p-6 ${
                    tier.recommended
                      ? 'border-[#f0d9a8] bg-[#f0d9a8] text-[#3a2a1c] shadow-[0_16px_44px_rgba(240,217,168,0.18)]'
                      : 'border-white/15 bg-white/5 text-[#fbf5e9] backdrop-blur'
                  }`}
                >
                  {tier.recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#a04a3a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#fbf5e9]">
                      Recommended
                    </span>
                  )}
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                      tier.recommended ? 'text-[#7a4a1c]' : 'text-[#d4b07a]'
                    }`}
                  >
                    {tier.label}
                  </div>
                  <div
                    className={`mt-3 text-5xl leading-none ${
                      tier.recommended ? 'text-[#3a2a1c]' : 'text-[#f0d9a8]'
                    }`}
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {tier.amount}
                  </div>
                  <p
                    className={`mt-4 text-sm leading-6 ${
                      tier.recommended ? 'text-[#3a2a1c]' : 'text-[#f0e7d3]'
                    }`}
                  >
                    {tier.summary}
                  </p>
                  <hr
                    className={`my-5 ${
                      tier.recommended ? 'border-[#cba76a]' : 'border-white/15'
                    }`}
                  />
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      tier.recommended ? 'text-[#7a4a1c]' : 'text-[#d4b07a]'
                    }`}
                  >
                    Best fit
                  </div>
                  <p
                    className={`mt-1 text-sm leading-5 ${
                      tier.recommended ? 'text-[#5a3f2a]' : 'text-[#e9d9b8]'
                    }`}
                  >
                    {tier.fit}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* BLOCK B · WHAT Y1 FUNDS (STANDARD) */}
          <div className="mt-12 rounded-[28px] border border-white/15 bg-white/5 p-7 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4b07a]">
              What Year 1 Standard funds, in detail
            </div>
            <p className="mt-2 text-sm leading-6 text-[#e9d9b8]">
              Light tier reduces to two anchors and the postcards send. Lean-in adds cross-site
              exchange and Africa/Europe storytelling integration to the platform.
            </p>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {yearOnePieces.map((piece, i) => (
                <li key={piece} className="flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                    style={{ background: '#a04a3a', color: '#fbf5e9' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-6 text-[#f0e7d3]">{piece}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* BLOCK C · YEAR 2-3 RAMP SHAPES */}
          <div className="mt-12">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4b07a]">
              Year 2 and Year 3 · Four ramp shapes
            </div>
            <h3
              className="mt-2 max-w-3xl text-3xl leading-tight md:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              At the month-10 review, the partnership flexes to fit what Year 1 actually produced.
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#e9d9b8]">
              Year 2 is never a leap of faith. By month 10, Minderoo has the baseline evidence
              layer, the September postcards received, an external audit of the consent layer, at
              least two community-authored public artefacts, and a live partnership dashboard.
              The ramp shape is offered against those observable outcomes.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {rampShapes.map((shape) => (
                <article
                  key={shape.label}
                  className="rounded-[24px] border border-white/15 bg-white/5 p-6 backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold"
                      style={{ background: shape.accent, color: shape.colour }}
                    >
                      {shape.icon}
                    </span>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4b07a]">
                        {shape.label}
                      </div>
                      <div
                        className="mt-1 text-xl leading-tight"
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontWeight: 500,
                          color: '#fbf5e9',
                        }}
                      >
                        {shape.headline}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#f0e7d3]">{shape.detail}</p>
                  <hr className="my-4 border-white/10" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4b07a]">
                    When this fits
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#e9d9b8]">{shape.trigger}</p>
                </article>
              ))}
            </div>
          </div>

          {/* BLOCK D · OPTIONAL ARCHITECTURE */}
          <div className="mt-12 rounded-[28px] border border-[#d4b07a]/40 bg-[#f0d9a8]/15 p-7 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4b07a]">
              Available alongside any ramp
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {optionalArchitecture.map((opt) => (
                <div key={opt.label} className="rounded-[18px] border border-white/12 bg-white/5 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0d9a8]">
                    {opt.label}
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[#f0e7d3]">{opt.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CLOSING */}
          <div className="mt-10 rounded-[24px] border border-[#d4b07a]/40 bg-white/5 p-6 text-center backdrop-blur">
            <p
              className="text-2xl leading-snug italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, color: '#f0d9a8' }}
            >
              The frame is simple. The entry point is clear. The Year 1 commitment is bounded and
              reversible. Everything beyond that is a decision Minderoo makes with proof in hand.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5.5 · INSIDE THE PARTNERSHIP — HOW $1.1M LANDS IN PRACTICE */}
      <section className="bg-[#fbf5e9] border-y border-[#dec9a9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              Inside the partnership
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              How $1.1M lands as practice across twelve months.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
              Six concrete buckets. Each one named, costed, and traceable to one of the three rings.
              The numbers are Year 1 Standard. Light reduces, Lean-in extends. Light, Standard, and
              Lean-in all carry the same partnership architecture; only the scope and dollar amount
              change.
            </p>
          </div>

          {/* Tier comparison — how the three tiers transpose across rings */}
          <div className="mt-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
              The money overlay · How the three tiers transpose
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a3f2a]">
              The same partnership architecture across all three tiers. Same ring percentages.
              Different scope and dollar amount per bucket. Standard is detailed in full below;
              Light reduces specific buckets, Lean-in extends them.
            </p>
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {tierBreakdown.map((tier) => (
                <article
                  key={tier.label}
                  className={`relative rounded-[24px] border p-6 shadow-[0_12px_30px_rgba(122,46,34,0.05)] ${
                    tier.recommended
                      ? 'border-[#a04a3a] bg-white shadow-[0_16px_44px_rgba(160,74,58,0.18)]'
                      : 'border-[#dec9a9] bg-white'
                  }`}
                >
                  {tier.recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#a04a3a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-baseline justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                      {tier.label}
                    </div>
                    <div
                      className="text-3xl text-[#2a1f15]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {tier.amount}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-5 italic text-[#5a3f2a]">{tier.fit}</p>
                  {/* stacked bar */}
                  <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
                    {tier.rings.map((r) => (
                      <div
                        key={r.ring}
                        style={{ width: `${r.pct}%`, background: r.colour }}
                        aria-label={`${r.ring} ${r.pct}%`}
                      />
                    ))}
                  </div>
                  <ul className="mt-4 space-y-3">
                    {tier.rings.map((r) => (
                      <li key={r.ring} className="border-l-2 pl-3" style={{ borderColor: r.colour }}>
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: r.colour }}>
                            {r.ring}
                          </div>
                          <div className="text-base font-semibold text-[#2a1f15]">
                            {r.amount} <span className="text-xs font-normal text-[#8d6a44]">· {r.pct}%</span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#5a3f2a]">{r.detail}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          {/* Six bucket cards */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {insideY1.map((bucket) => (
              <article
                key={bucket.title}
                className="rounded-[24px] border border-[#dec9a9] bg-white p-6 shadow-[0_14px_36px_rgba(122,46,34,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white"
                      style={{ background: bucket.colour }}
                    >
                      {bucket.ring}
                    </span>
                    <h3
                      className="mt-3 text-2xl leading-tight text-[#2a1f15]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {bucket.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl leading-none"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontWeight: 500,
                        color: bucket.colour,
                      }}
                    >
                      {bucket.amount}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                      {bucket.pct} of Y1
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#3a2a1c]">{bucket.detail}</p>
                <hr className="my-4 border-[#f0e1c6]" />
                <ul className="space-y-2">
                  {bucket.pieces.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm leading-5 text-[#5a3f2a]">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: bucket.colour }}
                        aria-hidden
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Year 3 destination preview */}
          <div className="mt-10 rounded-[28px] border border-[#cbd5b9] bg-[#f0eed8] p-7 shadow-[0_14px_36px_rgba(61,90,58,0.07)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#3d5a3a]">
              The Year 3 destination
            </div>
            <h3
              className="mt-3 text-3xl leading-tight md:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, color: '#2a1f15' }}
            >
              The book. The exhibition. The field convening on Country.
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#3a2a1c]">
              Year 1 lays the editorial spine. Year 2 connects the cohort. Year 3 publishes. The
              published artefact, scope co-designed with the four anchors, can land as a book, a
              touring exhibition, or a multimedia public library, with a national field convening
              on Country bringing the four anchors, the co-selected next, Minderoo, peer
              foundations, and policy figures into one room. Every Year 1 dollar feeds material
              that Year 3 carries outward.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[18px] border border-[#cbd5b9] bg-white p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3d5a3a]">
                  The book
                </div>
                <p className="mt-2 text-sm leading-5 text-[#3a2a1c]">
                  STAY series volumes for each anchor, slip-cased as a single library object that
                  travels into chambers, foundations, and parliaments.
                </p>
              </div>
              <div className="rounded-[18px] border border-[#cbd5b9] bg-white p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3d5a3a]">
                  The exhibition
                </div>
                <p className="mt-2 text-sm leading-5 text-[#3a2a1c]">
                  A national tour stop or gallery exhibition, building on Contained&rsquo;s existing
                  fifteen-location momentum, opened first in a community-chosen city.
                </p>
              </div>
              <div className="rounded-[18px] border border-[#cbd5b9] bg-white p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3d5a3a]">
                  The convening
                </div>
                <p className="mt-2 text-sm leading-5 text-[#3a2a1c]">
                  The four anchors and co-selected next, Minderoo, peer funders, and policy figures
                  in one room on Country. The proof becomes a moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 · THE ACTION PATH */}
      <section className="bg-[#f5ecd9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The action path
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Reversible at every gate. No step asks for more than the previous step earned.
            </h2>
          </div>
          <div className="mt-10 overflow-hidden rounded-[28px] border border-[#dec9a9] bg-white shadow-[0_14px_36px_rgba(122,46,34,0.06)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e7d4b3] bg-[#fbf5e9] text-[11px] uppercase tracking-[0.18em] text-[#8d6a44]">
                  <th className="px-6 py-4 font-semibold">When</th>
                  <th className="px-6 py-4 font-semibold">What happens</th>
                  <th className="px-6 py-4 font-semibold">Minderoo input</th>
                </tr>
              </thead>
              <tbody>
                {actionPath.map((row, i) => (
                  <tr
                    key={row.when}
                    className={`border-b border-[#f0e1c6] last:border-0 ${
                      row.when.startsWith('Around August 2027') ? 'bg-[#f0d9a8]/40' : ''
                    }`}
                  >
                    <td className="px-6 py-5 align-top text-[13px] font-semibold text-[#3a2a1c]">{row.when}</td>
                    <td className="px-6 py-5 align-top leading-6 text-[#3a2a1c]">{row.what}</td>
                    <td className="px-6 py-5 align-top leading-6 text-[#5a3f2a]">{row.input}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 7 · THE STAY SERIES */}
      <section className="border-y border-[#dec9a9] bg-[#fbf5e9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The STAY series
            </div>
            <h2
              className="mt-3 text-5xl leading-tight md:text-6xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              One library. Seven volumes. Per-young-person journals.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
              The STAY series is the publishing line that holds Mparntwe, Bwgcolman, Kalkadoon,
              Quandamooka, and the next anchors as they are co-selected. Each community gets a
              volume on its own terms. Each young person can hold a journal of their own.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {stayBooks.map((book) => (
              <figure
                key={book.title}
                className="overflow-hidden rounded-[28px] border border-[#dec9a9] bg-white shadow-[0_14px_36px_rgba(122,46,34,0.06)]"
              >
                <img src={book.image} alt={book.imageAlt} className="h-72 w-full object-cover" loading="lazy" />
                <figcaption className="border-t border-[#f0e1c6] px-6 py-5">
                  <div
                    className="text-2xl leading-tight text-[#2a1f15]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {book.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5a3f2a]">{book.detail}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <img
              src="/images/proposals/minderoo/generated-books/library-shelf.png"
              alt="Generated STAY series library shelf with volumes for Mparntwe, Bwgcolman, Kalkadoon, Jaru, Darug, Ngemba, and Minjerribah"
              className="h-[360px] w-full rounded-[28px] border border-[#dec9a9] bg-white object-cover shadow-[0_14px_36px_rgba(122,46,34,0.06)]"
              loading="lazy"
            />
            <div className="flex flex-col justify-center rounded-[28px] border border-[#dec9a9] bg-white p-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Across Australia
              </div>
              <p
                className="mt-3 text-3xl leading-tight text-[#2a1f15]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                Start with four. Let the pattern travel without flattening place.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#5a3f2a]">
                The point is not one hero site or one beautiful book. It is a repeatable, locally
                held pattern: the young person stays visible, the journal holds the story, the
                method becomes legible, and the learning can move across the country without
                turning communities into branches of the same program.
              </p>
              <p className="mt-4 text-sm leading-6 text-[#5a3f2a]">
                And the volumes do not wait for a launch event to become public. As the Contained
                tour moves through Perth, Mt Druitt, Adelaide, Tennant Creek, and Brisbane, the
                STAY images, postcards, and journals travel with it. The book is one form. The
                gallery wall is another. The journal in a young person&apos;s hands is a third.
                Each stop is a place where the environments surrounding a young person become
                visible to the room, which is the work the Communities pillar is asking for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 · BACKGROUND PAPER + COURTESY */}
      <section className="bg-[#f5ecd9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                For internal Minderoo review
              </div>
              <h2
                className="mt-3 text-5xl leading-tight md:text-6xl"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                A 17-page background paper for after the meeting.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#5a3f2a]">
                The deeper detail lives in a publication-quality paper that any Minderoo
                reviewer can read in 10 to 15 minutes. It includes the full cost case, the
                platform stack, governance and consent architecture, the five partnership
                pathway shapes for the November conversation, and references for verification.
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-[#5a3f2a]">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#a04a3a]" />Executive summary, opportunity, model, ask, action path.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c08a3e]" />Appendix: cost case, platform stack, governance, partnership pathways, the people.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#6b8a5a]" />References: CoLI 2024, ROGS, OCAP, Closing the Gap PR2, Front Project.</li>
              </ul>
              <a
                href="/pitch/minderoo/background-paper"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#5a3a2a] px-6 py-3 text-sm font-medium text-[#fbf5e9] transition-colors hover:bg-[#7a2e22]"
              >
                Open the background paper
                <span aria-hidden>→</span>
              </a>
            </div>
            <aside className="rounded-[28px] border border-[#dec9a9] bg-white p-6 shadow-[0_16px_44px_rgba(122,46,34,0.06)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Three pieces already in motion
              </div>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-[#3a2a1c]">
                <li>Contained tour Perth stop, July to August, with UWA and JRI Perth.</li>
                <li>Closing the Gap Priority Reform 2: building the community-controlled sector.</li>
                <li>September 2026 postcards send to the fifty-five judges.</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* SECTION 9 · KRISTY + TANYA — THE TWO WOMEN BEHIND OONCHIUMPA */}
      <section className="border-t border-[#dec9a9] bg-[#fbf5e9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="grid grid-cols-2 gap-4">
              <figure className="overflow-hidden rounded-[24px] border border-[#dec9a9] bg-white shadow-[0_16px_42px_rgba(122,46,34,0.08)]">
                <img
                  src="/images/orgs/oonchiumpa/team/kristy.jpg"
                  alt="Kristy Bloomfield, Oonchiumpa, Mparntwe"
                  className="h-[520px] w-full object-cover"
                  style={{ objectPosition: 'center 25%' }}
                  loading="lazy"
                />
                <figcaption className="border-t border-[#f0e1c6] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    Mparntwe
                  </div>
                  <div
                    className="mt-1 text-xl text-[#2a1f15]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    Kristy Bloomfield
                  </div>
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-[24px] border border-[#dec9a9] bg-white shadow-[0_16px_42px_rgba(122,46,34,0.08)]">
                <img
                  src="/images/orgs/oonchiumpa/team/tanya.jpg"
                  alt="Tanya Turner, Oonchiumpa, Mparntwe"
                  className="h-[520px] w-full object-cover"
                  style={{ objectPosition: 'center 25%' }}
                  loading="lazy"
                />
                <figcaption className="border-t border-[#f0e1c6] px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    Mparntwe
                  </div>
                  <div
                    className="mt-1 text-xl text-[#2a1f15]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    Tanya Turner
                  </div>
                </figcaption>
              </figure>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                In Tanya’s words
              </div>
              <blockquote
                className="mt-5 text-3xl leading-snug text-[#2a1f15] md:text-4xl"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontStyle: 'italic' }}
              >
                &ldquo;Our young people are just collateral in a bigger issue. The issue
                doesn’t sit with them. It sits on a much broader level and with adults, not with
                children.&rdquo;
              </blockquote>
              <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Tanya Turner · Oonchiumpa · Mparntwe
              </footer>
              <hr className="my-8 border-[#dec9a9]" />
              <div className="space-y-4 text-base leading-7 text-[#3a2a1c]">
                <p>
                  <strong className="text-[#a04a3a]">Tanya Turner</strong> is an Eastern
                  Arrernte woman. She took a law degree at the University of Western Australia,
                  worked as an associate at the Supreme Court of Victoria, and ran a family
                  mediation practice with a 95 per cent resolution rate. Then she felt the pull
                  home, and resigned two weeks later. That impulse, to bring expertise back where
                  it belongs, is the architecture of Oonchiumpa.
                </p>
                <p>
                  <strong className="text-[#a04a3a]">Kristy Bloomfield</strong> is Central
                  Arrernte, Eastern Arrernte, and Alyawarra. Traditional Owner of Mparntwe. She
                  carries the stories of sacred sites that only her family knows. Her
                  grandfather was taken to the Bungalow as a stolen child, and went to
                  extraordinary lengths to keep his own children from the same fate. The history
                  she carries is not abstract. It is personal and it is living.
                </p>
                <p
                  className="rounded-[20px] border border-[#dec9a9] bg-white p-5 text-[#2a1f15]"
                >
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    The goal, in Tanya’s words
                  </span>
                  <span className="mt-2 block">
                    Not just to serve Alice Springs better. To demonstrate what is possible
                    when Aboriginal people with cultural authority are given the resources to
                    lead.
                  </span>
                </p>
                <p className="text-lg italic text-[#5a3f2a]">
                  Together, Kristy and Tanya are why STAY exists. Communities are the heroes.
                  Minderoo’s name lives on the outer ring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#dec9a9] bg-[#5a3a2a] text-[#e9d9b8]">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
          <p
            className="text-2xl leading-snug italic"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            The communities are the heroes. Minderoo’s name lives on the outer ring. The frame
            is simple. The entry point is clear.
          </p>
          <hr className="my-6 border-[#7a5a3a]" />
          <div className="grid gap-6 text-sm md:grid-cols-2 md:items-end md:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4b07a]">
                Author
              </div>
              <p className="mt-2">
                Ben Knight · A Curious Tractor / JusticeHub
                <br />
                <a href="mailto:benjamin@act.place" className="underline decoration-[#d4b07a] underline-offset-4">
                  benjamin@act.place
                </a>
              </p>
            </div>
            <div className="md:text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4b07a]">
                Source of truth
              </div>
              <p className="mt-2">
                justicehub.com.au/pitch/minderoo
                <br />
                Background paper: STAY · April 2026
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
