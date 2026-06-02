import type { Metadata } from 'next'
import Link from 'next/link'
import stories from '@/content/judges-stories.json'

type Story = {
  slug: string
  title: string
  summary: string
  content: string
  themes: string[]
  image: string | null
  anchor: string
  anchorSlug: string
  region: string
}

export const metadata: Metadata = {
  title: 'Stories from the communities · Judges on Country',
  description:
    'Community-held stories from Oonchiumpa, BG Fit, and Palm Island Community Company. Published through Empathy Ledger under per-storyteller consent.',
}

const anchors: Array<{ name: string; slug: string; region: string }> = [
  { name: 'Oonchiumpa', slug: 'oonchiumpa', region: 'Mparntwe, NT' },
  { name: 'BG Fit', slug: 'bg-fit', region: 'Mount Isa, QLD' },
  { name: 'Palm Island Community Company', slug: 'palm-island', region: 'Palm Island, QLD' },
]

export default function StoriesIndex() {
  const all = stories as Story[]
  return (
    <main className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <section className="border-b border-[#eadfce] bg-[#4a2560] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e8d7f0]">
            Judges on Country &middot; Stories from the communities
          </div>
          <h1
            className="mt-5 max-w-4xl text-6xl leading-none md:text-7xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            What the cohort has already held.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#eadff2]">
            Community-authored stories from the anchor communities working with JusticeHub.
            Held through Empathy Ledger under per-storyteller consent. Each story is traceable
            to a transcript, tagged by theme, and available to travel into the rooms where
            decisions get made.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {anchors.map((a) => {
              const count = all.filter((s) => s.anchorSlug === a.slug).length
              return (
                <div
                  key={a.slug}
                  className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f0e3f6]"
                >
                  {a.name} &middot; {count} {count === 1 ? 'story' : 'stories'}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {anchors.map((a) => {
        const group = all.filter((s) => s.anchorSlug === a.slug)
        if (group.length === 0) return null
        return (
          <section key={a.slug} className="border-b border-[#eadfce]">
            <div className="mx-auto max-w-6xl px-6 py-14 md:px-10">
              <div className="mb-8 flex items-baseline justify-between gap-6">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
                    {a.region}
                  </div>
                  <h2
                    className="mt-2 text-4xl leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                  >
                    {a.name}
                  </h2>
                </div>
                <div className="text-sm text-[#8d6a44]">
                  {group.length} {group.length === 1 ? 'story' : 'stories'}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {group.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/judges-on-country/stories/${s.slug}`}
                    className="group overflow-hidden rounded-[26px] border border-[#eadfce] bg-white shadow-[0_14px_40px_rgba(49,31,15,0.07)] transition-transform hover:-translate-y-0.5"
                  >
                    {s.image ? (
                      <img
                        src={s.image}
                        alt={s.title}
                        className="h-60 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-60 items-center justify-center border-b border-[#e8dcc9] bg-[#fffaf3] text-[#8d6a44]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em]">
                          Story &middot; no image yet
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3
                        className="text-2xl leading-tight text-[#2b2530] group-hover:text-[#4a2560]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                      >
                        {s.title}
                      </h3>
                      {s.summary && (
                        <p className="mt-3 text-sm leading-6 text-[#5e5145]">{s.summary}</p>
                      )}
                      {s.themes && s.themes.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {s.themes.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[#eadfce] bg-[#fff8ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <section className="bg-[#f3eadb]">
        <div className="mx-auto max-w-4xl px-6 py-14 md:px-10">
          <p className="text-sm leading-6 text-[#5e5145]">
            Every story on this page is held in{' '}
            <a
              href="https://empathyledger.com"
              className="underline decoration-[#8d6a44] decoration-1 underline-offset-4 hover:text-[#4a2560]"
            >
              Empathy Ledger
            </a>{' '}
            under per-storyteller consent. Extracted for the Judges on Country program with
            community approval. Consent can be withdrawn at any time; if that happens, the
            story is removed from this index.
          </p>
        </div>
      </section>
    </main>
  )
}
