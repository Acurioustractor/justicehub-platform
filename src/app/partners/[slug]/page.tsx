import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Partner = {
  slug: string
  name: string
  status: 'active' | 'proposed' | 'archived'
  tagline: string
  role: string
  engagementPeriod: string
  firstTranche: string
  fullArc: string
  namedContact: string
  evidenceSurfaces: Array<{ label: string; detail: string; path?: string }>
  liveMetrics: Array<{ label: string; detail: string; source: string }>
  cohortUpdates: string
  lastUpdated: string
}

const PARTNERS: Record<string, Partner> = {
  minderoo: {
    slug: 'minderoo',
    name: 'Minderoo Foundation',
    status: 'proposed',
    tagline:
      'Named evidence partner for a three-year community justice proof program. Supported The Front Project’s CoLI research; funding the delivery mechanism.',
    role: 'Evidence partner',
    engagementPeriod: 'FY2026 – FY2028 (first tranche) · Six-year arc proposed',
    firstTranche: '$2.9M over FY2026–FY2028',
    fullArc: '$5.8M+ over six years (indicative; subject to Phase 3 conversion)',
    namedContact: 'Lucy Stronach · Minderoo Foundation',
    evidenceSurfaces: [
      {
        label: 'CoLI 2024 integration',
        detail:
          'Report supported by Minderoo, authored by Dr M. O’Connell for The Front Project. Four recommendations mapped to Three Circles implementation.',
      },
      {
        label: 'Four anchor communities',
        detail:
          'Oonchiumpa (Mparntwe, NT), Palm Island Community Company (QLD), BG Fit (Mount Isa, QLD), Minjerribah Moorgumpin Elders-in-Council (QLD).',
      },
      {
        label: 'Judges on Country',
        detail:
          'Alice Springs 15 September 2026. Co-branded postcards carrying Minderoo evidence-partner mark. Pre/post reflection capture for Phase 3 conversion artefact.',
        path: '/judges-on-country',
      },
      {
        label: 'CONTAINED tour',
        detail:
          'Five-city tour Apr–Jun 2026. Live tracker at /contained/momentum. Nominations, bookings, stakeholder engagement, political attention.',
        path: '/contained/momentum',
      },
    ],
    liveMetrics: [
      {
        label: 'Tour stops complete',
        detail: 'Live count from /contained/momentum',
        source: 'CONTAINED campaign · publicly reported',
      },
      {
        label: 'Empathy Ledger storytellers',
        detail: '90+ across anchor communities; Minderoo Cohort curation pending community consent',
        source: 'Empathy Ledger v2 · per-storyteller consent',
      },
      {
        label: 'Judges engaged',
        detail: 'Target 55 judges on 15 September 2026 in Alice Springs',
        source: 'Judges on Country programme · Oonchiumpa-led',
      },
      {
        label: 'ALMA documented interventions',
        detail: '981 evidence-bearing community-led programmes',
        source: 'JusticeHub ALMA · live database',
      },
    ],
    cohortUpdates:
      'Quarterly sense-making on Country or via community-chosen format. First session scheduled post Alice Springs 2026. Minderoo partnership observer attends as evidence partner, not as reporting recipient.',
    lastUpdated: '2026-04-25',
  },
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const partner = PARTNERS[slug]
  if (!partner) return { title: 'Partner · JusticeHub', robots: { index: false, follow: false } }
  return {
    title: `${partner.name} · Evidence Partnership · JusticeHub`,
    description: partner.tagline,
    robots: { index: false, follow: false },
  }
}

export default async function PartnerDashboardPage({ params }: PageProps) {
  const { slug } = await params
  const partner = PARTNERS[slug]
  if (!partner) notFound()

  return (
    <main className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <section className="bg-[#4a2560] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e8d7f0]">
            Evidence partnership dashboard · {partner.status === 'proposed' ? 'Proposed (pending Phase 3 conversion)' : 'Active'}
          </div>
          <h1
            className="mt-4 max-w-4xl text-5xl leading-tight md:text-6xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            {partner.name}
          </h1>
          <p
            className="mt-5 max-w-3xl text-xl leading-relaxed text-[#f2e7f8]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
          >
            {partner.tagline}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-[20px] border border-white/12 bg-white/6 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e7d6ef]">Role</div>
              <div className="mt-2 text-lg">{partner.role}</div>
            </div>
            <div className="rounded-[20px] border border-white/12 bg-white/6 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e7d6ef]">Engagement</div>
              <div className="mt-2 text-sm leading-5">{partner.engagementPeriod}</div>
            </div>
            <div className="rounded-[20px] border border-white/12 bg-white/6 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e7d6ef]">First tranche</div>
              <div className="mt-2 text-lg">{partner.firstTranche}</div>
            </div>
            <div className="rounded-[20px] border border-white/12 bg-white/6 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e7d6ef]">Full arc (indicative)</div>
              <div className="mt-2 text-sm leading-5">{partner.fullArc}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">Evidence surfaces</div>
            <h2
              className="mt-3 text-4xl leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              What this partnership is already holding.
            </h2>
            <div className="mt-6 space-y-4">
              {partner.evidenceSurfaces.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-[#eadfce] bg-white p-5 shadow-[0_10px_28px_rgba(49,31,15,0.05)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d5f3d]">{item.label}</div>
                  <p className="mt-2 text-sm leading-6 text-[#5e5145]">{item.detail}</p>
                  {item.path && (
                    <a href={item.path} className="mt-3 inline-block text-sm font-semibold text-[#4a2560] underline decoration-[#8d6a44] decoration-1 underline-offset-4">
                      View live surface &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">Live metrics</div>
            <h2
              className="mt-3 text-4xl leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Not a PDF. A window into work-in-motion.
            </h2>
            <div className="mt-6 space-y-4">
              {partner.liveMetrics.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-[#eadfce] bg-[#fffaf3] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d5f3d]">{item.label}</div>
                  <p className="mt-2 text-sm leading-6 text-[#5e5145]">{item.detail}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8d6a44]">Source: {item.source}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[22px] border border-[#dbc7a9] bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">Cohort updates</div>
              <p className="mt-3 text-sm leading-6 text-[#5e5145]">{partner.cohortUpdates}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-[24px] border border-[#eadfce] bg-white p-6 text-sm leading-6 text-[#5e5145]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">Named contact</div>
          <p className="mt-2 text-base font-semibold text-[#2b2530]">{partner.namedContact}</p>
          <p className="mt-2">
            Operational responsibility held by Ben Knight (A Curious Tractor Pty Ltd · ACN 697 347 676).
            Last updated {partner.lastUpdated}.
          </p>
        </div>
      </section>
    </main>
  )
}
