'use client';
// political-v2
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ExperiencePackages } from '@/components/contained/ExperiencePackages';
import { OrgDetailPanel } from '@/components/intelligence/OrgDetailPanel';
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Users,
  Building2,
  Scale,
  Landmark,
  Search,
  Mail,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Printer,
  X,
} from 'lucide-react';

// Dynamic import for Leaflet (no SSR)
const IntelMap = dynamic(() => import('./intel-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0d1117] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#DC2626]" />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TourStopIntel {
  id: string;
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  status: 'confirmed' | 'planning' | 'exploring' | 'demand';
  date: string;
  partner: string;
  venue: string;
  cost: string;
  description: string;
  storyArc: string;
  stats: {
    detentionSpend: string;
    communitySpend: string;
    indigenousOverrep: string;
    detentionPopulation: string;
    orgs: number;
    indigenousOrgs: number;
    interventions: number;
    fundingRecords: number;
    acncCharities: number;
    oricCorporations: number;
  };
  demandSignals: Array<{
    name: string;
    score: number;
    org: string;
    role: string;
    quote: string;
    source: 'linkedin' | 'container_request' | 'email' | 'conference' | 'partner' | 'ally';
    action?: string;
  }>;
  keyOrgs: Array<{
    id?: string;
    name: string;
    type: string;
    indigenous: boolean;
    interventions: number;
    website?: string;
    sector?: string;
    servesYouth?: boolean;
    servesIndigenous?: boolean;
    charitySize?: string;
  }>;
  politicians: Array<{
    name: string;
    role: string;
    party: string;
    level: 'state' | 'federal' | 'oversight';
    portfolio?: string;
    relevance: string;
  }>;
  funders: Array<{
    name: string;
    score: number;
    type: string;
  }>;
}

interface IntelData {
  stops: TourStopIntel[];
  summary: {
    tourStops: number;
    programsCatalogued: number;
    strongEvidenceCount: number;
    orgsIndexed: number;
    indigenousLedOrgs: number;
    fundingTrackedBillions: number;
    totalStopCost: string;
    raised: string;
  };
  generatedAt: string;
}

interface ConnectedSearchConnection {
  kind: string;
  label: string;
  value: string;
  note?: string;
}

interface ConnectedSearchEvidence {
  label: string;
  detail: string;
  sourceTable: string;
  sourceUrl?: string | null;
}

interface ConnectedSearchCard {
  id: string;
  type: 'place' | 'organization';
  title: string;
  subtitle: string;
  url?: string;
  summary: string;
  connections: ConnectedSearchConnection[];
  evidence: ConnectedSearchEvidence[];
}

interface ConnectedSearchResponse {
  q: string;
  counts: Record<string, number>;
  answer?: {
    headline: string;
    summary: string;
    cards: ConnectedSearchCard[];
    caveats: string[];
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: '#059669', bg: 'bg-[#059669]/10' },
  planning: { label: 'Planning', color: '#d97706', bg: 'bg-amber-500/10' },
  exploring: { label: 'In Conversation', color: '#3b82f6', bg: 'bg-blue-500/10' },
  demand: { label: 'Community Demand', color: '#DC2626', bg: 'bg-[#DC2626]/10' },
};

const CAMPAIGN_SHARE_URL = 'https://justicehub.com.au/contained/tour/intelligence';
const CAMPAIGN_REGISTER_URL = '/contained/register-interest?source=adelaide_intelligence_takeaway';
const CAMPAIGN_JOIN_URL = '/contained/join?role=supporter&source=adelaide_intelligence_takeaway';
const CAMPAIGN_STORY_URL = '/contained/share?source=adelaide_intelligence_takeaway';
const MONTH_RE = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g;

function dateEndpoint(date: string, edge: 'start' | 'end') {
  const label = date.split('·')[0]?.trim() || date;
  const months = Array.from(label.matchAll(MONTH_RE)).map((m) => m[1]);
  const years = Array.from(label.matchAll(/\b20\d{2}\b/g)).map((m) => m[0]);
  const year = edge === 'end' ? years.at(-1) : years[0];
  const month = edge === 'end' ? months.at(-1) : months[0];
  return month && year ? `${month} ${year}` : label;
}

function tourDateWindow(stops: TourStopIntel[]) {
  if (stops.length === 0) return 'Dates pending';
  const first = dateEndpoint(stops[0].date, 'start');
  const last = dateEndpoint(stops[stops.length - 1].date, 'end');
  return first === last ? first : `${first}-${last}`;
}

function connectionByLabel(card: ConnectedSearchCard | undefined, label: string) {
  return card?.connections.find((connection) => connection.label === label);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Stat Tile
// ---------------------------------------------------------------------------
function StatTile({ label, value, color = '#F5F0E8' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-3">
      <div className="text-2xl font-bold" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[12px] text-[#F5F0E8]/90 uppercase tracking-[0.15em] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </div>
    </div>
  );
}

function ConnectedSearchPanel() {
  const [query, setQuery] = useState('Adelaide');
  const [response, setResponse] = useState<ConnectedSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (nextQuery = query) => {
    const trimmed = nextQuery.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exhibition/search?q=${encodeURIComponent(trimmed)}&limit=8`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search failed');
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch('Adelaide');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = response?.answer?.cards || [];

  return (
    <div className="p-3 space-y-3">
      <div>
        <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Connected Search
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
          className="flex gap-1"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-[#F5F0E8]/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-white/5 border border-white/10 text-[#F5F0E8] pl-7 pr-2 py-2 text-xs outline-none focus:border-[#DC2626]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              placeholder="Search org, place, funder"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-2 border border-white/10 bg-white/5 text-[#F5F0E8]/90 hover:border-[#DC2626] disabled:opacity-50"
            aria-label="Run connected search"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {error && (
        <p className="text-[12px] text-[#DC2626]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {error}
        </p>
      )}

      {loading && !response && (
        <div className="border border-white/10 bg-white/[0.03] p-3 flex items-start gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#DC2626] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#F5F0E8]/70 leading-snug" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Connecting organisations, money, oversight and source records...
          </p>
        </div>
      )}

      {response?.answer && (
        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
          <div className="border-l-2 border-[#DC2626] pl-3">
            <div className="text-sm font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {response.answer.headline}
            </div>
            <p className="text-[12px] text-[#F5F0E8]/80 leading-snug mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {response.answer.summary}
            </p>
          </div>

          {cards.slice(0, 2).map((card) => (
            <div key={card.id} className="border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F5F0E8] leading-snug">{card.title}</div>
                  <div className="text-[11px] text-[#F5F0E8]/60 uppercase tracking-wider mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {card.subtitle}
                  </div>
                </div>
                {card.url && (
                  <Link href={card.url} className="text-[#DC2626] hover:text-[#F5F0E8] flex-shrink-0" aria-label={`Open ${card.title}`}>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <p className="text-[12px] text-[#F5F0E8]/80 leading-snug mt-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {card.summary}
              </p>
              <div className="mt-3 space-y-1.5">
                {card.connections.slice(0, 8).map((connection) => (
                  <div key={`${card.id}:${connection.kind}:${connection.label}`} className="border-l border-white/10 pl-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-[#F5F0E8]/70 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {connection.label}
                      </span>
                      <span className="text-[11px] font-bold text-[#F5F0E8] text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {connection.value}
                      </span>
                    </div>
                    {connection.note && (
                      <div className="text-[11px] text-[#F5F0E8]/60 leading-snug mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {connection.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {card.evidence.length > 0 && (
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-[11px] text-[#DC2626] uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    Evidence ({card.evidence.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {card.evidence.map((item) => (
                      <div key={`${card.id}:${item.label}:${item.sourceTable}`} className="text-[11px] leading-snug text-[#F5F0E8]/70" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        <div className="text-[#F5F0E8]/90">{item.label}</div>
                        <div>{item.detail}</div>
                        <div className="text-[#F5F0E8]/45">{item.sourceTable}</div>
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-[#DC2626] hover:text-[#F5F0E8] break-all">
                            Source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}

          {response.answer.caveats.length > 0 && (
            <div className="border border-amber-500/25 bg-amber-500/10 p-2">
              <div className="text-[11px] text-amber-300 uppercase tracking-[0.15em] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Coverage
              </div>
              <ul className="space-y-1">
                {response.answer.caveats.slice(0, 4).map((caveat) => (
                  <li key={caveat} className="text-[11px] text-amber-100/80 leading-snug" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {caveat}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignTakeawayPanel({ summary }: { summary: IntelData['summary'] }) {
  const [placeCard, setPlaceCard] = useState<ConnectedSearchCard | undefined>();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAdelaideGraph() {
      try {
        const res = await fetch('/api/exhibition/search?q=Adelaide&limit=8', { cache: 'no-store' });
        if (!res.ok) return;
        const data: ConnectedSearchResponse = await res.json();
        if (!active) return;
        setPlaceCard(data.answer?.cards.find((card) => card.type === 'place') || data.answer?.cards[0]);
      } catch {
        if (active) setPlaceCard(undefined);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAdelaideGraph();
    return () => {
      active = false;
    };
  }, []);

  const coreFrontline = connectionByLabel(placeCard, 'Core Tier 1 frontline');
  const evidenceUniverse = connectionByLabel(placeCard, 'Evidence-linked org universe');
  const programs = connectionByLabel(placeCard, 'Program operators');
  const detention = connectionByLabel(placeCard, 'Detention and government side');
  const funding = connectionByLabel(placeCard, 'Known funding rows');
  const oversight = connectionByLabel(placeCard, 'Oversight evidence');

  const facts = [
    {
      label: 'Confirmed frontline',
      value: coreFrontline?.value || '4 orgs',
      note: coreFrontline?.note || 'Confirmed Tier 1 rows for the Adelaide youth justice surface.',
    },
    {
      label: 'Connected network',
      value: evidenceUniverse?.value || `${summary.orgsIndexed.toLocaleString()} indexed orgs`,
      note: evidenceUniverse?.note || 'Broader evidence graph across organisations, money, programs and facilities.',
    },
    {
      label: 'Programs and custody',
      value: [programs?.value, detention?.value].filter(Boolean).join(' + ') || `${summary.programsCatalogued.toLocaleString()} programs`,
      note: detention?.note || programs?.note || 'Program, facility and government-side records are shown as separate evidence layers.',
    },
    {
      label: 'Money and oversight',
      value: funding?.value || `$${summary.fundingTrackedBillions.toFixed(1)}B tracked`,
      note: [funding?.note, oversight?.value].filter(Boolean).join('; ') || `${summary.strongEvidenceCount.toLocaleString()} strong evidence records indexed.`,
    },
  ];

  const cardText = [
    'CONTAINED Adelaide civic intelligence',
    '',
    ...facts.map((fact) => `${fact.label}: ${fact.value} - ${fact.note}`),
    '',
    'Stay connected:',
    CAMPAIGN_SHARE_URL,
  ].join('\n');

  const messageText = [
    'CONTAINED Adelaide civic intelligence:',
    `${evidenceUniverse?.value || `${summary.orgsIndexed.toLocaleString()} indexed orgs`} connected across youth justice evidence.`,
    `${programs?.value || `${summary.programsCatalogued.toLocaleString()} programs`} and ${funding?.value || `$${summary.fundingTrackedBillions.toFixed(1)}B tracked`} in the data surface.`,
    CAMPAIGN_SHARE_URL,
  ].join('\n');

  const encodedCard = encodeURIComponent(cardText);
  const encodedMessage = encodeURIComponent(messageText);
  const mailtoHref = `mailto:?subject=${encodeURIComponent('CONTAINED Adelaide civic intelligence')}&body=${encodedCard}`;
  const smsHref = `sms:?&body=${encodedMessage}`;

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(cardText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const printCard = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=520,height=720');
    if (!printWindow) return;
    const rows = facts
      .map(
        (fact) => `
          <section>
            <div class="label">${escapeHtml(fact.label)}</div>
            <div class="value">${escapeHtml(fact.value)}</div>
            <p>${escapeHtml(fact.note)}</p>
          </section>
        `
      )
      .join('');

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>CONTAINED Adelaide Takeaway</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #111; background: #f7f2ea; }
            main { max-width: 420px; margin: 0 auto; border: 2px solid #111; padding: 22px; background: #fff; }
            h1 { margin: 0 0 8px; font-size: 24px; line-height: 1; text-transform: uppercase; }
            .kicker, .label, footer { font-family: monospace; text-transform: uppercase; letter-spacing: .12em; }
            .kicker { color: #b91c1c; font-size: 12px; margin-bottom: 18px; }
            section { border-top: 1px solid #ddd; padding: 14px 0; }
            .label { font-size: 10px; color: #555; }
            .value { font-size: 26px; font-weight: 800; margin-top: 2px; }
            p { margin: 6px 0 0; font-size: 12px; line-height: 1.45; color: #333; }
            footer { border-top: 2px solid #111; margin-top: 12px; padding-top: 14px; font-size: 11px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <main>
            <div class="kicker">Youth justice evidence card</div>
            <h1>CONTAINED Adelaide</h1>
            ${rows}
            <footer>${escapeHtml(CAMPAIGN_SHARE_URL)}</footer>
          </main>
          <script>window.print();</script>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Takeaway Card
          </div>
          <p className="text-[12px] text-[#F5F0E8]/70 leading-snug mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Fewer numbers, stronger connections, and a record people can take with them.
          </p>
        </div>
        {loading ? <Loader2 className="w-4 h-4 text-[#DC2626] animate-spin flex-shrink-0 mt-0.5" /> : <Share2 className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />}
      </div>

      <div className="border border-white/10 bg-[#F5F0E8]/[0.04] divide-y divide-white/10">
        {facts.map((fact) => (
          <div key={fact.label} className="p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-[#F5F0E8]/70 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {fact.label}
              </span>
              <span className="text-[12px] font-bold text-[#F5F0E8] text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {fact.value}
              </span>
            </div>
            <p className="text-[11px] text-[#F5F0E8]/60 leading-snug mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {fact.note}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[11px] text-[#F5F0E8]/60 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Stay Engaged
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={CAMPAIGN_REGISTER_URL}
            className="min-h-[42px] border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#F5F0E8] hover:border-[#DC2626] flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />
            Updates
          </Link>
          <Link
            href={CAMPAIGN_JOIN_URL}
            className="min-h-[42px] border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#F5F0E8] hover:border-[#DC2626] flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Users className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />
            Join
          </Link>
          <a
            href={smsHref}
            className="min-h-[42px] border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#F5F0E8] hover:border-[#DC2626] flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />
            Message
          </a>
          <a
            href={mailtoHref}
            className="min-h-[42px] border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#F5F0E8] hover:border-[#DC2626] flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Share2 className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />
            Email
          </a>
          <button
            type="button"
            onClick={copyCard}
            className="min-h-[42px] border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#F5F0E8] hover:border-[#DC2626] flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0 text-[#059669]" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={printCard}
            className="min-h-[42px] border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#F5F0E8] hover:border-[#DC2626] flex items-center gap-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <Printer className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />
            Print
          </button>
        </div>
        <Link
          href={CAMPAIGN_STORY_URL}
          className="mt-2 min-h-[42px] border border-[#DC2626]/40 bg-[#DC2626]/10 px-2 py-2 text-[11px] text-[#F5F0E8] hover:bg-[#DC2626]/20 flex items-center gap-2"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <MessageSquareQuote className="w-3.5 h-3.5 flex-shrink-0 text-[#DC2626]" />
          Share a story or local signal
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stop Detail Panel
// ---------------------------------------------------------------------------
function StopPanel({ stop, onClose }: { stop: TourStopIntel; onClose: () => void }) {
  const status = STATUS_CONFIG[stop.status] || STATUS_CONFIG.demand;
  const [activeTab, setActiveTab] = useState<'overview' | 'demand' | 'orgs' | 'intelligence'>('overview');
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'demand' as const, label: `Demand (${stop.demandSignals.length})` },
    { id: 'orgs' as const, label: `Orgs (${stop.keyOrgs.length})` },
    { id: 'intelligence' as const, label: 'Intelligence' },
  ];

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full md:w-[480px] bg-[#0A0A0A]/95 backdrop-blur-sm border-l border-white/10 z-[500] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: status.color, boxShadow: `0 0 8px ${status.color}60` }}
            />
            <div>
              <h2 className="text-xl font-bold text-[#F5F0E8] uppercase tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stop.city}
              </h2>
              <span className="text-[12px] text-[#F5F0E8]/90 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {stop.state} &middot; {stop.date}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#F5F0E8]/90 hover:text-[#F5F0E8] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className={`mx-5 mb-3 px-3 py-2 ${status.bg} border`} style={{ borderColor: `${status.color}30` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: status.color, fontFamily: "'IBM Plex Mono', monospace" }}>
              {status.label}
            </span>
            <span className="text-xs font-bold text-[#F5F0E8]/90" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {stop.cost}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-[12px] uppercase tracking-[0.12em] font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#DC2626] text-[#F5F0E8]'
                  : 'border-transparent text-[#F5F0E8]/95 hover:text-[#F5F0E8]/90'
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Story arc */}
            <div className="border-l-2 border-[#DC2626] pl-4 py-2">
              <p className="text-base italic text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stop.storyArc}
              </p>
            </div>

            <p className="text-xs text-[#F5F0E8]/80 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {stop.description}
            </p>

            {/* Partner + venue */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#F5F0E8]/95 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.12em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Partner</div>
                  <div className="text-xs text-[#F5F0E8]/90">{stop.partner}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F5F0E8]/95 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.12em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Venue</div>
                  <div className="text-xs text-[#F5F0E8]/90">{stop.venue}</div>
                </div>
              </div>
            </div>

            {/* State detention stats */}
            <div>
              <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {stop.stateCode} Justice System
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatTile label="Detention Spend" value={stop.stats.detentionSpend} color="#DC2626" />
                <StatTile label="Community Spend" value={stop.stats.communitySpend} color="#059669" />
                <StatTile label="Indigenous Overrep" value={stop.stats.indigenousOverrep} color="#DC2626" />
                <StatTile label="Children Detained" value={stop.stats.detentionPopulation} />
              </div>
            </div>

            {/* Data counts */}
            <div>
              <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                JusticeHub Data
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Organizations" value={stop.stats.orgs} />
                <StatTile label="Indigenous Orgs" value={stop.stats.indigenousOrgs} color="#d97706" />
                <StatTile label="Interventions" value={stop.stats.interventions} color="#059669" />
                <StatTile label="Funding Records" value={stop.stats.fundingRecords} />
                <StatTile label="ACNC Charities" value={stop.stats.acncCharities} />
                <StatTile label="ORIC Corps" value={stop.stats.oricCorporations} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'demand' && (
          <>
            {stop.demandSignals.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquareQuote className="w-8 h-8 text-[#F5F0E8]/10 mx-auto mb-3" />
                <p className="text-xs text-[#F5F0E8]/95" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  No demand signals matched for this location yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group: Partners, Conferences, Allies */}
                {(() => {
                  const sourceConfig: Record<string, { label: string; color: string; badge: string }> = {
                    partner: { label: 'Partners', color: '#059669', badge: 'PARTNER' },
                    conference: { label: 'Conferences', color: '#d97706', badge: 'EVENT' },
                    ally: { label: 'Allies & Endorsers', color: '#3b82f6', badge: 'ALLY' },
                    container_request: { label: 'Container Requests', color: '#DC2626', badge: 'REQUEST' },
                    email: { label: 'Email Leads', color: '#8b5cf6', badge: 'EMAIL' },
                    linkedin: { label: 'LinkedIn Engagement', color: '#F5F0E8', badge: 'LI' },
                  };
                  const groups: [string, typeof stop.demandSignals][] = [];
                  for (const src of ['partner', 'conference', 'ally', 'container_request', 'email', 'linkedin']) {
                    const items = stop.demandSignals.filter(s => s.source === src);
                    if (items.length > 0) groups.push([src, items]);
                  }
                  return groups.map(([src, signals]) => {
                    const cfg = sourceConfig[src] || sourceConfig.linkedin;
                    return (
                      <div key={src}>
                        <div
                          className="text-[12px] uppercase tracking-[0.15em] py-1.5 px-2 mb-2 font-bold border-l-2"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: cfg.color,
                            borderColor: cfg.color,
                            backgroundColor: cfg.color + '10',
                          }}
                        >
                          {cfg.label} ({signals.length})
                        </div>
                        <div className="space-y-2">
                          {signals.map((signal, i) => (
                            <div key={i} className="border border-white/10 p-3 hover:border-white/20 transition-colors">
                              <div className="flex items-start justify-between mb-1">
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#F5F0E8]/90">{signal.name}</div>
                                  <div className="text-[12px] text-[#F5F0E8]/90" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    {signal.role}{signal.org ? ` · ${signal.org}` : ''}
                                  </div>
                                </div>
                                <span
                                  className="text-[12px] font-bold px-1.5 py-0.5 flex-shrink-0 ml-2"
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    backgroundColor: cfg.color + '20',
                                    color: cfg.color,
                                  }}
                                >
                                  {cfg.badge} {signal.score}
                                </span>
                              </div>
                              {signal.quote && (
                                <blockquote className="border-l-2 pl-3 mt-2" style={{ borderColor: cfg.color }}>
                                  <p className="text-sm italic leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}>
                                    &ldquo;{signal.quote}&rdquo;
                                  </p>
                                </blockquote>
                              )}
                              {signal.action && (
                                <div
                                  className="mt-2 flex items-start gap-2 px-3 py-2"
                                  style={{ backgroundColor: '#451a03', border: '1px solid #f59e0b' }}
                                >
                                  <span
                                    className="text-[11px] font-bold uppercase tracking-wider flex-shrink-0 mt-px"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fbbf24' }}
                                  >
                                    Action
                                  </span>
                                  <p
                                    className="text-xs leading-relaxed"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fef3c7' }}
                                  >
                                    {signal.action}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}

        {activeTab === 'orgs' && (
          <>
            {stop.keyOrgs.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-[#F5F0E8]/10 mx-auto mb-3" />
                <p className="text-xs text-[#F5F0E8]/95" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  No linked organizations for this state yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <StatTile label="Total Orgs" value={stop.stats.orgs} />
                  <StatTile label="Indigenous" value={stop.stats.indigenousOrgs} color="#d97706" />
                  <StatTile label="With Programs" value={stop.keyOrgs.filter(o => o.interventions > 0).length} color="#059669" />
                </div>

                {/* Orgs running programs */}
                {stop.keyOrgs.filter(o => o.interventions > 0).length > 0 && (
                  <div>
                    <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      Organizations Running Programs
                    </div>
                    {stop.keyOrgs.filter(o => o.interventions > 0).map((org, i) => (
                      <div
                        key={i}
                        onClick={org.id ? () => setActiveOrgId(org.id!) : undefined}
                        className={`border border-white/10 px-3 py-2.5 mb-1.5 transition-colors ${
                          org.id ? 'cursor-pointer hover:border-[#DC2626]' : 'hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {org.indigenous && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Indigenous org" />
                            )}
                            <div className="min-w-0">
                              <span className="text-xs text-[#F5F0E8]/90 truncate block">
                                {org.name}
                              </span>
                              {org.website && (
                                <a
                                  href={org.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-blue-400 hover:text-blue-300 truncate block transition-colors"
                                >
                                  {org.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                              )}
                            </div>
                          </div>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 flex-shrink-0 ml-2"
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              backgroundColor: '#059669' + '20',
                              color: '#059669',
                            }}
                          >
                            {org.interventions} {org.interventions === 1 ? 'program' : 'programs'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-4">
                          {org.sector && (
                            <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {org.sector}
                            </span>
                          )}
                          {org.servesYouth && (
                            <span className="text-[12px] px-1 py-0.5 bg-[#DC2626]/10 text-[#DC2626]/60 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              Youth
                            </span>
                          )}
                          {org.servesIndigenous && (
                            <span className="text-[12px] px-1 py-0.5 bg-amber-500/10 text-amber-500/60 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              First Nations
                            </span>
                          )}
                          {org.charitySize && (
                            <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {org.charitySize}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notable orgs without programs */}
                {stop.keyOrgs.filter(o => o.interventions === 0).length > 0 && (
                  <div>
                    <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      Other Notable Organizations
                    </div>
                    {stop.keyOrgs.filter(o => o.interventions === 0).map((org, i) => (
                      <div key={i} className="flex items-center justify-between border border-white/8 px-3 py-2 mb-1 hover:border-white/15 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          {org.indigenous && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Indigenous org" />
                          )}
                          {org.website ? (
                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#F5F0E8]/80 hover:text-[#F5F0E8]/80 truncate transition-colors">
                              {org.name}
                            </a>
                          ) : (
                            <span className="text-xs text-[#F5F0E8]/80 truncate">{org.name}</span>
                          )}
                        </div>
                        <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-wider flex-shrink-0 ml-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {org.sector || org.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'intelligence' && (
          <>
            {/* Politicians */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-3.5 h-3.5 text-[#F5F0E8]/95" />
                <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Political Landscape
                </span>
              </div>
              {stop.politicians.length === 0 ? (
                <p className="text-sm text-[#F5F0E8] italic" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Political mapping in progress for {stop.stateCode}.
                </p>
              ) : (
                <div className="space-y-4" data-testid="grouped-politicians">
                  {(['state', 'federal', 'oversight'] as const).map(level => {
                    const group = stop.politicians.filter(p => p.level === level);
                    if (group.length === 0) return null;
                    const levelLabels = { state: 'State Government & Opposition', federal: 'Federal', oversight: 'Independent Oversight' };
                    const levelColors = { state: '#d97706', federal: '#3b82f6', oversight: '#059669' };
                    return (
                      <div key={level} className="mb-1">
                        <div
                          className="text-[12px] uppercase tracking-[0.15em] py-1.5 px-2 mb-2 font-bold border-l-2"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: levelColors[level],
                            borderColor: levelColors[level],
                            backgroundColor: levelColors[level] + '10',
                          }}
                        >
                          {levelLabels[level]}
                        </div>
                        <div className="space-y-1.5">
                          {group.map((pol, i) => (
                            <div key={i} className="border border-white/10 px-3 py-2 hover:border-white/20 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-xs text-[#F5F0E8]/80 font-medium block">{pol.name}</span>
                                  <span className="text-[12px] text-[#F5F0E8]/90 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{pol.role}</span>
                                </div>
                                <span
                                  className="text-[12px] px-1.5 py-0.5 flex-shrink-0 mt-0.5"
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    backgroundColor: levelColors[level] + '20',
                                    color: levelColors[level],
                                  }}
                                >
                                  {pol.party}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Funders */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-3.5 h-3.5 text-[#F5F0E8]/95" />
                <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Philanthropic Targets
                </span>
              </div>
              {stop.funders.length === 0 ? (
                <p className="text-sm text-[#F5F0E8] italic" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Funder mapping in progress.
                </p>
              ) : (
                <div className="space-y-2">
                  {stop.funders.map((funder, i) => (
                    <div key={i} className="flex items-center justify-between border border-white/10 px-3 py-2">
                      <span className="text-xs text-[#F5F0E8]/90">{funder.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#F5F0E8]/95" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{funder.type}</span>
                        <span
                          className="text-[12px] font-bold px-1.5 py-0.5"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            backgroundColor: '#059669' + '20',
                            color: '#059669',
                          }}
                        >
                          {funder.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GrantScope link */}
            <div className="border border-white/10 p-4 mt-4">
              <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Deep Intelligence
              </div>
              <p className="text-xs text-[#F5F0E8]/90 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                GrantScope tracks {stop.stats.orgs.toLocaleString()} organizations and {stop.stats.fundingRecords.toLocaleString()} funding records in {stop.stateCode}.
              </p>
              <Link
                href={`/intelligence?state=${stop.stateCode}`}
                className="inline-flex items-center gap-1.5 text-[#DC2626] text-[12px] font-bold uppercase tracking-[0.15em] hover:text-[#F5F0E8] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Explore {stop.stateCode} Intelligence <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 border-t border-white/10 px-5 py-3">
        <Link
          href="/contained/help"
          className="block w-full bg-[#DC2626] text-[#F5F0E8] text-center py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#b91c1c] transition-colors"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Back {stop.city} &middot; $30K-$50K per stop
        </Link>
      </div>

      {/* Slide-in side panel — full ACNC + ABN + financials when an org card is clicked */}
      <OrgDetailPanel orgId={activeOrgId} onClose={() => setActiveOrgId(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Bar
// ---------------------------------------------------------------------------
function SummaryBar({ summary }: { summary: IntelData['summary'] }) {
  // Defensive readers: the API contract has drifted historically (totalOrgs vs
  // orgsIndexed, etc.) and one undefined.toString() takes the whole page down.
  // Coalesce + cast so the UI degrades gracefully when a key is missing or stale.
  const s = (summary || {}) as Record<string, unknown>;
  const num = (key: string, fallback = 0): number => {
    const v = s[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  const fmt = (n: number) => n.toLocaleString();

  const tourStops = num('tourStops', 9);
  const programs = num('programsCatalogued') || num('totalInterventions');
  const strongEvidence = num('strongEvidenceCount') || num('totalEvidence');
  const orgsIndexed = num('orgsIndexed') || num('totalOrgs');
  const indigenousLed = num('indigenousLedOrgs');
  const fundingBillions = num('fundingTrackedBillions');
  const fundingLabel = fundingBillions > 0
    ? (fundingBillions >= 1 ? `$${fundingBillions.toFixed(1)}B` : `$${(fundingBillions * 1000).toFixed(0)}M`)
    : '—';

  const items = [
    {
      value: tourStops.toString(),
      label: 'Tour stops',
      meaning: 'Cities mapped + costed',
      source: 'Contained campaign route configuration',
    },
    {
      value: fmt(programs),
      label: 'Programs catalogued',
      meaning: 'YJ programs indexed from public sources (govt sites, ACNC, AusTender)',
      source: 'alma_interventions where verification_status != ai_generated',
    },
    {
      value: fmt(strongEvidence),
      label: 'Strong evidence',
      meaning: 'Programs with RCT/Effective/Indigenous-led evidence — peer-citable',
      source: "evidence_level IN ('Proven','Effective','Indigenous-led')",
    },
    {
      value: fmt(orgsIndexed),
      label: 'Orgs indexed',
      meaning: 'Organisations with at least one program recorded',
      source: 'distinct operating_organization_id from alma_interventions',
    },
    {
      value: fmt(indigenousLed),
      label: 'Indigenous-led',
      meaning: 'Aboriginal community-controlled orgs delivering YJ programs',
      source: 'organizations.is_indigenous_org = true ∩ delivering interventions',
    },
    {
      value: fundingLabel,
      label: 'YJ funding tracked',
      meaning: 'Funding flows linked to youth-justice programs (multi-year)',
      source: 'sum(amount_dollars) where alma_intervention_id is not null',
    },
  ];

  return (
    <div className="flex items-center gap-6 overflow-visible px-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline gap-2 flex-shrink-0 group relative cursor-help"
        >
          <span className="text-sm font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {item.value}
          </span>
          <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.1em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {item.label}
          </span>
          <span
            className="text-[10px] text-[#F5F0E8]/50 group-hover:text-[#DC2626] select-none"
            aria-hidden="true"
          >
            (?)
          </span>

          {/* Custom hover tooltip — shows instantly, dark editorial style */}
          <div
            className="pointer-events-none absolute top-full left-0 mt-2 w-72 z-[600] opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          >
            <div className="bg-[#0A0A0A] border border-[#DC2626]/60 px-3 py-2 shadow-xl">
              <div className="text-[11px] font-bold text-[#F5F0E8] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {item.label}
              </div>
              <div className="text-[11px] text-[#F5F0E8]/95 leading-snug mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {item.meaning}
              </div>
              <div className="text-[10px] text-[#F5F0E8]/70 leading-snug" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="text-[#DC2626]">SOURCE: </span>{item.source}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stop List (sidebar)
// ---------------------------------------------------------------------------
function StopList({
  stops,
  activeId,
  onSelect,
}: {
  stops: TourStopIntel[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {stops.map((stop) => {
        const status = STATUS_CONFIG[stop.status] || STATUS_CONFIG.demand;
        const isActive = stop.id === activeId;
        return (
          <button
            key={stop.id}
            onClick={() => onSelect(stop.id)}
            className={`w-full text-left px-3 py-2.5 border transition-colors ${
              isActive
                ? 'border-[#DC2626]/40 bg-[#DC2626]/5'
                : 'border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: status.color, boxShadow: isActive ? `0 0 6px ${status.color}` : 'none' }}
              />
              <span className={`text-xs font-bold uppercase tracking-tight ${isActive ? 'text-[#F5F0E8]' : 'text-[#F5F0E8]/90'}`}>
                {stop.city}
              </span>
            </div>
            <div className="mt-1 ml-4">
              <span className="text-[12px] text-[#F5F0E8]/95" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {stop.date}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funding Tracker (sidebar bottom)
// ---------------------------------------------------------------------------
function FundingTracker({ stops }: { stops: TourStopIntel[] }) {
  // Read each stop's cost from the API (e.g. "$130K", "$1.2M") — single source
  // of truth lives in TOUR_STOPS_CONFIG so we don't get drift between the
  // intel sidebar and the per-stop pages.
  const parseCost = (s: string): number => {
    const m = String(s).match(/\$?\s*([\d.]+)\s*([KM])?/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const mult = m[2]?.toUpperCase() === 'M' ? 1_000_000 : m[2]?.toUpperCase() === 'K' ? 1_000 : 1;
    return Math.round(n * mult);
  };
  const stopCosts = stops.map((s) => ({ id: s.id, city: s.city, cost: parseCost(s.cost) }));
  const BACKBONE = 120000; // travelling team + editorial + coordination + bound book + admin
  const tourTotal = stopCosts.reduce((sum, s) => sum + s.cost, 0);
  const grandTotal = tourTotal + BACKBONE;

  // No stops funded yet — confirmed status means event booked, not funded
  const totalSecured = 0;
  const pct = Math.round((totalSecured / grandTotal) * 100);

  return (
    <div className="p-3 space-y-3">
      <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Funding
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ${totalSecured.toLocaleString()}
          </span>
          <span className="text-[12px] text-[#F5F0E8]/95" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            of ${grandTotal.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 w-full">
          <div
            className="h-full bg-[#059669] transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        <div className="text-[12px] text-[#F5F0E8]/95 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {pct}% secured
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5">
        {stopCosts.map((stop) => {
          const secured = false; // No stops funded yet
          return (
            <div key={stop.id} className="flex items-center justify-between">
              <span className={`text-[12px] ${secured ? 'text-[#059669]' : 'text-[#F5F0E8]/95'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {secured ? '✓' : '○'} {stop.city}
              </span>
              <span className={`text-[12px] font-bold ${secured ? 'text-[#059669]' : 'text-[#F5F0E8]/95'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                ${Math.round(stop.cost / 1000)}K
              </span>
            </div>
          );
        })}
        <div className="h-px bg-white/5 my-1" />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#F5F0E8]/90" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Tour-wide backbone (12 mo)
          </span>
          <span className="text-[12px] font-bold text-[#DC2626]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            ${Math.round(BACKBONE / 1000)}K
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function TourIntelligenceContent() {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/contained/tour-intelligence', { cache: 'no-store' })
      .then((res) => res.json())
      .then((d: IntelData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load tour intelligence:', err);
        setLoading(false);
      });
  }, []);

  const handleStopSelect = (id: string) => {
    setActiveStop(id);
    setShowPanel(true);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
  };

  const selectedStop = data?.stops.find((s) => s.id === activeStop) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC2626] mx-auto mb-4" />
          <p className="text-xs text-[#F5F0E8]/95 uppercase tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Loading Intelligence
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-xs text-[#DC2626] uppercase tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Failed to load intelligence data.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Top bar */}
      <div className="flex-shrink-0 h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0A0A0A]/95 backdrop-blur-sm z-[600]">
        <div className="flex items-center gap-4">
          <Link href="/contained" className="flex items-center gap-2 text-[#F5F0E8]/90 hover:text-[#F5F0E8] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.1em] hidden sm:inline" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Contained
            </span>
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <span className="text-[#DC2626] text-xs font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Tour Intelligence
          </span>
        </div>
        <div className="hidden md:block">
          <SummaryBar summary={data.summary} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left sidebar — stop list (hidden on mobile when panel open) */}
        <div className={`w-80 flex-shrink-0 border-r border-white/10 overflow-y-auto bg-[#0A0A0A] ${showPanel ? 'hidden md:block' : ''}`}>
          <div className="border-b border-white/10">
            <ConnectedSearchPanel />
          </div>
          <div className="border-b border-white/10">
            <CampaignTakeawayPanel summary={data.summary} />
          </div>
          <div className="p-3 border-b border-white/10">
            <div className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {data.stops.length} Stops &middot; {tourDateWindow(data.stops)}
            </div>
          </div>
          <StopList stops={data.stops} activeId={activeStop} onSelect={handleStopSelect} />

          {/* Funding tracker */}
          <div className="border-t border-white/10">
            <FundingTracker stops={data.stops} />
          </div>

          {/* Experience packages — buyer ladder + public experiences */}
          <div className="border-t border-white/10">
            <ExperiencePackages mode="compact" />
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="text-[12px] text-[#F5F0E8]/95 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <IntelMap
            stops={data.stops}
            activeId={activeStop}
            onStopClick={handleStopSelect}
          />

          {/* Mobile summary bar */}
          <div className="absolute bottom-0 left-0 right-0 md:hidden bg-[#0A0A0A]/90 backdrop-blur-sm border-t border-white/10 px-3 py-2 overflow-x-auto z-[400]">
            <SummaryBar summary={data.summary} />
          </div>
        </div>

        {/* Detail panel */}
        {showPanel && selectedStop && (
          <StopPanel stop={selectedStop} onClose={handleClosePanel} />
        )}
      </div>
    </div>
  );
}
