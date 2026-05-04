import Link from 'next/link'

export const metadata = {
  title: 'Background Paper · STAY × Minderoo',
  description:
    'Why A Curious Tractor. A supporting report for Minderoo Foundation, written to sit beside the STAY pitch.',
}

const sections = [
  {
    n: '1',
    kicker: 'The frame',
    title: 'The next dollar is the demonstration, not another report.',
    body: [
      'In 2024 the Front Project, with Dr Mary O’Connell and supported by Minderoo, named the cost of acting too late. Twenty-two billion dollars a year. Most of it sitting in child protection and youth justice. The number now lives in the public record. That is the lever Minderoo has already pulled.',
      'The next lever is the demonstration. Not another report on the cost. The demonstration, in four communities, of what acting earlier looks like when the work is already running, the data layer is already built, and the public vehicle is already on the road.',
      'This is the gap A Curious Tractor sits in.',
    ],
  },
  {
    n: '2',
    kicker: 'Who else has tried this',
    title: 'Three honest comparisons.',
    body: [
      '**Justice Reform Initiative.** JRI has done national what no one else has done. The names of seventy patrons. The submissions into every parliamentary inquiry. The "Jailing is Failing" frame is in the press because JRI put it there. Policy reach into Canberra ACT does not match.',
      'What JRI does not do: hold the relationships at four community-controlled organisations, run the data infrastructure that makes the work indexable, or operate the public-conversation vehicle. JRI is the policy partner. ACT is the demonstration partner. The two are complementary, not competing.',
      '**The research sector.** The Australian Institute of Criminology, university-housed criminology programs, evaluation research firms. These produce peer-reviewed evidence that funders and government cite. That credibility is real. ACT does not claim it.',
      'What the research sector does not do: pay community-controlled organisations forty-eight cents in the first dollar, build sovereignty-aware data infrastructure as architecture rather than a clause in an ethics application, or produce material that travels into chambers and galleries and community halls. Research grants of one million dollars typically yield a report and three articles. ACT’s million dollars yields four communities resourced for a year, the Australian Living Map of Alternatives indexed nationally, fifty-five judges carried, a public artefact, a tour rhythm, and the case studies the researchers can then cite.',
      '**The framework-builders.** Multiple foundations and consultancies have funded "models" for working with First Nations young people. Logic models. Theories of change. Implementation toolkits. Most of these sit in PDF on a foundation website now. Some are in active use. Few have indexed national data behind them. None have the publishing layer that lets the community own the story.',
      'What the framework-builders do not do: start with the community already doing the work and treat the framework as a downstream legibility layer rather than an upstream design layer. ACT’s Australian Living Map of Alternatives is not a framework Minderoo funds ACT to invent. It is the registry of what is already working, on the terms of the people doing it.',
    ],
  },
  {
    n: '3',
    kicker: 'What ACT brings',
    title: 'Six edges the others cannot bring at once.',
    body: [
      '**Already running, not proposing.** On 17 April 2026 fifty-five judges sat on Country at Oonchiumpa. The Contained tour is moving with eighty-six people across fifteen locations. Four anchors are holding children right now. ACT is not asking Minderoo to fund a pilot. ACT is asking Minderoo to back the next twelve months of a thing already breathing. Reversibility is built in. Minderoo can step out at any month-10 review across three years.',
      '**Money lands on community first.** Forty-eight per cent of Year 1 ($530K of $1.1M) goes direct to Oonchiumpa, Palm Island Community Company, BG Fit, and the Minjerribah Moorgumpin Elders-in-Council as untied support. Cultural authority is paid. Aunties and Elders are paid. Compare to a research grant of similar size: 70% in salaries, 20% in reports, 10% reaching community if the design is generous. Minderoo’s Communities pillar names economic dignity as an outcome. ACT’s funding ratio is the operational expression of that pillar.',
      '**The data infrastructure exists, audited and sovereignty-aware.** JusticeHub publishes the case studies. Empathy Ledger holds the consented stories. CivicGraph reads the funding map. The Australian Living Map of Alternatives indexes the community-led models nationally. Per-storyteller consent. Withdrawable. OCAP-aligned. In Year 1 an external technical audit of the consent layer publishes as a partnership artefact in month 10. The architecture is reviewed, named, and made public. Frontier Technology meets Communities pillar in the same line item.',
      '**Frameworks are downstream of practice, not upstream of it.** ACT does not sell Minderoo a framework to develop. ACT sells Minderoo the legibility layer for frameworks that already exist in community practice. Oonchiumpa runs a 95% diversion model in Mparntwe. BG Fit runs an 85% diversion model in Mount Isa across 400+ young people each year. Palm Island Community Company has the Stretch Beds enterprise live in Townsville. MMEIC carries Quandamooka Elder authority. None of them needs Minderoo to fund a consultant to design what the community already does. What they need is the platform that makes the practice indexable, the editorial layer that makes it tellable, and the partner who carries it into the rooms where decisions are made.',
      '**A real public vehicle, not a launch event.** The Contained tour is the carrying mechanism. Perth in July or August. Mt Druitt in spring. Adelaide and Tennant Creek through summer. Brisbane in autumn 2027. STAY images, postcards, and journals travel with it. The first major Carry deliverable lands as the September 2026 postcards send to the fifty-five judges. JRI runs forums. Universities run symposia. ACT runs a tour that arrives in chambers, galleries, churches, and community halls where the conversation is already happening.',
      '**Speed of community, not speed of institution.** Ben Knight and Nicholas Marchesi carry the relationships personally, inside a small Pty structure with a charitable arm. No university IP committee. No grant subcommittee. No press office. Decisions move at the speed Mparntwe or Bwgcolman or Kalkadoon Country move. When the Oonchiumpa team flies east in June 2026 to spend a week at the Harvest in Witta and exchange practice with PICC, BG Fit, and MMEIC, the trip has already happened by the time a research consortium would have finished its ethics application.',
    ],
  },
  {
    n: '4',
    kicker: 'Minderoo lever map',
    title: 'How the partnership feeds each strategic lever.',
    body: [],
    leverMap: true,
  },
  {
    n: '5',
    kicker: 'The numbers, costed and located',
    title: 'Year 1 Standard tier: $1.1M. Six buckets. Six locations. Four anchors. Three rings.',
    body: [],
    costTable: true,
  },
  {
    n: '6',
    kicker: 'What ACT does not claim',
    title: 'The honest line.',
    body: [
      'ACT does not have JRI’s policy reach into Canberra. ACT does not have university-housed peer-reviewed credibility. ACT does not have a fifty-year public record of grant administration.',
      'ACT has the relationships. The infrastructure. The vehicle. The rhythm. And the evidence that, in four communities, the work is already running.',
      'A different way to say it. JRI moves the policy. The researchers move the evidence. The framework-builders move the language. ACT moves the children to school in the morning and the journals to the gallery wall by night, and indexes the whole thing nationally so the next foundation can see what is already working.',
    ],
  },
  {
    n: '7',
    kicker: 'The reframe',
    title: 'The sentence Minderoo can walk in with.',
    body: [
      '*"We have already funded the report on what acting too late costs. The next dollar should not fund another report. It should fund the demonstration of acting earlier, in four communities, with the infrastructure to make it travel. A Curious Tractor is the only group at the table that brings the relationships, the data layer, the public vehicle, and the rhythm at once."*',
      'That is the sentence. Everything else in this paper exists to back it.',
    ],
  },
]

