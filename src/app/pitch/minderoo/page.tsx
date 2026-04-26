import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.justicehub.com.au'),
  title: 'The Three Circles · for Minderoo Foundation',
  description:
    'A named evidence partnership that turns The Front Project’s CoLI research Minderoo has supported into a living community-justice proof program across four Aboriginal community-controlled anchors. First tranche of a six-year arc.',
  openGraph: {
    title: 'The Three Circles · for Minderoo Foundation',
    description:
      'A named evidence partnership that turns The Front Project’s CoLI research Minderoo has supported into a living community-justice proof program across four Aboriginal community-controlled anchors. First tranche of a six-year arc.',
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
    title: 'The Three Circles · for Minderoo Foundation',
    description:
      'A named evidence partnership that turns The Front Project’s CoLI research Minderoo has supported into a living community-justice proof program across four Aboriginal community-controlled anchors. First tranche of a six-year arc.',
    images: ['/images/orgs/oonchiumpa/boys-drone.jpg'],
  },
  robots: {
    index: false,
    follow: false,
  },
}

const topStats = [
  { label: 'Three-year ask', value: '$2.9M', detail: 'Place-based hold over FY2026–FY2028' },
  { label: 'Year 1 entry', value: '$780K', detail: 'Clean first-step ask to start the cohort well' },
  { label: 'Anchor cohort', value: '4', detail: 'Four confirmed anchors across sovereign community-controlled organisations' },
  { label: 'Detention comparison', value: '< 5 months', detail: 'Three-year ask is less than five months of one Victorian child in detention at $7,775/day (CoLI 2024, Fig 18)' },
]

const strategyFit = [
  {
    title: 'Partner',
    text: 'Untied support that lets communities stay with children and families instead of chasing brittle project reporting.',
  },
  {
    title: 'Generate Evidence',
    text: 'JusticeHub, CivicGraph, and consented documentation turn lived community knowledge into evidence others can act on.',
  },
  {
    title: 'Develop',
    text: 'The Brave Ones builds local capability through journals, documentation, exchanges, and editorial accompaniment.',
  },
  {
    title: 'Advocate',
    text: 'The Year 3 public artefact carries community-held proof into philanthropy, media, and government without stripping out context.',
  },
]

const coliStats = [
  {
    label: 'Real-terms rise since 2019',
    value: '+74% / +81% / +110%',
    detail: 'Child protection, youth justice, and family violence spending — the three categories this pitch touches — have all risen in real terms since the 2019 CoLI Minderoo supported. Family violence more than doubled. The research is not enough on its own.',
  },
  {
    label: 'Victorian youth detention',
    value: '$7,775 / day',
    detail: 'Cost per child per day in Victorian youth detention. The three-year $2.9M ask is less than five months of one Victorian child in custody (CoLI 2024, Fig 18).',
  },
  {
    label: 'State cost spread',
    value: '$2,162 → $7,775',
    detail: 'Queensland lowest, Victoria highest, per child per day. An averted detention-year in Victoria saves ~$2.84M. Place-based hold across four anchors for three years costs less than that.',
  },
  {
    label: 'Fewer people, higher cost',
    value: '+50% / −23%',
    detail: 'Cost per person in youth detention rose 50% while young people on community supervision fell 23% (CoLI 2024, p.3). Australia is building a more expensive system to hold fewer young people. The community-alternative argument writes itself.',
  },
]

const coliBridgeQuote = {
  text: 'Over half of children in custody in youth justice in Victoria have been subject to a child protection order, more than half are accessing mental health support and have a history of substance abuse.',
  attribution: 'Victorian Government, 2023 — cited in The Front Project, CoLI 2024, p.3',
}

const coliRecommendations = [
  {
    label: 'CoLI 2024 says',
    recommendation: 'Invest in effective early intervention for all children and families.',
    circle: 'Circle One — Stay',
    implementation: 'Place-based hold at Oonchiumpa, Palm Island Community Company, BG Fit, and MMEIC. Untied support for the daily relationships and cultural authority that keep a child reachable before an institution becomes the dominant narrator.',
  },
  {
    label: 'CoLI 2024 says',
    recommendation: 'Invest in wrap-around models (hubs, foyers, Child and Family Hubs).',
    circle: 'Circle One — Stay',
    implementation: 'The basecamp model already holds health, justice, culture, and family at one touchpoint. Wrap-around is what Aboriginal community-controlled organisations have always done. Funding makes the practice visible as method.',
  },
  {
    label: 'CoLI 2024 says',
    recommendation: 'Improve data collection on prevalence and costs of key social issues.',
    circle: 'Circle Two — See',
    implementation: 'JusticeHub and ALMA are the data collection improvement the report calls for. 1,081 community-led organisations mapped, 148K funding records, per-storyteller consent. The mechanism is already live.',
  },
  {
    label: 'CoLI 2024 says',
    recommendation: 'Address the vertical fiscal imbalance — states pay, Commonwealth reaps benefits.',
    circle: 'Circle Three — Carry',
    implementation: 'The public artefact and civic accountability layer carry community-held proof into the Commonwealth rooms where early-intervention savings accrue. Evidence that travels past the state line.',
  },
]

const policyBridgeSignals = [
  'Minderoo supported the research that named the cost.',
  'Communities are already holding the answer.',
  'This partnership funds the delivery mechanism.',
]

const threeCircleLayers = [
  {
    label: 'Circle One',
    title: 'Stay with the communities already holding children well.',
    detail:
      'Untied, place-based support backs the relationships, protocol, travel, and daily hold that keep a child reachable before an institution becomes the dominant narrator.',
    tone: 'bg-white text-[#2b2530]',
  },
  {
    label: 'Circle Two',
    title: 'Make the field visible as shared truth.',
    detail:
      'JusticeHub, CivicGraph, and Empathy Ledger hold story, evidence, funding context, and cultural authority in a single frame, searchable per storyteller.',
    tone: 'bg-[#f5ecdf] text-[#2b2530]',
  },
  {
    label: 'Circle Three',
    title: 'Carry that proof outward with public courage.',
    detail:
      'The Brave Ones becomes the public form: portraits, journals, exchanges, and artefacts that move what communities already know into funder, judicial, and civic rooms.',
    tone: 'bg-[#4a2560] text-white',
  },
]

