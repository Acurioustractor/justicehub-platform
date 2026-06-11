import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Download, FileText, Globe2, Sheet } from 'lucide-react';
import { MatrixFlowNav } from '../_components/MatrixFlowNav';
import { unPackDownloads, unPackPages } from './_content';

export const metadata: Metadata = {
  title: 'UN / OHCHR Matrix Pack - Justice Matrix',
  description:
    'Public review pack for the NJP / OHCHR Justice Matrix conversation: status brief, UI plan, background paper, and source matrices.',
};

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  teal: '#1f6f78',
  gold: '#d3b583',
  dark: '#1c1420',
};

export default function UnMatrixPackPage() {
  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section className="relative overflow-hidden" style={{ background: 'radial-gradient(circle at 20% 0%, #3a1f4d, #1c1420 70%)' }}>
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 uppercase" style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em' }}>
              <Globe2 className="h-4 w-4" />
              NJP / OHCHR review pack
            </span>
            <span className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(255,255,255,0.22)', color: '#d9cbe3' }}>
              Public route
            </span>
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            The Justice Matrix pack for the UN conversation.
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
            A public route for the background paper, source matrices, and two working briefs that show what the
            NJP / OHCHR proposal asks for, what JusticeHub already runs, and what UI work should come next.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {unPackPages.map((page) => (
              <Link
                key={page.slug}
                href={`/justice-matrix/un/${page.slug}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold"
                style={{ background: C.gold, color: C.dark }}
              >
                {page.slug === 'status-brief' ? 'Read status brief' : 'Read UI plan'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
            <a
              href="/docs/justice-matrix/un/justice-matrix-background-paper.docx"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold text-white"
              style={{ borderColor: 'rgba(255,255,255,0.28)' }}
            >
              <Download className="h-4 w-4" />
              Background paper
            </a>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="un" />

      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted, fontFamily: MONO }}>
              Read online
            </p>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: C.ink }}>
              Sendable pages, not hidden files.
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {unPackPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/justice-matrix/un/${page.slug}`}
                  className="group rounded-lg border bg-white p-5 transition-colors hover:border-zinc-300"
                  style={{ borderColor: C.border }}
                >
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: C.accent }}>
                    <FileText className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold" style={{ color: C.ink }}>
                    {page.title}
                  </h3>
                  <p className="text-sm leading-6" style={{ color: C.body }}>
                    {page.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold group-hover:underline" style={{ color: C.accent }}>
                    Open route <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border bg-white p-5" style={{ borderColor: C.border }}>
            <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted, fontFamily: MONO }}>
              Review sequence
            </p>
            <ol className="space-y-3 text-sm leading-6" style={{ color: C.body }}>
              <li><strong style={{ color: C.ink }}>1.</strong> Open the status brief to show the infrastructure already runs.</li>
              <li><strong style={{ color: C.ink }}>2.</strong> Open the UI plan to show the next build priorities.</li>
              <li><strong style={{ color: C.ink }}>3.</strong> Download the background paper and matrices when George wants source files.</li>
              <li><strong style={{ color: C.ink }}>4.</strong> Jump back into the live Matrix or youth remand scenario.</li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 md:px-8 md:pb-20">
        <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted, fontFamily: MONO }}>
          Download source files
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {unPackDownloads.map((file) => (
            <a
              key={file.href}
              href={file.href}
              className="group rounded-lg border bg-white p-4 transition-colors hover:border-zinc-300"
              style={{ borderColor: C.border }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white" style={{ background: file.format === 'XLSX' ? C.teal : C.accent }}>
                  {file.format === 'XLSX' ? <Sheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>
                <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ background: '#f4f0e9', color: C.body }}>
                  {file.format}
                </span>
              </div>
              <h3 className="mb-1 font-semibold" style={{ color: C.ink }}>{file.label}</h3>
              <p className="text-sm leading-6" style={{ color: C.body }}>{file.description}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold group-hover:underline" style={{ color: C.accent }}>
                Download <Download className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