const leverRows = [
  ['Communities pillar / Early Years', 'Four Aboriginal community-controlled organisations resourced to keep holding children. The same families twelve years downstream from the Early Years window.'],
  ['Generation One', '48% direct community spend. Cultural authority paid. Aboriginal community-controlled organisations as the upstream infrastructure that was never funded the first time.'],
  ['Strategic Impact Fund', 'The Australian Living Map of Alternatives as a national reference. CivicGraph as the discovery layer that surfaces the next four anchors on evidence, not proximity.'],
  ['Advocacy', 'September 2026 postcards send to fifty-five judges. STAY artefacts move into chambers, philanthropy, government rooms. The frame shifts from "youth crime" to "where is the adult in the room."'],
  ['Frameworks that travel', 'Three rings, recognisable to a judge, a funder, a young person. Method has a spine. Method has a shelf. The pattern travels without flattening place.'],
  ['International model', 'Lean-in tier funds Africa and Europe learning trip in May to June 2026. The work feeds the platform, not the other way around.'],
  ['Story', 'Per-storyteller consent. Per-young-person journal. Per-community volume. Withdrawable. Owned.'],
  ['Art', 'STAY images, postcards, journals travel as exhibition material through five tour stops in Year 1. Year 3 lands as book, national exhibition, and field convening.'],
  ['Cinema and film', 'Filmmakers paid inside the storytelling trips, not bolted on. Films travel with the Contained tour and into the JusticeHub case-study layer.'],
  ['Science / evidence spine', 'One case study per anchor, per year. Co-authored. Withdrawable. The dataset that succeeds CoLI: not the cost of acting too late, but the evidence of acting well.'],
  ['Frontier Technology', 'Consent UI, OCAP-aligned data layer, external technical audit published as a partnership artefact. Sovereignty as a publishing practice.'],
]

