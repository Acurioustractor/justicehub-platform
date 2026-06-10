'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Banknote,
  BookOpenCheck,
  Building2,
  Clipboard,
  Compass,
  FileDown,
  Globe2,
  Landmark,
  Loader2,
  LockKeyhole,
  MapPinned,
  Megaphone,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { RecordTrustBadges, type RecordTrustBadge } from '@/components/trust/RecordTrustBadges';
import type {
  CountryReadiness,
  JusticeNetworkKind,
  JusticeNetworkRecord,
  YouthRemandNetworkPayload,
} from '@/lib/justice-network/youth-remand';

const C = {
  border: '#ded8cf',
  ink: '#171717',
  body: '#48413a',
  muted: '#756d63',
  cream: '#f7f1e7',
  white: '#ffffff',
  green: '#285d45',
  teal: '#1f6f78',
  rust: '#a8552c',
  purple: '#4a2560',
  gold: '#c69b52',
};

const kindLabels: Record<JusticeNetworkKind, string> = {
  case: 'Case',
  campaign: 'Campaign',
  evidence: 'Evidence',
  organization: 'Organisation',
  funding: 'Funding',
  detention: 'Detention',
  tour: 'World Tour',
  story: 'Story',
  country: 'Country',
};

const kindColors: Record<JusticeNetworkKind, string> = {
  case: C.purple,
  campaign: C.rust,
  evidence: C.teal,
  organization: C.green,
  funding: '#7c5b17',
  detention: '#9f1239',
  tour: '#315b72',
  story: '#6f4e37',
  country: '#525252',
};

const kindIcons: Record<JusticeNetworkKind, ReactNode> = {
  case: <Landmark className="h-4 w-4" />,
  campaign: <Megaphone className="h-4 w-4" />,
  evidence: <BookOpenCheck className="h-4 w-4" />,
  organization: <Building2 className="h-4 w-4" />,
  funding: <Banknote className="h-4 w-4" />,
  detention: <LockKeyhole className="h-4 w-4" />,
  tour: <Compass className="h-4 w-4" />,
  story: <Users className="h-4 w-4" />,
  country: <Globe2 className="h-4 w-4" />,
};

const queries = [
  'children on remand',
  'bail support alternatives',
  'Get Kids Out of Watch Houses',
  "Poccum's Law bail",
  'Close Don Dale Unit 18',
  'Jailing is Failing remand',
];

