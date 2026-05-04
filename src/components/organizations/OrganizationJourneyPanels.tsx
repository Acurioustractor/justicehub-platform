'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Circle,
  CircleAlert,
  FileText,
  Landmark,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

export type DataSourceStatus = 'ready' | 'partial' | 'missing';

export type OrganizationDataSource = {
  key: string;
  label: string;
  status: DataSourceStatus;
  detail: string;
  href?: string;
};

export type PartnerMapItem = {
  label: string;
  detail?: string | null;
  amount?: string | null;
  href?: string | null;
  tone?: 'green' | 'blue' | 'purple' | 'ochre' | 'red' | 'neutral';
};

export type GrantScopePartnerMapData = {
  bestGrants: PartnerMapItem[];
  governmentPathways: PartnerMapItem[];
  foundationFits: PartnerMapItem[];
  likelyPartners: PartnerMapItem[];
  readinessBlockers: string[];
  nextAction?: string | null;
};

function statusConfig(status: DataSourceStatus) {
  if (status === 'ready') {
    return {
      label: 'Ready',
      className: 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800',
      icon: CheckCircle2,
    };
  }
  if (status === 'partial') {
    return {
      label: 'Partial',
      className: 'border-ochre-700 bg-ochre-50 text-ochre-800',
      icon: CircleAlert,
    };
  }
  return {
    label: 'Open',
    className: 'border-earth-300 bg-sand-50 text-earth-600',
    icon: Circle,
  };
}

function toneClass(tone: PartnerMapItem['tone'] = 'neutral') {
  switch (tone) {
    case 'green':
      return 'border-eucalyptus-200 bg-eucalyptus-50';
    case 'blue':
      return 'border-blue-200 bg-blue-50';
    case 'purple':
      return 'border-purple-200 bg-purple-50';
    case 'ochre':
      return 'border-ochre-200 bg-ochre-50';
    case 'red':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-earth-200 bg-white';
  }
}

function PartnerList({ items, empty }: { items: PartnerMapItem[]; empty: string }) {
  if (items.length === 0) {
    return <div className="border border-earth-200 bg-sand-50 p-3 text-sm text-earth-500">{empty}</div>;
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 4).map((item, index) => {
        const content = (
          <div className={`border p-3 ${toneClass(item.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-earth-900">{item.label}</div>
                {item.detail && <div className="mt-1 line-clamp-2 text-xs text-earth-600">{item.detail}</div>}
              </div>
              {item.amount && (
                <div className="shrink-0 text-xs font-black text-eucalyptus-700">{item.amount}</div>
              )}
            </div>
          </div>
        );

        return item.href ? (
          <Link key={`${item.label}-${index}`} href={item.href} className="block hover:opacity-90">
            {content}
          </Link>
        ) : (
          <div key={`${item.label}-${index}`}>{content}</div>
        );
      })}
    </div>
  );
}

export function WhyClaimOrganizationPanel({
  orgName,
  claimHref = '/hub',
  variant = 'directory',
}: {
  orgName?: string;
  claimHref?: string;
  variant?: 'directory' | 'profile' | 'centre';
}) {
  const title =
    variant === 'profile'
      ? `Why ${orgName || 'this organization'} should claim this record`
      : variant === 'centre'
        ? 'Why centre-linked organizations should claim their records'
        : 'Why organizations claim their JusticeHub record';

  const body =
    variant === 'centre'
      ? 'Claiming connects centre partnerships to the organization that can confirm programs, services, funding needs, and public proof.'
      : 'Claiming turns a public data record into an owned workspace for profile control, GrantScope matching, programs, stories, and funder-ready proof.';

  const unlocks = [
    { label: 'Verify identity', icon: ShieldCheck },
    { label: 'Publish programs', icon: Building2 },
    { label: 'Find grants', icon: BriefcaseBusiness },
    { label: 'Build proof', icon: FileText },
  ];

  return (
    <section className="border-b-2 border-black bg-[#f8fafc] py-8">
      <div className="container-justice">
        <div className="grid gap-5 border-2 border-black bg-white p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border border-purple-700 bg-purple-50 px-2 py-1 text-xs font-black uppercase tracking-wide text-purple-800">
              <BadgeCheck className="h-4 w-4" />
              Claim pathway
            </div>
            <h2 className="text-2xl font-black leading-tight text-earth-900">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-earth-600">{body}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {unlocks.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 border border-earth-200 bg-sand-50 p-3 text-sm font-black text-earth-800">
                  <Icon className="h-4 w-4 text-purple-700" />
                  {item.label}
                </div>
              );
            })}
            <Link
              href={claimHref}
              className="flex items-center justify-between gap-2 border-2 border-black bg-black p-3 text-sm font-black text-white sm:col-span-2"
            >
              Start or check a claim
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function OrganizationDataSourcesPanel({
  title = 'Organization data sources',
  subtitle = 'A fast read on what is known, what is claimed, and what still needs confirmation.',
  sources,
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  sources: OrganizationDataSource[];
  compact?: boolean;
}) {
  const readyCount = sources.filter((source) => source.status === 'ready').length;

  const content = (
    <>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-blue-700 bg-blue-50 px-2 py-1 text-xs font-black uppercase tracking-wide text-blue-800">
              <Network className="h-4 w-4" />
              Source map
            </div>
            <h2 className="text-2xl font-black text-earth-900">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-earth-600">{subtitle}</p>
          </div>
          <div className="border-2 border-black bg-sand-50 px-4 py-2 text-sm font-black">
            {readyCount}/{sources.length} ready
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sources.map((source) => {
            const config = statusConfig(source.status);
            const StatusIcon = config.icon;
            const body = (
              <div className="h-full border-2 border-black bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-base font-black leading-tight text-earth-900">{source.label}</h3>
                  <span className={`inline-flex shrink-0 items-center gap-1 border px-2 py-1 text-[10px] font-black uppercase ${config.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-earth-600">{source.detail}</p>
              </div>
            );

            return source.href ? (
              <Link key={source.key} href={source.href} className="block h-full transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {body}
              </Link>
            ) : (
              <div key={source.key}>{body}</div>
            );
          })}
        </div>
    </>
  );

  if (compact) {
    return <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">{content}</div>;
  }

  return (
    <section className="border-b-2 border-black bg-white py-8">
      <div className="container-justice">
        {content}
      </div>
    </section>
  );
}