const bookSystemFrames = [
  {
    title: 'One library, held as an object',
    detail:
      'A shelf and a slipcase of method books and community volumes that travel into real rooms.',
    image: '/images/proposals/minderoo/generated-books/library-slipcase.png',
    imageAlt: 'Generated slipcase of the STAY series books',
    span: 'md:col-span-2',
  },
  {
    title: 'The method has a recognisable spine',
    detail:
      'Three Circles is one visible volume inside that system. Recognisable to a judge, to a funder, to a young person.',
    image: '/images/proposals/minderoo/generated-books/three-circles-cover.png',
    imageAlt: 'Generated Three Circles book cover',
    span: '',
  },
  {
    title: 'Each young person can hold a journal of their own',
    detail:
      'The system scales down as well as out: one child, one journal, one record of movement, culture, memory, and possibility.',
    image: '/images/proposals/minderoo/generated-books/travel-diary.png',
    imageAlt: 'Generated travel diary journal',
    span: '',
  },
]

const communities = [
  {
    name: 'Oonchiumpa',
    region: 'Mparntwe (Alice Springs), NT',
    detail:
      '100% Aboriginal-led. Kristy Bloomfield and Tanya Turner work across seven Central Australian language groups, with cultural authority held by Aunty Bev and Uncle Terry and an on-Country home at Atnarpa.',
    stats: ['95% diversion', '7 language groups', '97.6% less cost than detention'],
    image: '/images/orgs/oonchiumpa/founders.jpg',
    imageAlt: 'Kristy Bloomfield and Tanya Turner standing together outdoors',
  },
  {
    name: 'Palm Island Community Company',
    region: 'Palm Island, QLD',
    detail:
      'Community-owned infrastructure with $29M turnover and 208 FTE. Rachel Atkinson leads alongside a Palm Island Elders Group that has already recorded sixteen stories through Empathy Ledger.',
    stats: ['$29M turnover', '208 FTE', '48 storytellers on EL'],
    image: null,
    imageAlt: '',
  },
  {
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    detail:
      'Brodie Germaine’s method blends fitness, cultural camps, and remote outreach. Per-participant police contact drops from 5 a year to under 1 once a young person is inside it.',
    stats: ['5→<1 police contacts/yr', 'Doomadgee outreach', 'sport + Elders + discipline'],
    image: '/images/orgs/bg-fit/hero.jpg',
    imageAlt: 'BG Fit group outside the gym',
  },
  {
    name: 'MMEIC',
    region: 'Minjerribah, QLD',
    detail:
      'Minjerribah Moorgumpin Elders-in-Council holds elder governance as governance, not as an admin category. Founded 1993, continuous on Quandamooka country.',
    stats: ['Founded 1993', 'Quandamooka country', 'elder governance'],
    image: null,
    imageAlt: '',
  },
  {
    name: 'Co-selected relationships',
    region: '2026 selection window',
    detail:
      'Two to three additional relationships are still being chosen carefully. This envelope names only the communities that are currently ready to carry the case.',
    stats: ['relationship-led', 'not announced yet', 'communities before coverage'],
    image: null,
    imageAlt: '',
  },
]

const hiddenStoryLayers = [
  {
    title: 'The room',
    kicker: 'The kettle is already on.',
    text: 'The kettle is on before any formal intervention arrives. Someone knows who needs tea, who needs silence, and who needs company without interrogation.',
    image: '/images/orgs/oonchiumpa/mentoring.jpg',
    imageAlt: 'Oonchiumpa mentoring in the field',
  },
  {
    title: 'The keepers',
    kicker: 'The organisations are protagonists.',
    text: 'Aunties, Elders, ACCOs, and remote workers hold knowledge that institutions reduce to service delivery when it is really governance.',
    image: '/images/orgs/oonchiumpa/team/kristy.jpg',
    imageAlt: 'Kristy Bloomfield portrait',
  },
  {
    title: 'The young people',
    kicker: 'The young people are more than evidence.',
    text: 'Given dignity, structure, and a chance to be seen, young people step into leadership, creativity, and responsibility as co-authors of a different future.',
    image: '/images/orgs/oonchiumpa/jackquann.jpg',
    imageAlt: 'Jackquann portrait',
  },
]

const quotes = [
  {
    quote: '“At six o’clock you get locked down. You wait till tomorrow.”',
    attribution: 'Jackquann, 14 · Oonchiumpa',
  },
  {
    quote: '“Looking after my family.”',
    attribution: 'Jackquann, 14 · on what keeps him out',
  },
  {
    quote:
      '“If we had our way, we wouldn’t have to go to town if we had the resources and things. I feel really strong about my connection to country.”',
    attribution: 'Kylie Bloomfield · Oonchiumpa · via Empathy Ledger',
  },
  {
    quote:
      '“I played rugby league at a high level and I know what sport can do for young people. It is not just fitness.”',
    attribution: 'Brodie Germaine · BG Fit',
  },
  {
    quote: '“I’m a local on Palm Island. I’m Aboriginal. I’ve lived here since I was born.”',
    attribution: 'Henry Doyle · Palm Island · via Empathy Ledger',
  },
  {
    quote: '“He right. That big fell. He know half of the black people. That’s why.”',
    attribution: 'Benji · Mount Isa',
  },
]

