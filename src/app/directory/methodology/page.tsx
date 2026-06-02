import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export const metadata: Metadata = {
  title: 'Directory methodology — JusticeHub',
  description:
    'How JusticeHub builds its Australian justice and community directory, including source coverage, trust labels, review status, and GrantScope/CivicGraph boundaries.',
};

const sections = [
  {
    title: 'What the directory is',
    body: 'A national catalogue of Australian justice and community organisations, services, programs, funding records, grants, and source links. It is built to help people find the work and check where claims came from.',
  },
  {
    title: 'What it is not',
    body: 'It is not a legal referral service, not a complete endorsement list, and not proof that every listed service is currently available. Records need badges, source links, and review status before anyone relies on them.',
  },
  {
    title: 'How records enter',
    body: 'Records can come from public datasets, service directories, GrantScope/CivicGraph source plugins, government portals, foundation records, JusticeHub research, partner review, or public submissions.',
  },
  {
    title: 'How trust improves',
    body: 'A record moves from discovery to source-linked, then to human or community checked when a reviewer, organisation, or trusted community partner confirms the relevant details.',
  },
];

const sourceBands = [
  ['High confidence coverage', 'Public grant portals, public funding datasets, government registers, ACNC/ABN-backed entities, and source-linked service pages.'],
  ['Requires active upkeep', 'Council grants, program websites, foundation annual reports, service availability, contact details, and opening/closing dates.'],
  ['Cannot be complete from public data alone', 'Relationship-only grants, unpublished donor decisions, informal community support, and private partner workflows.'],
];

export default function DirectoryMethodologyPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <section className="border-b border-[#0A0A0A] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-14 md:px-10">
            <Link href="/directory" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#DC2626] hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to directory
            </Link>
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.28em] text-[#0A0A0A]/45">
              Methodology
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              How JusticeHub gets closer to one trusted Australian list.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#0A0A0A]/65">
              The standard is not “we scraped a lot of rows.” The standard is visible coverage,
              source trails, review labels, and a path for communities and organisations to correct
              the public record.
            </p>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto grid max-w-5xl gap-4 px-6 py-10 md:grid-cols-2 md:px-10">
            {sections.map((section) => (
              <div key={section.title} className="rounded-lg border border-[#D8D0C6] bg-white p-5">
                <ShieldCheck className="mb-4 h-5 w-5 text-[#059669]" />
                <h2 className="text-xl font-black">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#0A0A0A]/65">{section.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#F97316]">
              Completeness
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight">
              The honest claim is coverage, not perfection.
            </h2>
            <div className="mt-8 grid gap-3">
              {sourceBands.map(([title, body]) => (
                <div key={title} className="rounded-lg border border-white/15 bg-white/8 p-5">
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-[0.8fr_1.2fr] md:px-10">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0A0A0A]/45">
                Review workflow
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                We review by risk, not by pretending every row is equal.
              </h2>
            </div>
            <div className="space-y-4">
              {[
                ['Tier 1', 'Records used in public claims, service referral paths, funder briefs, partner demos, or youth remand material get human review first.'],
                ['Tier 2', 'Source-linked records with ABN, public website, registry, grant source, or clear data provenance can be machine checked and queued.'],
                ['Tier 3', 'Discovery records stay useful, but they remain visibly marked as needing review until stronger evidence arrives.'],
              ].map(([tier, body]) => (
                <div key={tier} className="flex gap-4 rounded-lg border border-[#D8D0C6] bg-[#F5F0E8] p-5">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#059669]" />
                  <div>
                    <p className="font-bold">{tier}</p>
                    <p className="mt-1 text-sm leading-6 text-[#0A0A0A]/65">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <p className="font-bold">See the live coverage layer.</p>
              <p className="text-sm text-[#0A0A0A]/60">Open the directory, then move into services, programs, organisations, grants, and funding.</p>
            </div>
            <Link href="/directory" className="inline-flex w-fit items-center gap-2 rounded-md bg-[#0A0A0A] px-5 py-3 text-sm font-bold text-white">
              Open directory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