const costRows = [
  ['Holding four anchors well', '$420K', 'Oonchiumpa, PICC, BG Fit, MMEIC'],
  ['Cross-site exchanges', '$110K', 'The Harvest at Witta and across the four anchor sites'],
  ['Story capture and editorial', '$180K', 'All four anchors plus Empathy Ledger editorial residency'],
  ['JusticeHub platform layer', '$160K', 'Living Map, CivicGraph, JusticeHub case studies, audit'],
  ['September postcards plus first artefact', '$140K', 'Fifty-five judges and beyond'],
  ['Contained tour as a vehicle', '$90K', 'Perth, Mt Druitt, Adelaide, Tennant Creek, Brisbane'],
]

function renderInline(text: string) {
  // Renders **bold** and *italic* segments with simple regex parsing, keeps voice rules (no em-dashes).
  const parts: Array<{ type: 'text' | 'bold' | 'italic'; value: string }> = []
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) parts.push({ type: 'bold', value: match[1] })
    else if (match[2] !== undefined) parts.push({ type: 'italic', value: match[2] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) })

  return parts.map((p, i) => {
    if (p.type === 'bold') return <strong key={i} className="font-semibold text-[#2a1f15]">{p.value}</strong>
    if (p.type === 'italic') return <em key={i} className="italic">{p.value}</em>
    return <span key={i}>{p.value}</span>
  })
}