const youthPortraits = [
  {
    name: 'Jackquann Button',
    place: 'Upper Camp, Mparntwe',
    detail: 'Fourteen. Tells what life looks like for young people in Central Australia when the system is already watching.',
    image: '/images/orgs/oonchiumpa/jackquann.jpg',
    imageAlt: 'Jackquann Button portrait',
  },
  {
    name: 'Laquisha',
    place: 'Mparntwe',
    detail: 'Shares her lived experience of court, detention, and the pressure that surrounds young Aboriginal women before they are grown.',
    image: '/images/orgs/oonchiumpa/laquisha.jpg',
    imageAlt: 'Laquisha portrait with community members',
  },
  {
    name: 'Nigel Alice',
    place: 'Mparntwe',
    detail: 'Fourteen. Gap Youth Centre, Roblox, and what it is like to move through a detention centre while still being a kid.',
    image: '/images/orgs/oonchiumpa/nigel.jpg',
    imageAlt: 'Nigel Alice portrait',
  },
]

const journalSystemCards = [
  {
    title: 'Personal journal',
    detail:
      'One young person can hold a physical notebook that records memory, movement, aspiration, and proof over time.',
    image: '/images/proposals/minderoo/generated-books/travel-diary.png',
    imageAlt: 'Generated travel diary journal',
  },
  {
    title: 'Method book',
    detail:
      'What one community learns can become a method volume others can understand without stripping out local authority.',
    image: '/images/proposals/minderoo/generated-books/three-circles-cover.png',
    imageAlt: 'Generated Three Circles method book cover',
  },
  {
    title: 'Shared library',
    detail:
      'The system scales into a shelf of methods and community volumes that can travel into courts, philanthropy, and public life.',
    image: '/images/proposals/minderoo/generated-books/library-shelf.png',
    imageAlt: 'Generated shelf of STAY series books',
  },
]

const australiaSpreadNodes = ['Mparntwe', 'Palm Island', 'Mount Isa', 'Minjerribah', '2–3 co-selected next']

const yearlyAsk = [
  {
    year: 'FY2026',
    amount: '$780K',
    title: 'Build the first held record',
    detail:
      'Four anchors held properly for twelve months. First consented journals, portraits, and evidence captured. Two to three further relationships co-selected.',
    justiceHub:
      'JusticeHub becomes the evidence spine: consented journals, portraits, and community proof are captured once and usable across the cohort instead of disappearing into folders.',
    mechanisms: ['Anchor-community hold', 'Consent + documentation setup', 'Baseline evidence layer'],
  },
  {
    year: 'FY2027',
    amount: '$960K',
    title: 'Connect the cohort and compound the learning',
    detail:
      'Cohort connected across sites. Families and young people accompanied through a full year. Cross-site learning begins to compound.',
    justiceHub:
      'JusticeHub becomes a comparison layer: what one community learns can be seen and adapted by another without flattening local authority.',
    mechanisms: ['Family and cohort accompaniment', 'Cross-site learning rhythm', 'Evidence comparison + retrieval'],
  },
  {
    year: 'FY2028',
    amount: '$1.16M',
    title: 'Carry the proof outward and preserve it',
    detail:
      'Outward-facing artefact published. Field convened. A durable national evidence library locks the learning in past the funding cycle.',
    justiceHub:
      'JusticeHub becomes a durable public evidence library that carries the proof into philanthropy, media, and government after this funding cycle ends.',
    mechanisms: ['Editorial production + publishing', 'Field convening', 'Durable national evidence library'],
  },
]

const budgetLines = [
  {
    label: 'Partner / place-based hold',
    amount: '$1.4M',
    detail: 'Community relationships, local coordination, travel, protocol, and the time required to stay',
    width: '100%',
    why: 'Because a child stays reachable through trusted people, travel, cultural authority, and daily accompaniment, not through a deck or dashboard alone.',
  },
  {
    label: 'Generate evidence',
    amount: '$800K',
    detail: 'JusticeHub, Empathy Ledger, documentation, consent workflow, journals, portraits, and the query layer',
    width: '57%',
    why: 'Because the hidden work only changes systems when it can be held as shared truth: searchable, consented, and tied to what actually changed.',
  },
  {
    label: 'Develop + advocate',
    amount: '$700K',
    detail: 'Editorial production, public narrative, exchanges, and the outward-facing artefact',
    width: '50%',
    why: 'Because proof has to travel outward into rooms with money and power, or the learning remains local and easy to ignore.',
  },
]

const justiceHubUtility = [
  {
    title: 'Year 1: capture',
    detail:
      'Hold the first community records properly so lived knowledge is not lost between conversations, devices, workers, and funder updates.',
  },
  {
    title: 'Year 2: connect',
    detail:
      'Link cases, journals, portraits, service gaps, and cohort learning so each place can see more than its own partial frame.',
  },
  {
    title: 'Year 3: preserve',
    detail:
      'Lock the learning into a durable library and public evidence layer so the proof keeps working after the first funding cycle ends.',
  },
]

const readyNowSignals = [
  'Oonchiumpa is ready now, and the relationships already exist.',
  'JusticeHub, CivicGraph, and Empathy Ledger are already live.',
  'Year 1 buys place-based hold, documentation rhythm, and outward form.',
]

const year1Measurement = [
  {
    label: 'Baseline captured',
    detail: 'Per anchor: cohort size, current diversion and police-contact rates, cultural connection indicators nominated by community, education/employment engagement. Captured before any new activity begins. Owned by each community.',
  },
  {
    label: 'Living evidence, not compliance reporting',
    detail: 'Consented journals, portraits, and Empathy Ledger stories are the primary evidence surface. Not extracts for a funder — artefacts communities own, can withdraw, and can re-use in their own advocacy.',
  },
  {
    label: 'Quarterly sense-making',
    detail: 'Four communities, JusticeHub coordination, and Minderoo meet quarterly on Country or via community-chosen format. Sense-making in context, not KPIs against a spreadsheet.',
  },
  {
    label: 'Year-2 trigger criteria',
    detail: 'Continuation of Y2 $960K is triggered by: four anchors still consenting to the hold, baseline evidence visible across the cohort, at least two community-authored artefacts in public. No compliance gate — a continuation conversation.',
  },
]

