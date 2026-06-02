import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  DollarSign,
  ExternalLink,
  FileSearch,
  Landmark,
  Link2,
  MapPin,
  Network,
  Users,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { RecordTrustBadges, type RecordTrustBadge } from '@/components/trust/RecordTrustBadges';
import { getDirectoryOrgDossier } from '@/lib/directory/org-dossier';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

function badgeTone(label: string): RecordTrustBadge['tone'] {
  if (label.includes('Human') || label.includes('Funding') || label.includes('ABN')) return 'strong';
  if (label.includes('CivicGraph') || label.includes('Source')) return 'source';
  if (label.includes('Community') || label.includes('ACCO')) return 'community';
  return 'neutral';
}

function formatDate(value: string | null) {
  if (!value) return 'Date not listed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function compactMoney(value: number | null | undefined) {
  if (!value) return 'Amount not listed';
  return fmt(value);
}

function sourceLink(href: string | null, label = 'Open source') {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:underline">
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dossier = await getDirectoryOrgDossier(id);

  return {
    title: dossier ? `${dossier.name} — JusticeHub Directory` : 'Organisation dossier — JusticeHub Directory',
    description: dossier
      ? `JusticeHub public dossier for ${dossier.name}: ABN, CivicGraph, services, programs, funding, people, civic signals, grants, and review gaps.`
      : 'JusticeHub public organisation dossier.',
  };
}

