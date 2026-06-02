import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

const all = stories as Story[]

export function generateStaticParams() {
  return all.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const s = all.find((x) => x.slug === slug)
  if (!s) return { title: 'Story not found' }
  return {
    title: `${s.title} · ${s.anchor} · Judges on Country`,
    description: s.summary || `A story from ${s.anchor}, held under per-storyteller consent through Empathy Ledger.`,
    openGraph: {
      title: `${s.title} · ${s.anchor}`,
      description: s.summary,
      images: s.image ? [{ url: s.image, alt: s.title }] : [],
    },
  }
}

function looksLikeHtml(s: string) {
  return /<\/?(p|h[1-6]|em|strong|blockquote|hr|br|ul|ol|li)\b/i.test(s)
}

function renderParagraphs(text: string) {
  // For plain-text content, split on double-newline into paragraphs
  return text
    .split(/\n{2,}/)
    .map((para, i) => (
      <p
        key={i}
        className="mb-5 text-lg leading-8 text-[#2b2530]"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
      >
        {para.trim()}
      </p>
    ))
}

export default async function StoryDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const s = all.find((x) => x.slug === slug)
  if (!s) notFound()

  const relatedInAnchor = all.filter((x) => x.anchorSlug === s.anchorSlug && x.slug !== s.slug).slice(0, 3)

  return (
    <main className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <section className="border-b border-[#eadfce] bg-white">
        <div className="mx-auto max-w-3xl px-6 pt-10 pb-6 md:px-10 md:pt-14">
          <Link
            href="/judges-on-country/stories"
            className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44] hover:text-[#4a2560]"
          >
            &larr; All stories
          </Link>
        </div>
        {s.image && (
          <div className="mx-auto max-w-5xl px-6 md:px-10">
            <img
              src={s.image}
              alt={s.title}
              className="h-[320px] w-full rounded-[28px] object-cover shadow-[0_16px_50px_rgba(49,31,15,0.1)] md:h-[460px]"
            />
          </div>
        )}
        <div className="mx-auto max-w-3xl px-6 pt-10 pb-14 md:px-10 md:pt-14 md:pb-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
            {s.anchor} &middot; {s.region}
          </div>
          <h1
            className="mt-4 text-5xl leading-[1.05] md:text-6xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            {s.title}
          </h1>
          {s.summary && (
            <p
              className="mt-6 text-xl leading-relaxed text-[#584b40] md:text-2xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
            >
              {s.summary}
            </p>
          )}
          {s.themes && s.themes.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {s.themes.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[#eadfce] bg-[#fff8ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e5a42]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        {looksLikeHtml(s.content) ? (
          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#4a2560] prose-p:text-[#2b2530] prose-p:leading-8 prose-blockquote:border-l-[#dbc7a9] prose-blockquote:bg-[#fffaf3] prose-blockquote:py-2 prose-blockquote:not-italic prose-hr:border-[#eadfce] prose-em:text-[#584b40]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            dangerouslySetInnerHTML={{ __html: s.content }}
          />
        ) : (
          <div>{renderParagraphs(s.content)}</div>
        )}
      </article>

      <section className="border-t border-[#eadfce] bg-[#fffaf3]">
        <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            Consent
          </div>
          <p className="mt-3 text-sm leading-6 text-[#5e5145]">
            This story is held under per-storyteller consent in Empathy Ledger. Published here
            for the Judges on Country program with community approval. Consent can be
            withdrawn; if that happens the story is removed from this index.
          </p>
        </div>
      </section>

      {relatedInAnchor.length > 0 && (
        <section className="bg-[#f3eadb]">
          <div className="mx-auto max-w-5xl px-6 py-14 md:px-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8d6a44]">
              More from {s.anchor}
            </div>
            <h2
              className="mt-3 text-3xl leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
            >
              Related stories
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedInAnchor.map((r) => (
                <Link
                  key={r.slug}
                  href={`/judges-on-country/stories/${r.slug}`}
                  className="group overflow-hidden rounded-[22px] border border-[#eadfce] bg-white shadow-[0_10px_28px_rgba(49,31,15,0.06)] transition-transform hover:-translate-y-0.5"
                >
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="h-40 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-40 items-center justify-center border-b border-[#e8dcc9] bg-[#fffaf3] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6a44]">
                      No image yet
                    </div>
                  )}
                  <div className="p-5">
                    <h3
                      className="text-xl leading-tight text-[#2b2530] group-hover:text-[#4a2560]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
                    >
                      {r.title}
                    </h3>
                    {r.summary && (
                      <p className="mt-2 text-xs leading-5 text-[#5e5145] line-clamp-3">{r.summary}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