function formatMoney(value: number | null) {
  if (!value) return null;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}m`;
  if (value >= 1_000) return `$${Math.round(value / 1_000).toLocaleString()}k`;
  return `$${value.toLocaleString()}`;
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{ borderColor: C.border, background: C.white, color: C.body }}
    >
      {label} <strong style={{ color: C.ink }}>{value.toLocaleString()}</strong>
    </span>
  );
}

function trustLabelToBadge(label: string): RecordTrustBadge {
  if (/human confirmed|verified/i.test(label)) return { label, tone: 'strong' };
  if (/ai extracted|needs/i.test(label)) return { label: label.includes('AI') ? 'Needs review' : label, tone: 'review' };
  if (/consent|community/i.test(label)) return { label, tone: 'community' };
  if (/source|civicgraph|abn|public/i.test(label)) return { label: label.includes('CivicGraph') ? 'Source linked' : label, tone: 'source' };
  if (/partner-gated|gated/i.test(label)) return { label, tone: 'warning' };
  return { label, tone: 'neutral' };
}

function ResultCard({ record }: { record: JusticeNetworkRecord }) {
  const accent = kindColors[record.kind];
  const money = formatMoney(record.amount);

  return (
    <article className="rounded-lg border bg-white p-4 shadow-sm" style={{ borderColor: C.border }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
          style={{ background: accent }}
        >
          {kindIcons[record.kind]}
          {kindLabels[record.kind]}
        </span>
        <span className="text-xs font-semibold" style={{ color: C.muted }}>
          {record.eyebrow}
        </span>
      </div>
      <h3 className="mb-2 text-base font-semibold leading-snug" style={{ color: C.ink }}>
        {record.href ? (
          <Link href={record.href} className="hover:underline">
            {record.title}
          </Link>
        ) : (
          record.title
        )}
      </h3>
      <p className="mb-3 text-sm leading-6" style={{ color: C.body }}>
        {record.summary}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {record.location ? <span className="text-xs font-medium" style={{ color: C.muted }}>{record.location}</span> : null}
        {record.year ? <span className="text-xs font-medium" style={{ color: C.muted }}>{record.year}</span> : null}
        {money ? <span className="text-xs font-semibold" style={{ color: C.green }}>{money}</span> : null}
        {record.sourceUrl ? (
          <a href={record.sourceUrl} className="text-xs font-semibold hover:underline" style={{ color: accent }}>
            {record.sourceLabel ?? 'Source'}
          </a>
        ) : record.sourceLabel ? (
          <span className="text-xs font-medium" style={{ color: C.muted }}>{record.sourceLabel}</span>
        ) : null}
      </div>
      <RecordTrustBadges
        showReview={false}
        hasLocation={Boolean(record.location)}
        locationLabel={record.location}
        hasCostData={money !== null}
        hasSource={Boolean(record.sourceUrl)}
        sourceLabel={record.sourceLabel}
        extraBadges={record.trust.map(trustLabelToBadge)}
        maxBadges={6}
      />
    </article>
  );
}

function ReadinessCard({ country }: { country: CountryReadiness }) {
  const checks = Object.entries(country.checks);
  const done = checks.filter(([, value]) => value).length;
  return (
    <article className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold" style={{ color: C.ink }}>{country.country}</h3>
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: C.muted }}>{country.region}</p>
        </div>
        <span
          className="rounded-full px-2 py-1 text-xs font-semibold"
          style={{ background: country.status === 'anchor' ? '#e4efe8' : '#f0eadf', color: country.status === 'anchor' ? C.green : C.rust }}
        >
          {done}/6
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map(([key, value]) => (
          <span key={key} className="rounded-md px-2 py-1 text-xs" style={{ background: value ? '#edf7f0' : '#f4efe7', color: value ? C.green : C.muted }}>
            {value ? 'Ready' : 'Next'}: {key}
          </span>
        ))}
      </div>
    </article>
  );
}

function buildGeorgeEmail(payload: YouthRemandNetworkPayload) {
  return `Subject: JusticeHub Network demo + Pacific scoping next step

Hey George,

Sending this through today, Thursday 11 June 2026, before our Friday 12 June 2026 conversation.

We have the JusticeHub Network youth remand page working as a live partner demo now. It is not a deck. It connects ${payload.totals.records} records across cases, campaigns, evidence, organisations, funding, detention sites, Empathy Ledger consent-card pathways, and country learning nodes.

The simple wedge is: why are children held on remand before sentence, what does the law and campaign history say, what community alternatives already exist, where does the money currently flow, and what could Australia learn from partners in other places?

What I think we can do together:

- Use the page as a 15-minute walkthrough for the strategic litigation, campaign, and partner-introduction layer.
- Scope a first learning and partner trip, starting with Papua New Guinea if that is the right place, or another Pacific / regional jurisdiction you think has stronger need and relationship readiness.
- Meet local legal, community, youth justice, and civil society partners, then map what can be public, what should stay private, and what needs consent-controlled handling.
- Come back with a short next-step plan: location, people to involve, roles, timeline, budget, and the smallest useful pilot.

The ask for Friday is simple: can we agree the best first jurisdiction, who should be in the room, and whether Justice Network / National Justice Project would be comfortable helping anchor the legal and partner-introduction layer?