export default function MinderooBackgroundPaperPage() {
  return (
    <main className="min-h-screen bg-[#f5ecd9] text-[#2a1f15]">
      {/* HEADER */}
      <section className="border-b border-[#dec9a9] bg-[#fbf5e9]">
        <div className="mx-auto max-w-4xl px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8d6a44]">
            Background paper · STAY × Minderoo Foundation · May 2026
          </div>
          <h1
            className="mt-5 text-5xl leading-[1.05] md:text-6xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            Why A Curious Tractor. The supporting case for the next dollar.
          </h1>
          <p
            className="mt-6 text-xl leading-relaxed text-[#5a3f2a] md:text-2xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
          >
            A companion to the STAY pitch. The pitch shows what is built. This paper shows why
            the partnership lands here, and not somewhere else that has been tried before.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[#5a3f2a]">
            <Link
              href="/pitch/minderoo"
              className="inline-flex items-center gap-2 rounded-full border border-[#5a3a2a] px-5 py-2.5 font-medium text-[#5a3a2a] transition-colors hover:bg-[#5a3a2a] hover:text-[#fbf5e9]"
            >
              <span aria-hidden>←</span> Back to the pitch
            </Link>
            <span className="text-xs text-[#8d6a44]">
              Reading time 10 to 15 minutes · For internal Minderoo review
            </span>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      {sections.map((s) => (
        <section key={s.n} className="border-b border-[#dec9a9] bg-[#f5ecd9] odd:bg-[#fbf5e9]">
          <div className="mx-auto max-w-4xl px-6 py-14 md:px-10 md:py-20">
            <div className="grid gap-8 md:grid-cols-[80px_1fr]">
              <div>
                <div
                  className="text-5xl text-[#a04a3a]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  {s.n}
                </div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                  {s.kicker}
                </div>
              </div>
              <div>
                <h2
                  className="text-3xl leading-tight text-[#2a1f15] md:text-4xl"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                >
                  {s.title}
                </h2>
                {s.body.length > 0 && (
                  <div className="mt-6 space-y-4 text-base leading-7 text-[#3a2a1c] md:text-[17px] md:leading-8">
                    {s.body.map((p, i) => (
                      <p key={i}>{renderInline(p)}</p>
                    ))}
                  </div>
                )}

                {s.leverMap && (
                  <div className="mt-6 overflow-hidden rounded-[20px] border border-[#dec9a9] bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f4e6c8] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7c5a2a]">
                        <tr>
                          <th className="w-1/3 px-5 py-3">Minderoo lever</th>
                          <th className="px-5 py-3">What ACT puts into it</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leverRows.map(([lever, body]) => (
                          <tr key={lever} className="border-t border-[#f0e1c6] align-top">
                            <td className="px-5 py-4 font-semibold text-[#2a1f15]">{lever}</td>
                            <td className="px-5 py-4 leading-6 text-[#3a2a1c]">{body}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.costTable && (
                  <>
                    <div className="mt-6 overflow-hidden rounded-[20px] border border-[#dec9a9] bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#f4e6c8] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7c5a2a]">
                          <tr>
                            <th className="px-5 py-3">Bucket</th>
                            <th className="px-5 py-3">Y1 cost</th>
                            <th className="px-5 py-3">Lands at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costRows.map(([bucket, cost, where]) => (
                            <tr key={bucket} className="border-t border-[#f0e1c6] align-top">
                              <td className="px-5 py-4 font-semibold text-[#2a1f15]">{bucket}</td>
                              <td className="px-5 py-4 font-mono text-[#a04a3a]">{cost}</td>
                              <td className="px-5 py-4 leading-6 text-[#3a2a1c]">{where}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-[#dec9a9] bg-[#f5ecd9]">
                            <td className="px-5 py-4 font-semibold text-[#2a1f15]">Total Year 1</td>
                            <td className="px-5 py-4 font-mono font-semibold text-[#a04a3a]">$1.1M</td>
                            <td className="px-5 py-4" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-[#5a3f2a]">
                      Three-year envelopes, four reversibility shapes. Lift roughly $3.6M. Steady
                      roughly $3.3M. Taper roughly $2.5M. Conclude after Year 1 at $1.1M with
                      deliverables standing as the partnership outcome.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* FOOTER */}
      <section className="bg-[#5a3a2a] text-[#fbf5e9]">
        <div className="mx-auto max-w-4xl px-6 py-14 md:px-10 md:py-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#d4b07a]">
            Companion documents
          </div>
          <ul className="mt-5 space-y-3 text-base leading-7">
            <li>
              <Link href="/pitch/minderoo" className="underline decoration-[#d4b07a] underline-offset-4 hover:decoration-2">
                Back to the STAY pitch
              </Link>
            </li>
            <li>
              <Link href="/centre-of-excellence" className="underline decoration-[#d4b07a] underline-offset-4 hover:decoration-2">
                Centre of Excellence at Witta
              </Link>
            </li>
            <li>
              <Link href="/centre-of-excellence/system-map" className="underline decoration-[#d4b07a] underline-offset-4 hover:decoration-2">
                The system map: how the stack carries the work
              </Link>
            </li>
          </ul>
          <p className="mt-10 text-sm leading-6 text-[#d4b07a]">
            CoLI 2024 attribution: Front Project, Dr Mary O&apos;Connell, supported by Minderoo
            Foundation. The Australian Living Map of Alternatives is the canonical name. ACT
            refers to A Curious Tractor Pty Ltd, the trading entity from 1 July 2026.
          </p>
        </div>
      </section>
    </main>
  )
}
