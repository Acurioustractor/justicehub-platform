import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { MatrixFlowNav } from '../../_components/MatrixFlowNav';
import { getUnPackPage, readUnPackMarkdown, unPackPages, type UnPackPageSlug } from '../_content';

export function generateStaticParams() {
  return unPackPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getUnPackPage(params.slug);
  if (!page) {
    return {
      title: 'UN / OHCHR Matrix Pack - Justice Matrix',
    };
  }

  return {
    title: `${page.title} - Justice Matrix`,
    description: page.description,
  };
}

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
  gold: '#d3b583',
};

export default async function UnMatrixPackDetailPage({ params }: { params: { slug: string } }) {
  const page = getUnPackPage(params.slug);
  if (!page) notFound();

  const markdown = await readUnPackMarkdown(page.slug as UnPackPageSlug);
  if (!markdown) notFound();

  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section className="border-b" style={{ background: C.surface, borderColor: C.border }}>
        <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
          <Link href="/justice-matrix/un" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: C.accent }}>
            <ArrowLeft className="h-4 w-4" />
            UN / OHCHR pack
          </Link>
          <p className="mb-3 uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em' }}>
            Public brief
          </p>
          <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight md:text-5xl" style={{ color: C.ink }}>
            {page.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 md:text-base" style={{ color: C.body }}>
            {page.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={page.downloadHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white"
              style={{ background: C.accent }}
            >
              <Download className="h-4 w-4" />
              Download markdown
            </a>
            <Link
              href="/justice-matrix"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold"
              style={{ borderColor: C.border, color: C.body }}
            >
              <FileText className="h-4 w-4" />
              Open Matrix
            </Link>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="un" />

      <article className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-12">
        <div className="rounded-lg border bg-white p-5 md:p-8" style={{ borderColor: C.border }}>
          <div className="prose prose-zinc max-w-none prose-headings:tracking-tight prose-a:font-semibold prose-a:text-[#4a2560] prose-table:text-sm prose-th:bg-zinc-50">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </div>
      </article>
    </main>
  );
}