Hope to talk tomorrow,
Ben`;
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export default function YouthRemandSearch({ initialPayload }: { initialPayload: YouthRemandNetworkPayload }) {
  const [payload, setPayload] = useState(initialPayload);
  const [query, setQuery] = useState(initialPayload.query);
  const [selectedKind, setSelectedKind] = useState<JusticeNetworkKind | 'all'>('all');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [isPending, startTransition] = useTransition();

  const filteredRecords = useMemo(() => {
    if (selectedKind === 'all') return payload.records;
    return payload.records.filter((record) => record.kind === selectedKind);
  }, [payload.records, selectedKind]);

  function runSearch(nextQuery = query) {
    const safeQuery = nextQuery.trim() || 'children on remand';
    setQuery(safeQuery);
    startTransition(async () => {
      const response = await fetch(`/api/justice-network/search?q=${encodeURIComponent(safeQuery)}`, { cache: 'no-store' });
      if (response.ok) {
        const nextPayload = (await response.json()) as YouthRemandNetworkPayload;
        setPayload(nextPayload);
      }
    });
  }

  async function copyNote() {
    const didCopy = await copyTextToClipboard(buildGeorgeEmail(payload));
    setCopyStatus(didCopy ? 'copied' : 'failed');
    window.setTimeout(() => setCopyStatus('idle'), 1800);
  }

  return (
    <div className="space-y-8">
      <section id="search" className="rounded-lg border bg-white p-4 md:p-5" style={{ borderColor: C.border }}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
              Search everything
            </p>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: C.ink }}>
              One search for law, movement, alternatives, money, and stories.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold"
              style={{ borderColor: C.border, color: C.body }}
            >
              <FileDown className="h-4 w-4" />
              Print brief
            </button>
            <button
              type="button"
              onClick={copyNote}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white"
              style={{ background: C.green }}
            >
              <Clipboard className="h-4 w-4" />
              {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy failed' : 'Copy George email'}
            </button>
          </div>
        </div>

        <form
          className="mb-4 flex flex-col gap-2 md:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
        >
          <label className="sr-only" htmlFor="justice-network-search">
            Search the JusticeHub Network
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: C.muted }} />
            <input
              id="justice-network-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 w-full rounded-md border bg-white pl-10 pr-3 text-sm outline-none focus:ring-2"
              style={{ borderColor: C.border, color: C.ink }}
              placeholder="children on remand, bail support, detention alternatives..."
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white"
            style={{ background: C.purple }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Search
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          {queries.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => runSearch(preset)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: C.border, color: C.body, background: preset === payload.query ? C.cream : C.white }}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedKind('all')}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: selectedKind === 'all' ? C.ink : C.cream, color: selectedKind === 'all' ? C.white : C.body }}
          >
            All {payload.totals.records}
          </button>
          {(Object.keys(kindLabels) as JusticeNetworkKind[]).map((kind) => {
            const count = payload.counts[kind];
            if (!count) return null;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setSelectedKind(kind)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: selectedKind === kind ? kindColors[kind] : C.cream, color: selectedKind === kind ? C.white : C.body }}
              >
                {kindIcons[kind]}
                {kindLabels[kind]} {count}
              </button>
            );
          })}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <CountPill label="Open" value={payload.totals.openRecords} />
          <CountPill label="Partner-gated" value={payload.totals.partnerGatedRecords} />
          <CountPill label="Human confirmed" value={payload.totals.humanConfirmed} />
          <CountPill label="Consent cards" value={payload.totals.consentCards} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredRecords.map((record) => (
            <ResultCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      <section id="map" className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-white p-5" style={{ borderColor: C.border }}>
          <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
            Map presets
          </p>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight" style={{ color: C.ink }}>
            The map becomes the live atlas for the search.
          </h2>
          <p className="mb-4 text-sm leading-6" style={{ color: C.body }}>
            Keep the main Matrix map as the canonical geographic surface, then add saved views for youth remand, detention,
            alternatives, campaigns, and world-tour learning nodes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white" style={{ background: C.teal }} href="/justice-matrix/map?surface=youth">
              <MapPinned className="h-4 w-4" />
              Open youth map
            </Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold" style={{ borderColor: C.border, color: C.body }} href="/justice-matrix/issues/raise-the-age">
              Raise the Age issue
            </Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold" style={{ borderColor: C.border, color: C.body }} href="/justice-matrix/ask">
              Ask the Matrix
            </Link>
          </div>
        </div>
        <aside className="rounded-lg border p-5" style={{ borderColor: C.border, background: C.cream }}>
          <h3 className="mb-3 font-semibold" style={{ color: C.ink }}>Friday flow for George</h3>
          <ol className="space-y-2 text-sm" style={{ color: C.body }}>
            {[
              'Open Youth Remand',
              'Search children on remand',
              'Show cases, campaigns, evidence',
              'Show alternatives and funding',
              'Show consent-card pathway',
              'Scope PNG or best first jurisdiction',
              'Copy George email',
            ].map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: C.purple }}>{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section id="countries">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
              Country readiness
            </p>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: C.ink }}>
              Australia anchors it. Tour countries become learning nodes.
            </h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {payload.readiness.map((country) => (
            <ReadinessCard key={country.country} country={country} />
          ))}
        </div>
      </section>
    </div>
  );
}
