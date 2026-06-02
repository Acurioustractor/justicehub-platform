import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpenCheck, Globe2, LockKeyhole, MapPinned } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  countryReports,
  countryStatusLabels,
  getCountryReport,
  type CountryReportStatus,
} from '@/content/justice-network-country-reports';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fbfaf7',
  ink: '#171717',
  body: '#514a42',
  muted: '#756d63',
  border: '#ded8cf',
  cream: '#f2eadf',
  red: '#dc2626',
  green: '#285d45',
};

export function generateStaticParams() {
  return countryReports.map((report) => ({ countrySlug: report.slug }));
}

export function generateMetadata({ params }: { params: { countrySlug: string } }): Metadata {
  const report = getCountryReport(params.countrySlug);
  if (!report) return { title: 'Country report not found - JusticeHub Network' };
  return {
    title: `${report.country} - JusticeHub Country Report`,
    description: report.headline,
  };
}

function StatusPill({ status }: { status: CountryReportStatus }) {
  const meta = countryStatusLabels[status];
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${meta.tone}18`, color: meta.tone }}>
      {meta.label}
    </span>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
      <h2 className="mb-3 font-black tracking-tight" style={{ color: C.ink }}>{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6" style={{ color: C.body }}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.red }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CountryReportPage({ params }: { params: { countrySlug: string } }) {
  const report = getCountryReport(params.countrySlug);
  if (!report) notFound();

  return (
    <div className="min-h-screen" style={{ background: C.page, color: C.ink }}>
      <Navigation />
      <main className="pt-32">
        <section className="border-b bg-[#171717] text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
            <Link href="/justice-network/countries" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              All country reports
            </Link>
            <div className="mb-5 inline-flex items-center gap-2 uppercase text-red-300" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em' }}>
              <Globe2 className="h-4 w-4" />
              {report.region} country report
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">{report.country}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/72">{report.headline}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {report.status.map((status) => (
                <StatusPill key={status} status={status} />
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 md:px-12">
          <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.18em' }}>
                <BookOpenCheck className="h-4 w-4" />
                Youth remand question
              </div>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">{report.question}</h2>
              <p className="mt-4 text-sm leading-6" style={{ color: C.body }}>{report.appearsDifferent}</p>
            </div>
            <aside className="rounded-lg border p-5" style={{ borderColor: C.border, background: C.cream }}>
              <div className="mb-3 flex items-center gap-2 font-bold">
                <LockKeyhole className="h-4 w-4" style={{ color: C.green }} />
                Story boundary
              </div>
              <p className="text-sm leading-6" style={{ color: C.body }}>{report.publicBoundary}</p>
            </aside>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <ListBlock title="Relevant models to compare" items={report.relevantModels} />
            <ListBlock title="What Australia can learn" items={report.australiaLearning} />
            <ListBlock title="Next field workflow" items={report.nextFieldwork} />
          </div>

          <section className="rounded-xl border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
            <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.18em' }}>
                  <MapPinned className="h-4 w-4" />
                  How this links back to Adelaide
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  Every country report should answer the same public visitor question: what could we do instead?
                </h2>
                <p className="mt-3 text-sm leading-6" style={{ color: C.body }}>
                  The Adelaide experience starts with feeling. The remand vertical shows the Australian evidence. Country
                  reports widen the imagination without exposing private field notes or unsupported claims.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link href="/adelaide" className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-bold text-white" style={{ background: C.red }}>
                  Adelaide path <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/remand" className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-4 text-sm font-bold" style={{ borderColor: C.border, color: C.ink }}>
                  Youth remand <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