export function GrantScopePartnerMapPanel({
  orgName,
  data,
  workspaceHref,
  compact = false,
}: {
  orgName?: string;
  data: GrantScopePartnerMapData;
  workspaceHref?: string | null;
  compact?: boolean;
}) {
  const content = (
    <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-eucalyptus-700 bg-eucalyptus-50 px-2 py-1 text-xs font-black uppercase tracking-wide text-eucalyptus-800">
              <Sparkles className="h-4 w-4" />
              GrantScope partner map
            </div>
            <h2 className="text-3xl font-black leading-tight text-earth-900">
              {orgName ? `${orgName}: money, partners, and next moves` : 'Money, partners, and next moves'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-earth-600">
              Funding history, government pathways, foundation fit, centre links, and readiness blockers in one working view.
            </p>
          </div>
          {workspaceHref && (
            <Link
              href={workspaceHref}
              className="inline-flex items-center gap-2 border-2 border-black bg-eucalyptus-700 px-4 py-3 text-sm font-black text-white hover:bg-eucalyptus-800"
            >
              Open funding workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border-2 border-black bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5 text-eucalyptus-700" />
              <h3 className="font-black">Best grants now</h3>
            </div>
            <PartnerList items={data.bestGrants} empty="No current GrantScope matches yet." />
          </div>

          <div className="border-2 border-black bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-blue-700" />
              <h3 className="font-black">Government pathways</h3>
            </div>
            <PartnerList items={data.governmentPathways} empty="No government grants or contracts resolved yet." />
          </div>

          <div className="border-2 border-black bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-700" />
              <h3 className="font-black">Foundation fit</h3>
            </div>
            <PartnerList items={data.foundationFits} empty="No foundation or philanthropy fit recorded yet." />
          </div>

          <div className="border-2 border-black bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-ochre-700" />
              <h3 className="font-black">Likely partners</h3>
            </div>
            <PartnerList items={data.likelyPartners} empty="No centre, peer, or network partners resolved yet." />
          </div>

          <div className="border-2 border-black bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleAlert className="h-5 w-5 text-red-700" />
              <h3 className="font-black">Readiness blockers</h3>
            </div>
            {data.readinessBlockers.length === 0 ? (
              <div className="border border-eucalyptus-200 bg-eucalyptus-50 p-3 text-sm text-eucalyptus-900">
                No major blockers surfaced from current data.
              </div>
            ) : (
              <div className="space-y-2">
                {data.readinessBlockers.slice(0, 4).map((blocker) => (
                  <div key={blocker} className="border border-red-200 bg-red-50 p-3 text-sm text-earth-800">
                    {blocker}
                  </div>
                ))}
              </div>
            )}
            {data.nextAction && (
              <div className="mt-3 border-2 border-black bg-black p-3 text-sm font-black text-white">
                {data.nextAction}
              </div>
            )}
          </div>
        </div>
    </>
  );

  if (compact) {
    return <div className="border-2 border-black bg-gradient-to-br from-blue-50 via-white to-eucalyptus-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">{content}</div>;
  }

  return (
    <section className="border-b-2 border-black bg-gradient-to-br from-blue-50 via-white to-eucalyptus-50 py-10">
      <div className="container-justice">
        {content}
      </div>
    </section>
  );
}