const governanceRoles = [
  {
    role: 'Community authority',
    held_by: 'Each anchor organisation, through its own governance (Oonchiumpa leadership, PICC board, BG Fit direction, MMEIC Elders-in-Council)',
    responsibility: 'Decides what is recorded, by whom, and whether it ever leaves the community. Cultural authority precedes every other layer.',
  },
  {
    role: 'Place-based hold lead',
    held_by: 'Kristy Bloomfield + Tanya Turner (Oonchiumpa, lead anchor); Rachel Atkinson (PICC); Brodie Germaine (BG Fit); Minjerribah Moorgumpin Elders-in-Council',
    responsibility: 'Day-to-day hold. Children remain reachable. Relationships travel. Journals, portraits, and stories captured with consent.',
  },
  {
    role: 'Evidence coordination',
    held_by: 'Ben Knight + JusticeHub team',
    responsibility: 'Per-storyteller consent workflow, ALMA database stewardship, technical reliability of Empathy Ledger + JusticeHub + CivicGraph, platform uptime, evidence retrieval.',
  },
  {
    role: 'Minderoo partnership observer',
    held_by: 'Lucy Stronach (or Minderoo-nominated delegate)',
    responsibility: 'Reads the evidence as it is being made, not as a reporting artefact. Attends quarterly sense-making. Endorses external comms where Minderoo is named as evidence partner.',
  },
]

const platformRisk = [
  {
    label: 'Platform SLA',
    detail: 'JusticeHub and /partners/minderoo dashboards run on Vercel + Supabase (tednluwflfhxyucgwigh). Target 99.5% uptime. Monthly status published. Outage longer than 48 hours triggers direct Minderoo briefing.',
  },
  {
    label: 'Data sovereignty',
    detail: 'All Empathy Ledger content held per-storyteller under OCAP principles (Ownership, Control, Access, Possession). Withdrawal at any time, for any reason, honoured within 14 days across every surface.',
  },
  {
    label: 'Technical governance',
    detail: 'Ben Knight holds operational responsibility. A Curious Tractor Pty Ltd (ACN 697 347 676) is the primary trading entity from 1 July 2026. Standard Ledger is the accountant of record. NAB holds the operational account.',
  },
  {
    label: 'Contingency if a platform layer fails',
    detail: 'Empathy Ledger, JusticeHub, and CivicGraph each have full data backups and documented restore procedures. Community work does not stop because a dashboard is down. The hold continues on Country while the engineering recovers.',
  },
]

