import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Globe2, MapPinned, ShieldCheck } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  countryReportRegions,
  countryReports,
  countryStatusLabels,
  type CountryReportStatus,
} from '@/content/justice-network-country-reports';

export const metadata: Metadata = {
  title: 'Country Reports - JusticeHub Network',
  description:
    'Africa and Europe country reports for youth remand, detention alternatives, global models, and JusticeHub world-tour learning.',
};

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#f5f0e8',
  ink: '#171717',
  body: '#514a42',
  muted: '#756d63',
  border: '#ded8cf',
  cream: '#fbfaf7',
  red: '#dc2626',
};

const statusOrder: CountryReportStatus[] = [
  'scoping',
  'legally sourced',
  'model sourced',
  'field visited',
  'story consent ready',
  'partner ready',
];

function StatusPill({ status }: { status: CountryReportStatus }) {
  const meta = countryStatusLabels[status];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: `${meta.tone}18`, color: meta.tone }}
    >
      {meta.label}
    </span>
  );
}

function CountryCard({ report }: { report: (typeof countryReports)[number] }) {
  return (
    <Link
      href={`/justice-network/countries/${report.slug}`}
      className="group rounded-lg border bg-white p-4 transition-colors hover:border-black/35"
      style={{ borderColor: C.border }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.16em' }}>
            {report.region}
          </div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: C.ink }}>{report.country}</h2>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-black" />
      </div>
      <p className="mb-4 text-sm leading-6" style={{ color: C.body }}>{report.headline}</p>
      <div className="flex flex-wrap gap-2">
        {report.status.map((status) => (
          <StatusPill key={status} status={status} />
        ))}
      </div>
    </Link>
  );
}

export default function CountryReportsPage() {
  return (
    <div className="min-h-screen" style={{ background: C.page, color: C.ink }}>
      <Navigation />
      <main className="pt-32">
        <section className="border-b bg-[#171717] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-12">
            <div className="mb-5 inline-flex items-center gap-2 uppercase text-red-300" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em' }}>
              <Globe2 className="h-4 w-4" />
              JusticeHub Network country reports
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
              Compare how countries hold young people before custody becomes the answer.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">
              These reports turn the Africa and Europe route into a public learning frame. Early reports are labelled
              honestly: some are sourced, some are field visited, and some are still scoping.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/adelaide" className="rounded-md bg-white px-4 py-2.5 text-sm font-bold text-[#171717]">
                Adelaide path
              </Link>
              <Link href="/remand" className="rounded-md border border-white/20 px-4 py-2.5 text-sm font-bold text-white">
                Youth remand evidence
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b bg-white" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-6xl px-6 py-6 md:px-12">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: C.ink }}>
              <MapPinned className="h-4 w-4" />
              Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {countryReportRegions.map((region) => (
                <a key={region} href={`#${region.toLowerCase()}`} className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: C.border, color: C.body }}>
                  {region}
                </a>
              ))}
              {statusOrder.map((status) => (
                <a key={status} href={`#${status.replace(/\s+/g, '-')}`} className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: C.border, color: C.body }}>
                  {countryStatusLabels[status].label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-12 px-6 py-12 md:px-12">
          {countryReportRegions.map((region) => {
            const reports = countryReports.filter((report) => report.region === region);
            return (
              <section key={region} id={region.toLowerCase()}>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.18em' }}>
                      Region
                    </div>
                    <h2 className="text-2xl font-black tracking-tight md:text-3xl">{region}</h2>
                  </div>
                  <span className="text-sm font-bold" style={{ color: C.muted }}>{reports.length} report{reports.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {reports.map((report) => (
                    <CountryCard key={report.slug} report={report} />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="rounded-xl border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
            <div className="mb-3 flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" style={{ color: C.red }} />
              Public boundary
            </div>
            <p className="text-sm leading-6" style={{ color: C.body }}>
              Country reports are research scaffolds, not legal advice. Public pages only show sourced model summaries,
              readiness labels, and consent-safe learning. Raw field notes, private media, and identifiable story
              material stay gated until Empathy Ledger consent and partner review are complete.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