export default async function DirectoryOrgPage({ params }: PageProps) {
  const { id } = await params;
  const dossier = await getDirectoryOrgDossier(id);
  if (!dossier) notFound();

  const location = [dossier.city, dossier.state, dossier.postcode].filter(Boolean).join(', ') || dossier.location || 'Location not listed';
  const publicPath = `/directory/org/${dossier.slug || dossier.id}`;
  const badges = dossier.badges.map((label) => ({ label, tone: badgeTone(label) }));

  const metricCards = [
    { label: 'Services', value: dossier.counts.services.toLocaleString(), detail: `${dossier.counts.sourceLinkedServices} source-linked`, icon: ClipboardList },
    { label: 'Programs', value: dossier.counts.programs.toLocaleString(), detail: 'ALMA model records', icon: BadgeCheck },
    { label: 'Funding', value: compactMoney(dossier.funding.total), detail: `${dossier.funding.records.toLocaleString()} linked records`, icon: DollarSign },
    { label: 'Civic signals', value: dossier.civicSignals.length.toLocaleString(), detail: 'Public policy mentions', icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:px-12">
            <Link href="/directory" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to directory
            </Link>

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#F97316]">
                  Public organisation dossier
                </p>
                <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight md:text-6xl">
                  {dossier.name}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">
                  {dossier.description || 'This dossier gathers the public records JusticeHub can currently link to this organisation. It is a live source trail, not an endorsement.'}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {location}</span>
                  {dossier.abn ? <span>ABN {dossier.abn}</span> : null}
                  {dossier.website ? sourceLink(dossier.website, 'Website') : null}
                </div>
                <RecordTrustBadges className="mt-6" showReview={false} extraBadges={badges} badgeClassName="bg-white" />
              </div>

              <aside className="rounded-lg border border-white/15 bg-white/8 p-5">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-white/45">Validity frame</p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-bold text-white">Identity key</p>
                    <p className="mt-1 break-all font-mono text-xs leading-5 text-white/60">
                      organisation_id: {dossier.id}
                      <br />
                      ABN: {dossier.abn || 'missing'}
                      <br />
                      gs_entity_id: {dossier.gsEntityId || 'missing'}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-bold text-white">Public boundary</p>
                    <p className="mt-1 text-sm leading-6 text-white/60">
                      Only public records and public profiles appear here. Private notes, unconsented stories, and raw field material stay out of the public directory.
                    </p>
                  </div>
                  <Link href={publicPath} className="inline-flex items-center justify-between rounded-md border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">
                    Share this dossier <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-white">
          <div className="mx-auto grid max-w-7xl gap-px bg-[#0A0A0A] sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white p-6">
                  <Icon className="mb-4 h-5 w-5 text-[#DC2626]" />
                  <p className="text-3xl font-black">{card.value}</p>
                  <p className="mt-2 text-sm font-bold">{card.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#0A0A0A]/55">{card.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
            <div className="rounded-lg border border-[#D8D0C6] bg-white p-5">
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-[#DC2626]" />
                <h2 className="text-xl font-black">CivicGraph identity</h2>
              </div>
              {dossier.grantScopeEntity ? (
                <div className="mt-5 grid gap-3 text-sm">
                  {[
                    ['Matched entity ID', dossier.grantScopeEntity.id],
                    ['Canonical name', dossier.grantScopeEntity.canonicalName],
                    ['Entity ABN', dossier.grantScopeEntity.abn],
                    ['Entity type', dossier.grantScopeEntity.entityType],
                    ['Sector', dossier.grantScopeEntity.sector],
                    ['State', dossier.grantScopeEntity.state],
                    ['Confidence', dossier.grantScopeEntity.confidence],
                    ['Source count', dossier.grantScopeEntity.sourceCount?.toLocaleString() || null],
                    ['SEIFA decile', dossier.grantScopeEntity.seifaDecile?.toString() || null],
                    ['Remoteness', dossier.grantScopeEntity.remoteness],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-4 border-t border-[#0A0A0A]/10 pt-3">
                      <p className="w-36 shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0A0A0A]/45">{label}</p>
                      <p className="min-w-0 break-words font-bold">{value || 'Not linked'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#0A0A0A]/60">
                  No GrantScope/CivicGraph entity is linked yet. This is the first identity gap to resolve.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[#D8D0C6] bg-white p-5">
              <div className="flex items-center gap-3">
                <FileSearch className="h-5 w-5 text-[#DC2626]" />
                <h2 className="text-xl font-black">Review gaps</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#0A0A0A]/60">
                These are the next checks that make the record more reliable. Gaps are useful because they show what not to overclaim.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {dossier.gaps.length > 0 ? dossier.gaps.map((gap) => (
                  <span key={gap} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800">
                    {gap}
                  </span>
                )) : (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-800">
                    No major public gaps detected
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:px-10 lg:grid-cols-2 lg:px-12">
            <RecordList
              title="Services"
              icon={<ClipboardList className="h-5 w-5 text-[#DC2626]" />}
              empty="No service records are linked to this organisation yet."
            >
              {dossier.services.map((service) => (
                <article key={service.id} className="border-t border-[#0A0A0A]/10 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-black">{service.name}</h3>
                    {sourceLink(service.sourceUrl)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#0A0A0A]/60">{service.description || 'Description not listed.'}</p>
                  <p className="mt-2 text-xs font-bold text-[#0A0A0A]/50">
                    {[service.serviceType, service.category, service.state, service.cost].filter(Boolean).join(' · ') || 'Details not listed'}
                  </p>
                </article>
              ))}
            </RecordList>

            <RecordList
              title="Programs and models"
              icon={<BadgeCheck className="h-5 w-5 text-[#DC2626]" />}
              empty="No ALMA program/model records are linked to this organisation yet."
            >
              {dossier.programs.map((program) => (
                <article key={program.id} className="border-t border-[#0A0A0A]/10 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-black">{program.name}</h3>
                    {program.website ? sourceLink(program.website, 'Website') : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#0A0A0A]/60">{program.description || 'Description not listed.'}</p>
                  <div className="mt-3">
                    <RecordTrustBadges
                      compact
                      evidenceLevel={program.evidenceLevel}
                      verificationStatus={program.verificationStatus}
                      hasCostData={Boolean(program.costPerYoungPerson)}
                    />
                  </div>
                </article>
              ))}
            </RecordList>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:px-10 lg:grid-cols-[1fr_0.9fr] lg:px-12">
            <RecordList
              title="Funding history"
              dark
              icon={<DollarSign className="h-5 w-5 text-[#F97316]" />}
              empty="No public funding records are linked to this organisation yet."
            >
              {dossier.funding.recent.map((funding) => (
                <article key={funding.id} className="border-t border-white/10 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-black text-white">{funding.programName || funding.source || 'Funding record'}</h3>
                    <p className="font-mono text-sm font-black text-[#F97316]">{compactMoney(funding.amountDollars)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {[funding.recipientName, funding.state, funding.financialYear || formatDate(funding.announcementDate)].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2">{sourceLink(funding.sourceUrl)}</div>
                </article>
              ))}
            </RecordList>

            <RecordList
              title="Possible grants to check"
              dark
              icon={<Link2 className="h-5 w-5 text-[#F97316]" />}
              empty="No current public grant leads matched this broad youth/community filter."
            >
              {dossier.grantOpportunities.map((grant) => (
                <article key={grant.id} className="border-t border-white/10 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-black text-white">{grant.name}</h3>
                    {sourceLink(grant.url, 'Grant source')}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/60">{grant.description || 'Description not listed.'}</p>
                  <p className="mt-2 text-xs font-bold text-white/45">
                    {[grant.provider, grant.geography, grant.closesAt ? `Closes ${formatDate(grant.closesAt)}` : null].filter(Boolean).join(' · ')}
                  </p>
                </article>
              ))}
            </RecordList>
          </div>
        </section>

        <section className="bg-[#F5F0E8]">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:px-10 lg:grid-cols-2 lg:px-12">
            <RecordList
              title="Public people"
              icon={<Users className="h-5 w-5 text-[#DC2626]" />}
              empty="No public people are linked to this organisation yet."
            >
              {dossier.people.map((person) => (
                <article key={person.id} className="border-t border-[#0A0A0A]/10 py-4">
                  <h3 className="text-lg font-black">{person.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#0A0A0A]/60">{[person.role, person.tagline].filter(Boolean).join(' · ') || 'Public profile linked.'}</p>
                  {person.slug ? (
                    <Link href={`/people/${person.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:underline">
                      Open profile <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </article>
              ))}
            </RecordList>

            <RecordList
              title="CivicScope signals"
              icon={<Landmark className="h-5 w-5 text-[#DC2626]" />}
              empty="No public CivicScope signals are linked or text-matched yet."
            >
              {dossier.civicSignals.map((signal) => (
                <article key={`${signal.type}-${signal.id}`} className="border-t border-[#0A0A0A]/10 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-black">{signal.title}</h3>
                    {sourceLink(signal.sourceUrl)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#0A0A0A]/60">{signal.detail || 'Public signal linked.'}</p>
                  <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A]/45">
                    {[signal.type, signal.jurisdiction, formatDate(signal.date)].filter(Boolean).join(' · ')}
                  </p>
                </article>
              ))}
            </RecordList>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function RecordList({
  title,
  icon,
  empty,
  dark = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className={dark ? 'rounded-lg border border-white/15 bg-white/5 p-5' : 'rounded-lg border border-[#D8D0C6] bg-white p-5'}>
      <div className="flex items-center gap-3">
        {icon}
        <h2 className={dark ? 'text-xl font-black text-white' : 'text-xl font-black'}>{title}</h2>
      </div>
      <div className="mt-3">
        {hasChildren ? children : (
          <p className={dark ? 'border-t border-white/10 py-4 text-sm leading-6 text-white/60' : 'border-t border-[#0A0A0A]/10 py-4 text-sm leading-6 text-[#0A0A0A]/60'}>
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}