export default function MinderooPitchPage() {
  return (
    <main className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      {/* SECTION 1 — HERO */}
      <section
        className="overflow-hidden bg-[#4a2560] text-white"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(135deg, #38184d 0%, #5a2d74 100%)',
          backgroundSize: '40px 40px, cover',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e8d7f0]">
            For Lucy Stronach · Minderoo Foundation · Named evidence partner envelope · April 2026
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1
                className="max-w-4xl text-6xl leading-none md:text-7xl"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                The Three Circles
              </h1>
              <p
                className="mt-6 max-w-3xl text-xl leading-relaxed text-[#f2e7f8] md:text-2xl"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
              >
                A three-year place-based partnership that helps Aboriginal community-controlled
                organisations stay with children and families, surface the quiet work already
                holding them, and carry that proof outward.
              </p>
              <div className="mt-8 max-w-3xl text-base leading-7 text-[#e9dff1]">
                Minderoo is not being asked to fund a speculative product. It is being asked to
                become the named evidence partner for a three-year community justice proof
                program — the delivery mechanism that turns The Front Project&rsquo;s CoLI research
                Minderoo has supported into a living practice across four Aboriginal
                community-controlled anchors. The $2.9M is the first tranche of a six-year arc.
              </div>
            </div>
            <div className="rounded-[28px] border border-white/15 bg-white/8 p-4 backdrop-blur">
              <img
                src="/images/orgs/oonchiumpa/boys-drone.jpg"
                alt="Young people with drone gear at Oonchiumpa"
                className="h-[360px] w-full rounded-[20px] object-cover"
                loading="eager"
              />
              <div className="mt-3 rounded-[20px] border border-white/10 bg-black/10 px-5 py-4">
                <p
                  className="text-2xl leading-tight text-white"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 500,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;At six o&rsquo;clock you get locked down. You wait till tomorrow.&rdquo;
                </p>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e7d6ef]">
                  Jackquann, 14 · Oonchiumpa
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {topStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e7d6ef]">
                      {stat.label}
                    </div>
                    <div
                      className="mt-2 text-4xl"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm leading-5 text-[#eadff2]">{stat.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE FOUR COMMUNITIES HOLDING CHILDREN */}
      <section className="bg-[#f3eadb]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The current cohort
            </div>
            <h2
              className="mt-3 text-5xl leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Four confirmed anchors. Two to three more relationships to choose properly.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#584b40]">
              This version names only the relationships that are clearly in scope today. That keeps
              the case factual, board-defensible, and consistent with a place-based funder deciding
              where to partner deeply rather than widely.
            </p>
            <p className="mt-4 max-w-4xl text-base leading-7 text-[#584b40]">
              These are not backdrop service providers. They are the organisations doing the work
              every day, often remotely, often through deep Indigenous knowledge that rarely gets
              treated as the hero of the story even when it is the thing keeping children safe.
            </p>
            <div className="mt-6 max-w-4xl rounded-[20px] border border-[#dbc7a9] bg-white/80 px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                Community approvals
              </div>
              <p className="mt-2 text-sm leading-6 text-[#5e5145]">
                Portraits and quotes on this page sit inside approvals held by Kristy Bloomfield and
                Tanya Turner (Oonchiumpa) and Brodie Germaine (BG Fit). MMEIC and Palm Island
                Community Company are named descriptively; imagery and stories for those anchors
                wait on their own Elders&rsquo; framing.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {communities.map((community) => (
              <article
                key={community.name}
                className="overflow-hidden rounded-[28px] border border-[#e6d7c1] bg-white shadow-[0_16px_45px_rgba(49,31,15,0.07)]"
              >
                {community.image ? (
                  <img
                    src={community.image}
                    alt={community.imageAlt}
                    className="h-60 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-60 flex-col items-center justify-center border-b border-[#e8dcc9] bg-[#fffaf3] px-8 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                      {community.name === 'Co-selected relationships'
                        ? 'To be announced'
                        : 'Imagery pending community framing'}
                    </div>
                    <div
                      className="mt-4 text-3xl text-[#4a2560]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {community.name}
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                    {community.region}
                  </div>
                  <h3
                    className="mt-2 text-3xl"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {community.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5e5145]">{community.detail}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {community.stats.map((stat) => (
                      <span
                        key={stat}
                        className="rounded-full border border-[#eadfce] bg-[#fff8ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE BRAVE ONES: WHAT THE SYSTEM MISSES */}
      <section className="border-y border-[#eadfce] bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                What must be surfaced
              </div>
              <h2
                className="mt-3 text-5xl leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                The stories nobody is looking for are the ones holding the whole room together.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#584b40]">
                Funders and institutions are trained to look for crisis, exception, and outcome.
                They miss the room where the kettle is already on, the community worker who knows a
                child&apos;s rhythm, the Aunties and Elders carrying governance without a formal title,
                and the remote organisations doing the daily work that never makes it into the
                national imagination.
              </p>
              <p className="mt-4 text-base leading-7 text-[#584b40]">
                The Brave Ones has to surface that entire field alongside the hero journey of the
                young people themselves. Otherwise the public sees a transformed young person and
                misses the knowledge, labour, and care that made it possible.
              </p>
              <div className="mt-8 rounded-[24px] border border-[#eadfce] bg-[#fffaf3] p-6 shadow-[0_12px_30px_rgba(49,31,15,0.05)]">
                <div
                  className="text-3xl leading-tight text-[#4a2560]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  From the kettle to the capital.
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {hiddenStoryLayers.map((item, index) => (
                <figure
                  key={item.title}
                  className={`overflow-hidden rounded-[26px] border border-[#eadfce] bg-white shadow-[0_14px_40px_rgba(49,31,15,0.08)] ${
                    index === 0 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className={`w-full object-cover ${
                        index === 0 ? 'h-[300px]' : 'h-[250px]'
                      }`}
                      loading="lazy"
                    />
                    <div className="absolute left-5 top-5 rounded-full border border-white/35 bg-[#1e1525]/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f3e8f8] backdrop-blur">
                      {item.title}
                    </div>
                  </div>
                  <figcaption className="border-t border-[#f0e5d4] bg-white px-6 py-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                      {item.title}
                    </div>
                    <div
                      className="mt-2 text-3xl leading-tight text-[#2b2530]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {item.kicker}
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e5145]">{item.text}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                The human trace layer
              </div>
              <h2
                className="mt-3 text-5xl leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                The Brave Ones uncovers the people already changing the system.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#584b40]">
                The Brave Ones is where a young person&apos;s own voice, the labour of the people holding
                them, and the evidence architecture around both are brought into the same frame. It
                lets the journals, portraits, exchanges, and public artefacts carry the young
                people&apos;s journey without hiding the community knowledge that made that journey
                possible.
              </p>
              <p className="mt-4 text-base leading-7 text-[#584b40]">
                Third Reality in public form: systemic evidence, sovereign story, and community
                authority held in one frame. A file alone will no longer read as the whole truth.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {quotes.slice(1, 5).map((item) => (
                  <blockquote
                    key={item.quote}
                    className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_10px_30px_rgba(49,31,15,0.06)]"
                  >
                    <p
                      className="text-2xl leading-snug text-[#2b2530]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {item.quote}
                    </p>
                    <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6952]">
                      {item.attribution}
                    </footer>
                  </blockquote>
                ))}
              </div>
              <div className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-[0_10px_28px_rgba(49,31,15,0.05)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                  What the evidence layer already holds
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5e5145]">
                  Across the four anchor communities: ninety-plus storytellers already recorded
                  through Empathy Ledger. Every voice held under per-storyteller consent, every
                  story tied to transcript and theme. A sample of what has surfaced:
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    'Connection to Country',
                    'Youth Justice',
                    'Intergenerational Enterprise',
                    'Truth Telling',
                    'Healing on Country',
                    'Cultural Continuity',
                    'Trust Through Sport',
                    'Remote Communities',
                    'Living in Two Worlds',
                  ].map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full border border-[#eadfce] bg-[#fff8ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
                <a
                  href="/judges-on-country/stories"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#4a2560] underline decoration-[#8d6a44] decoration-1 underline-offset-4 hover:text-[#2b2530]"
                >
                  Read twelve stories from the anchor communities &rarr;
                </a>
              </div>
            </div>
            <div className="rounded-[30px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(49,31,15,0.08)]">
              <div className="rounded-[24px] border border-[#eadfce] bg-[#faf5ec] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                  Young people first
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {youthPortraits.map((portrait) => (
                    <figure
                      key={portrait.name}
                      className="overflow-hidden rounded-[22px] border border-[#eadfce] bg-white shadow-[0_10px_28px_rgba(49,31,15,0.06)]"
                    >
                      <img
                        src={portrait.image}
                        alt={portrait.imageAlt}
                        className="h-[220px] w-full object-cover"
                        loading="lazy"
                      />
                      <figcaption className="border-t border-[#f0e5d4] px-4 py-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                          {portrait.place}
                        </div>
                        <div
                          className="mt-2 text-2xl leading-tight text-[#2b2530]"
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                        >
                          {portrait.name}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#5e5145]">{portrait.detail}</p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-[#faf5ec] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                  How the books work
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {journalSystemCards.map((card) => (
                    <figure
                      key={card.title}
                      className="overflow-hidden rounded-[22px] border border-[#eadfce] bg-white shadow-[0_10px_28px_rgba(49,31,15,0.06)]"
                    >
                      <img
                        src={card.image}
                        alt={card.imageAlt}
                        className="h-[210px] w-full object-cover"
                        loading="lazy"
                      />
                      <figcaption className="border-t border-[#f0e5d4] px-4 py-4">
                        <div
                          className="text-2xl leading-tight text-[#2b2530]"
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                        >
                          {card.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#5e5145]">{card.detail}</p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-[#eadfce] bg-[#faf5ec] shadow-[0_10px_28px_rgba(49,31,15,0.06)]">
                <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                  <img
                    src="/images/proposals/minderoo/generated-books/australia-scrapbook-map.png"
                    alt="Australia scrapbook map showing how the model can travel across the country"
                    className="h-full min-h-[320px] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                      Across Australia
                    </div>
                    <div
                      className="mt-3 text-3xl leading-tight text-[#2b2530]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      Start with four. Let the pattern travel without flattening place.
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#5e5145]">
                      The point is not one hero site or one beautiful book. It is a repeatable,
                      locally held pattern: the young person stays visible, the journal holds the
                      story, the method becomes legible, and the learning can move across the country
                      without turning communities into branches of the same program.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {australiaSpreadNodes.map((node) => (
                        <span
                          key={node}
                          className="rounded-full border border-[#eadfce] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]"
                        >
                          {node}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-[24px] border border-[#dbc7a9] bg-[#fff8ef] p-6 shadow-[0_12px_32px_rgba(49,31,15,0.07)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                  This month, on Country
                </div>
                <div
                  className="mt-3 text-3xl leading-tight text-[#4a2560]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  Thirty minutes that change the way fifty-five judges understand what happens after they hand down a decision.
                </div>
                <p className="mt-4 text-sm leading-6 text-[#5e5145]">
                  On 17 April 2026, fifty-five judges and magistrates from across Australia sat
                  on Country at Oonchiumpa in Mparntwe. Kristy Bloomfield and Tanya Turner led
                  the session. The infrastructure this envelope funds was already doing its
                  work, already being read by the institutional audience it serves.
                </p>
                <blockquote className="mt-5 border-l-2 border-[#dbc7a9] pl-4">
                  <p
                    className="text-xl italic leading-snug text-[#2b2530]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    &ldquo;Our young people are just collateral in a bigger issue. The issue
                    doesn&rsquo;t sit with them.&rdquo;
                  </p>
                  <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6952]">
                    Kristy Bloomfield and Tanya Turner &middot; Oonchiumpa
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — FROM COST TO RECOGNITION: THE MINDEROO BRIDGE */}
      <section className="border-b border-[#eadfce] bg-[#fff8ef]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                Policy bridge
              </div>
              <h2
                className="mt-3 text-5xl leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                The Brave Ones — a living response to the cost of late intervention.
              </h2>
              <div
                className="mt-4 text-2xl leading-tight text-[#4a2560]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                From the cost of late intervention to the courage of early recognition.
              </div>
              <p className="mt-5 text-base leading-7 text-[#584b40]">
                Minderoo supported The Front Project&rsquo;s Cost of Late Intervention research —
                first in 2019, again in 2024 — which now names Australia&rsquo;s annual bill at
                $22.3B. The 2024 update shows that in the three categories this pitch touches —
                child protection, youth justice, family violence — real-terms spending has risen
                74%, 81%, and 110% since 2019. The research named the failure. This partnership
                funds the delivery mechanism.
              </p>
              <div className="mt-6 rounded-[26px] border border-[#eadfce] bg-white p-6 shadow-[0_14px_36px_rgba(49,31,15,0.06)]">
                <p
                  className="text-3xl leading-tight text-[#2b2530]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  You have supported the research that named the cost of intervening too late.
                  Will you now become the named evidence partner for the communities already
                  showing what it looks like to intervene with dignity, culture, evidence, and
                  relationship before the system swallows another child?
                </p>
              </div>
              <p className="mt-6 text-base leading-7 text-[#584b40]">
                Early recognition is how this proposal translates Minderoo&apos;s early-intervention
                logic into the lives of young people the system has already started to misread.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {policyBridgeSignals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-full border border-[#dbc7a9] bg-[#f7efe1] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d5f3d]"
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[30px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_44px_rgba(49,31,15,0.08)]">
              <div className="overflow-hidden rounded-[24px]">
                <img
                  src="/images/orgs/oonchiumpa/team/tanya.jpg"
                  alt="Tanya Turner portrait"
                  className="h-56 w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {coliStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[#eadfce] bg-[#fffaf3] p-5"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
                      {item.label}
                    </div>
                    <div
                      className="mt-3 text-5xl text-[#4a2560]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {item.value}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#5e5145]">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[24px] bg-[#4a2560] p-5 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8d7f0]">
                  The bridge
                </div>
                <p
                  className="mt-3 text-2xl leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  The number names the failure. The communities show what acting earlier actually
                  looks like.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4B — THE VICTORIAN BRIDGE + COLI RECOMMENDATIONS → THREE CIRCLES */}
          <div className="mt-16 rounded-[28px] border border-[#dbc7a9] bg-white p-8 shadow-[0_16px_44px_rgba(49,31,15,0.06)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              The bridge, named plainly
            </div>
            <blockquote className="mt-4 border-l-4 border-[#4a2560] pl-6">
              <p
                className="text-3xl leading-tight text-[#2b2530]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                &ldquo;{coliBridgeQuote.text}&rdquo;
              </p>
              <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6952]">
                {coliBridgeQuote.attribution}
              </footer>
            </blockquote>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#584b40]">
              Forty-three percent of the late-intervention bill sits in child protection. Fourteen
              percent sits in youth crime. The Victorian data says what everyone working in this
              field already knows — these are the same children, ten years apart. The Three
              Circles envelope holds them before the second line of the ledger opens.
            </p>
          </div>

          <div className="mt-10 rounded-[30px] border border-[#eadfce] bg-[#fffaf3] p-8 shadow-[0_14px_40px_rgba(49,31,15,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              Theory of change
            </div>
            <h3
              className="mt-3 max-w-4xl text-4xl leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              CoLI 2024 names four government actions. Three Circles is what each one looks like
              implemented at community level.
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#5e5145]">
              The Front Project&rsquo;s CoLI 2024 report (pp. ii, 25) closes with four
              recommendations to reduce the cost of late intervention. Each maps to an existing
              piece of JusticeHub infrastructure and a live community practice. Minderoo&rsquo;s
              partnership turns the recommendations into delivery.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {coliRecommendations.map((item) => (
                <div
                  key={item.recommendation}
                  className="rounded-[22px] border border-[#eadfce] bg-white p-6 shadow-[0_8px_24px_rgba(49,31,15,0.04)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                    {item.label}
                  </div>
                  <div
                    className="mt-2 text-2xl leading-tight text-[#2b2530]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {item.recommendation}
                  </div>
                  <div className="mt-4 rounded-full border border-[#dbc7a9] bg-[#faf5ec] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7d5f3d] inline-block">
                    {item.circle}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#5e5145]">{item.implementation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              Minderoo strategy fit
            </div>
            <h3
              className="mt-3 max-w-3xl text-4xl leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              How the $2.9M uses your four verbs.
            </h3>
            <div className="mt-8 grid gap-6 lg:grid-cols-4">
              {strategyFit.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_40px_rgba(49,31,15,0.06)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                    Minderoo verb
                  </div>
                  <h4
                    className="mt-3 text-3xl"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {item.title}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-[#5e5145]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — THE METHOD AND THE BOOK SYSTEM */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10 max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
            The method
          </div>
          <h2
            className="mt-3 text-5xl leading-none"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            Three Circles, and the book system.
          </h2>
        </div>
        <div className="rounded-[30px] border border-[#eadfce] bg-[#fffaf3] p-5 shadow-[0_16px_50px_rgba(49,31,15,0.08)]">
          <div className="grid gap-4">
            {threeCircleLayers.map((layer, index) => (
              <div
                key={layer.label}
                className={`rounded-[24px] border border-[#eadfce] p-5 shadow-[0_8px_24px_rgba(49,31,15,0.05)] ${layer.tone} ${
                  index === 2 ? 'border-white/10' : ''
                }`}
              >
                <div
                  className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    index === 2 ? 'text-[#ead7f3]' : 'text-[#8d6a44]'
                  }`}
                >
                  {layer.label}
                </div>
                <div
                  className="mt-2 text-3xl leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  {layer.title}
                </div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    index === 2 ? 'text-[#f1e6f7]' : 'text-[#5e5145]'
                  }`}
                >
                  {layer.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {bookSystemFrames.map((frame) => (
              <figure
                key={frame.title}
                className={`overflow-hidden rounded-[24px] border border-[#eadfce] bg-white shadow-[0_10px_28px_rgba(49,31,15,0.06)] ${frame.span}`}
              >
                <img
                  src={frame.image}
                  alt={frame.imageAlt}
                  className={`w-full object-cover ${
                    frame.span ? 'h-[270px]' : 'h-[240px]'
                  }`}
                  loading="lazy"
                />
                <figcaption className="border-t border-[#f0e5d4] px-5 py-4">
                  <div
                    className="text-2xl leading-tight text-[#2b2530]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {frame.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5e5145]">{frame.detail}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-white p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
              The book system
            </div>
            <p
              className="mt-3 text-2xl leading-tight text-[#4a2560]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              One library. Seven methods. Community volumes. Per-young-person journals.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — THE MONEY: $2.9M OVER THREE YEARS */}
      <section className="bg-[#3c1d50] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d7c2e3]">
                The money
              </div>
              <h2
                className="mt-3 text-5xl leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                The money lands cleanly in Minderoo language.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#eadff2]">
                Lead with the full $2.9M three-year hold, then make the mechanics legible. Each
                year should answer three questions clearly: what communities get, what JusticeHub
                is doing underneath it, and why those system costs exist at all.
              </p>
              <div className="mt-8 space-y-4">
                {yearlyAsk.map((item) => (
                  <div
                    key={item.year}
                    className="rounded-[24px] border border-white/12 bg-white/6 p-5 shadow-[0_10px_30px_rgba(10,3,20,0.18)]"
                  >
                    <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c2e3]">
                          {item.year}
                        </div>
                        <div
                          className="mt-2 text-5xl leading-none"
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                        >
                          {item.amount}
                        </div>
                        <div
                          className="mt-3 text-2xl leading-tight text-white"
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                        >
                          {item.title}
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
                        <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7c2e3]">
                            What the year buys
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#eadff2]">{item.detail}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.mechanisms.map((mechanism) => (
                              <span
                                key={mechanism}
                                className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f0e3f6]"
                              >
                                {mechanism}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-[20px] border border-[#d3b583]/35 bg-[#faf5ec] p-4 text-[#2b2530]">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a44]">
                            Why JusticeHub stays useful
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#5e5145]">{item.justiceHub}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[30px] border border-white/12 bg-white/6 p-6">
              <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c2e3]">
                  Why the evidence layer compounds
                </div>
                <div className="mt-4 grid gap-3">
                  {justiceHubUtility.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[18px] border border-white/10 bg-white/7 px-4 py-4"
                    >
                      <div
                        className="text-2xl leading-tight text-white"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                      >
                        {item.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#eadff2]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 space-y-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7c2e3]">
                  What the system costs are actually paying for
                </div>
                {budgetLines.map((line) => (
                  <div
                    key={line.label}
                    className="rounded-[22px] border border-white/10 bg-white/7 p-4"
                  >
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{line.label}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[#d7c2e3]">
                          {line.detail}
                        </div>
                      </div>
                      <div
                        className="text-3xl"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                      >
                        {line.amount}
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#f0c36f] via-[#e98f63] to-[#cfa4ff]"
                        style={{ width: line.width }}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#eadff2]">{line.why}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6B — HOW WE STAY ACCOUNTABLE: M&E · GOVERNANCE · PLATFORM RISK */}
      <section className="bg-[#f3eadb]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              How we stay accountable
            </div>
            <h2
              className="mt-3 text-5xl leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Measurement, governance, and platform risk — named, not assumed.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#584b40]">
              A three-year place-based partnership only works if the measurement frame, the named
              governance, and the platform the evidence sits on are all legible before the
              partnership begins. This section makes them legible.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {/* Column 1: Year-1 M&E */}
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_14px_40px_rgba(49,31,15,0.06)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                Year-1 measurement
              </div>
              <h3
                className="mt-2 text-3xl leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                Evidence as living artefact, not compliance reporting.
              </h3>
              <div className="mt-5 space-y-4">
                {year1Measurement.map((item) => (
                  <div key={item.label} className="border-l-2 border-[#dbc7a9] pl-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d5f3d]">
                      {item.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5e5145]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Named governance */}
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_14px_40px_rgba(49,31,15,0.06)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                Named governance
              </div>
              <h3
                className="mt-2 text-3xl leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                Who holds what. By name. In public.
              </h3>
              <div className="mt-5 space-y-4">
                {governanceRoles.map((role) => (
                  <div key={role.role} className="border-l-2 border-[#dbc7a9] pl-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d5f3d]">
                      {role.role}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#2b2530]">{role.held_by}</div>
                    <p className="mt-2 text-sm leading-6 text-[#5e5145]">{role.responsibility}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Platform risk */}
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_14px_40px_rgba(49,31,15,0.06)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                Platform risk, acknowledged
              </div>
              <h3
                className="mt-2 text-3xl leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
              >
                If a dashboard breaks, the hold on Country does not.
              </h3>
              <div className="mt-5 space-y-4">
                {platformRisk.map((item) => (
                  <div key={item.label} className="border-l-2 border-[#dbc7a9] pl-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d5f3d]">
                      {item.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5e5145]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[24px] border border-[#dbc7a9] bg-[#fffaf3] p-6 text-[#2b2530]">
            <p className="text-base leading-7">
              Cost math by state (CoLI 2024, Fig 18): Victoria $7,775/day &middot; Tasmania $4,489
              &middot; ACT $4,448 &middot; South Australia $4,202 &middot; Northern Territory
              $3,700 &middot; Western Australia $3,022 &middot; New South Wales $2,819
              &middot; Queensland $2,162. An averted detention-year in Victoria saves $2.84M. The
              three-year place-based hold across four anchors costs less than that.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY NOW: ALREADY IN MOTION */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-[30px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_50px_rgba(49,31,15,0.08)]">
            <img
              src="/images/proposals/minderoo/generated-books/library-shelf.png"
              alt="Generated STAY series library shelf"
              className="h-[320px] w-full rounded-[22px] object-cover"
              loading="lazy"
            />
            <div className="mt-5 rounded-[24px] bg-[#4a2560] p-6 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ead7f3]">
                Already in motion
              </div>
              <div className="mt-4 grid gap-3">
                {readyNowSignals.map((signal) => (
                  <div key={signal} className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3 text-sm leading-6 text-[#f1e6f7]">
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              Why now
            </div>
            <h2
              className="mt-3 text-5xl leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              This is an existing proof point, not a blank-page idea.
            </h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-[#584b40]">
              <p>
                Oonchiumpa is ready. The relationships already exist. JusticeHub, CivicGraph, and
                Empathy Ledger are already live. What Minderoo would be funding is the place-based
                hold and the public form that lets those pieces work together under one roof.
              </p>
              <p>
                That makes the page safer to circulate internally, easier to defend at board level,
                and much closer to Minderoo&apos;s actual Communities strategy than a product-first or
                artefact-first ask. The pitch is not asking Minderoo to underwrite a blank page. It
                is asking Minderoo to become the named evidence partner for the delivery mechanism
                that turns CoLI research into living practice.
              </p>
              <p>
                This envelope is the first tranche of a six-year arc. Partnership rather than
                grant. The three-year shape is a door, not a ceiling. Paul Ramsay, Ian Potter, and
                Myer Foundation sit in the next room — and the smoothest path into that room is a
                Minderoo-endorsed engine, not a solo JusticeHub pitch.
              </p>
              <p className="rounded-[22px] border border-[#eadfce] bg-white p-5 text-[#2b2530] shadow-[0_10px_28px_rgba(49,31,15,0.05)]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                  Courtesy note
                </span>
                <span className="mt-2 block text-sm leading-6 text-[#5e5145]">
                  A final copy of this envelope is being shared with Dr M. O&rsquo;Connell and The
                  Front Project leadership. They authored the CoLI research this pitch stands on,
                  and the partnership we are proposing to Minderoo extends the reach of their work
                  into community delivery.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
