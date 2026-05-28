import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Slice {
  // Aggregates per kind
  cases: {
    total: number;
    verified: number;
    with_holding: number;
    with_link: number;
    with_coords: number;
    with_outcome: number;
    by_case_type: Array<{ k: string; n: number }>;
    by_source: Array<{ k: string; n: number; verified: number }>;
  };
  campaigns: {
    total: number;
    verified: number;
    with_link: number;
    with_tactics: number;
    with_outcome_status: number;
    ongoing: number;
    by_source: Array<{ k: string; n: number; verified: number }>;
  };
  sources: {
    total: number;
    active: number;
    never_scanned: number;
    with_errors: number;
    top_producers: Array<{ name: string; total_items_found: number; last_scraped_at: string | null }>;
    never_scanned_list: Array<{ name: string; source_type: string; region: string | null; scrape_priority: number | null }>;
  };
  queue: {
    pending: number;
    approved: number;
    rejected: number;
    oldest_pending_days: number | null;
    pending_by_type: Array<{ k: string; n: number }>;
    flagged_dupes: number;
  };
  flags: {
    placeholder_cases: Array<{ id: string; case_citation: string }>;
    non_court_in_cases: number;
  };
}

async function loadHealth(): Promise<Slice> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // Cases aggregates
  const { data: caseRows } = await supabase
    .from('justice_matrix_cases')
    .select('source,verified,key_holding,authoritative_link,lat,lng,outcome,case_type,case_citation,id');
  const cases = (caseRows ?? []) as Array<{
    source: string | null;
    verified: boolean | null;
    key_holding: string | null;
    authoritative_link: string | null;
    lat: number | null;
    lng: number | null;
    outcome: string | null;
    case_type: string | null;
    case_citation: string;
    id: string;
  }>;

  // Campaigns aggregates
  const { data: campRows } = await supabase
    .from('justice_matrix_campaigns')
    .select('source,verified,campaign_link,notable_tactics,outcome_status,is_ongoing');
  const campaigns = (campRows ?? []) as Array<{
    source: string | null;
    verified: boolean | null;
    campaign_link: string | null;
    notable_tactics: string | null;
    outcome_status: string | null;
    is_ongoing: boolean | null;
  }>;

  // Sources
  const { data: srcRows } = await supabase
    .from('justice_matrix_sources')
    .select('name,source_type,region,scrape_priority,is_active,last_scraped_at,last_error,total_items_found')
    .order('total_items_found', { ascending: false });
  const allSources = (srcRows ?? []) as Array<{
    name: string;
    source_type: string;
    region: string | null;
    scrape_priority: number | null;
    is_active: boolean;
    last_scraped_at: string | null;
    last_error: string | null;
    total_items_found: number | null;
  }>;

  // Queue
  const { data: discRows } = await supabase
    .from('justice_matrix_discovered')
    .select('status,item_type,discovered_at,potential_duplicate_id');
  const queue = (discRows ?? []) as Array<{
    status: string;
    item_type: string;
    discovered_at: string;
    potential_duplicate_id: string | null;
  }>;

  // Helpers
  function topGrouped<T>(items: T[], key: (i: T) => string, verifiedKey: (i: T) => boolean | null, n: number) {
    const m = new Map<string, { n: number; verified: number }>();
    for (const x of items) {
      const k = key(x) ?? '(none)';
      const e = m.get(k) ?? { n: 0, verified: 0 };
      e.n++;
      if (verifiedKey(x) === true) e.verified++;
      m.set(k, e);
    }
    return Array.from(m.entries())
      .map(([k, v]) => ({ k, ...v }))
      .sort((a, b) => b.n - a.n)
      .slice(0, n);
  }

  const caseTypeTopGrouped = (() => {
    const m = new Map<string, number>();
    for (const c of cases) {
      const k = c.case_type ?? '(untyped)';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
  })();

  const pendingByType = (() => {
    const m = new Map<string, number>();
    for (const d of queue.filter((q) => q.status === 'pending')) {
      m.set(d.item_type, (m.get(d.item_type) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([k, n]) => ({ k, n }));
  })();

  const oldestPending = queue
    .filter((q) => q.status === 'pending')
    .reduce<string | null>((min, q) => (!min || q.discovered_at < min ? q.discovered_at : min), null);
  const oldestPendingDays = oldestPending
    ? Math.floor((Date.now() - new Date(oldestPending).getTime()) / 86_400_000)
    : null;

  // Placeholder cases we already downgraded
  const placeholders = cases
    .filter((c) =>
      [
        'ee104bf0-c4cf-4899-8b39-3eed282f667e',
        '9359f4d9-2aac-4316-9f1d-2e63160476ed',
        '9c5cf000-7177-4deb-b522-85f3bcd1e967',
      ].includes(c.id),
    )
    .map((c) => ({ id: c.id, case_citation: c.case_citation }));

  return {
    cases: {
      total: cases.length,
      verified: cases.filter((c) => c.verified === true).length,
      with_holding: cases.filter((c) => (c.key_holding ?? '').trim().length >= 10).length,
      with_link: cases.filter((c) => (c.authoritative_link ?? '').length > 0).length,
      with_coords: cases.filter((c) => c.lat != null && c.lng != null).length,
      with_outcome: cases.filter((c) => c.outcome != null).length,
      by_case_type: caseTypeTopGrouped,
      by_source: topGrouped(cases, (c) => c.source ?? '(none)', (c) => c.verified, 8),
    },
    campaigns: {
      total: campaigns.length,
      verified: campaigns.filter((c) => c.verified === true).length,
      with_link: campaigns.filter((c) => (c.campaign_link ?? '').length > 0).length,
      with_tactics: campaigns.filter((c) => (c.notable_tactics ?? '').trim().length >= 10).length,
      with_outcome_status: campaigns.filter((c) => (c.outcome_status ?? '').trim().length >= 5).length,
      ongoing: campaigns.filter((c) => c.is_ongoing === true).length,
      by_source: topGrouped(campaigns, (c) => c.source ?? '(none)', (c) => c.verified, 8),
    },
    sources: {
      total: allSources.length,
      active: allSources.filter((s) => s.is_active).length,
      never_scanned: allSources.filter((s) => s.is_active && !s.last_scraped_at).length,
      with_errors: allSources.filter((s) => s.is_active && s.last_error).length,
      top_producers: allSources
        .filter((s) => (s.total_items_found ?? 0) > 0)
        .slice(0, 8)
        .map((s) => ({
          name: s.name,
          total_items_found: s.total_items_found ?? 0,
          last_scraped_at: s.last_scraped_at,
        })),
      never_scanned_list: allSources
        .filter((s) => s.is_active && !s.last_scraped_at)
        .slice(0, 12)
        .map((s) => ({
          name: s.name,
          source_type: s.source_type,
          region: s.region,
          scrape_priority: s.scrape_priority,
        })),
    },
    queue: {
      pending: queue.filter((q) => q.status === 'pending').length,
      approved: queue.filter((q) => q.status === 'approved').length,
      rejected: queue.filter((q) => q.status === 'rejected').length,
      oldest_pending_days: oldestPendingDays,
      pending_by_type: pendingByType,
      flagged_dupes: queue.filter((q) => q.status === 'pending' && q.potential_duplicate_id != null).length,
    },
    flags: {
      placeholder_cases: placeholders,
      non_court_in_cases: cases.filter((c) => c.case_type && c.case_type !== 'court_decision').length,
    },
  };
}

export default async function HealthPage() {
  await requireAdmin('/admin/justice-matrix/health');
  const h = await loadHealth();

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const casesVerifiedPct = pct(h.cases.verified, h.cases.total);
  const casesHoldingPct = pct(h.cases.with_holding, h.cases.total);
  const casesLinkPct = pct(h.cases.with_link, h.cases.total);
  const sourcesScannedPct = pct(h.sources.active - h.sources.never_scanned, h.sources.active);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/justice-matrix" className="flex items-center gap-2 text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="w-px h-6 bg-gray-300" />
            <div>
              <h1 className="text-2xl font-black text-black">Matrix health</h1>
              <p className="text-sm text-gray-600">Snapshot of corpus, sources, queue, and data-quality flags.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/justice-matrix/sources" className="px-3 py-2 bg-white border-2 border-black font-bold text-sm hover:bg-gray-100">
              Sources →
            </Link>
            <Link href="/admin/justice-matrix/discoveries" className="px-3 py-2 bg-white border-2 border-black font-bold text-sm hover:bg-gray-100">
              Queue →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-8 space-y-8">
        {/* TOP STATS */}
        <Section icon={<Database className="w-5 h-5" />} title="Volume">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Cases" value={h.cases.total} sub={`${h.cases.verified} verified · ${casesVerifiedPct}%`} />
            <StatTile label="Campaigns" value={h.campaigns.total} sub={`${h.campaigns.verified} verified · ${pct(h.campaigns.verified, h.campaigns.total)}%`} />
            <StatTile label="Sources" value={h.sources.active} sub={`${h.sources.never_scanned} never scanned`} tone={h.sources.never_scanned > h.sources.active / 2 ? 'warn' : 'normal'} />
            <StatTile
              label="Queue pending"
              value={h.queue.pending}
              sub={h.queue.oldest_pending_days != null ? `oldest ${h.queue.oldest_pending_days} days` : '—'}
              tone={(h.queue.oldest_pending_days ?? 0) > 30 ? 'warn' : 'normal'}
            />
          </div>
        </Section>

        {/* COVERAGE */}
        <Section icon={<TrendingUp className="w-5 h-5" />} title="Coverage gaps">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Bar label="Cases with key_holding" pct={casesHoldingPct} have={h.cases.with_holding} total={h.cases.total} />
            <Bar label="Cases with source link" pct={casesLinkPct} have={h.cases.with_link} total={h.cases.total} />
            <Bar label="Cases with coords (map)" pct={pct(h.cases.with_coords, h.cases.total)} have={h.cases.with_coords} total={h.cases.total} />
            <Bar label="Cases verified" pct={casesVerifiedPct} have={h.cases.verified} total={h.cases.total} />
            <Bar label="Campaigns with link" pct={pct(h.campaigns.with_link, h.campaigns.total)} have={h.campaigns.with_link} total={h.campaigns.total} />
            <Bar label="Campaigns with tactics" pct={pct(h.campaigns.with_tactics, h.campaigns.total)} have={h.campaigns.with_tactics} total={h.campaigns.total} />
            <Bar label="Campaigns with outcome" pct={pct(h.campaigns.with_outcome_status, h.campaigns.total)} have={h.campaigns.with_outcome_status} total={h.campaigns.total} />
            <Bar label="Sources scanned" pct={sourcesScannedPct} have={h.sources.active - h.sources.never_scanned} total={h.sources.active} />
          </div>
        </Section>

        {/* CASE TYPE BREAKDOWN */}
        <Section icon={<AlertTriangle className="w-5 h-5" />} title={`Case-type taxonomy — ${h.flags.non_court_in_cases} of ${h.cases.total} are not court decisions`}>
          <table className="w-full text-sm border-2 border-black bg-white">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr className="text-left">
                <Th>Type</Th>
                <Th className="text-right">Count</Th>
              </tr>
            </thead>
            <tbody>
              {h.cases.by_case_type.map((row) => (
                <tr key={row.k} className={`border-b border-gray-200 ${row.k !== 'court_decision' && row.k !== '(untyped)' ? 'bg-yellow-50' : ''}`}>
                  <Td>
                    <span className="font-mono text-[12px]">{row.k}</span>
                    {row.k !== 'court_decision' && row.k !== '(untyped)' && <span className="text-[10px] text-yellow-700 ml-2">non-court</span>}
                  </Td>
                  <Td className="text-right tabular-nums font-bold">{row.n}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mt-3">
            The public list shows everything regardless of type. A future enhancement could filter by <code className="bg-gray-100 px-1">case_type</code> so practitioners see only court decisions by default.
          </p>
        </Section>

        {/* SOURCE OPERATIONS */}
        <Section icon={<Database className="w-5 h-5" />} title="Source operations">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <H3>Top producers</H3>
              <table className="w-full text-sm border-2 border-black bg-white">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr className="text-left">
                    <Th>Source</Th>
                    <Th className="text-right">Items found</Th>
                  </tr>
                </thead>
                <tbody>
                  {h.sources.top_producers.length === 0 && (
                    <tr><Td colSpan={2}><span className="text-gray-500">No producers yet.</span></Td></tr>
                  )}
                  {h.sources.top_producers.map((s) => (
                    <tr key={s.name} className="border-b border-gray-200">
                      <Td><span className="font-semibold">{s.name}</span></Td>
                      <Td className="text-right tabular-nums">{s.total_items_found}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <H3>{h.sources.never_scanned} active sources never scanned</H3>
              <table className="w-full text-sm border-2 border-black bg-white">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr className="text-left">
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Pri</Th>
                  </tr>
                </thead>
                <tbody>
                  {h.sources.never_scanned_list.map((s) => (
                    <tr key={s.name} className="border-b border-gray-200 bg-yellow-50">
                      <Td>{s.name}</Td>
                      <Td><span className="font-mono text-[11px]">{s.source_type}</span></Td>
                      <Td><span className="font-mono text-[11px]">{s.scrape_priority ?? '—'}</span></Td>
                    </tr>
                  ))}
                  {h.sources.never_scanned > h.sources.never_scanned_list.length && (
                    <tr>
                      <Td colSpan={3}>
                        <span className="text-xs text-gray-600">
                          …and {h.sources.never_scanned - h.sources.never_scanned_list.length} more.
                        </span>
                      </Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* QUEUE */}
        <Section icon={<Clock className="w-5 h-5" />} title="Review queue">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatTile label="Pending" value={h.queue.pending} sub={h.queue.flagged_dupes ? `${h.queue.flagged_dupes} flagged dupe` : '—'} tone={h.queue.pending > 30 ? 'warn' : 'normal'} />
            <StatTile label="Approved" value={h.queue.approved} sub="—" tone="good" />
            <StatTile label="Rejected" value={h.queue.rejected} sub="—" tone="muted" />
            <StatTile label="Oldest pending" value={h.queue.oldest_pending_days ?? 0} sub="days" tone={(h.queue.oldest_pending_days ?? 0) > 30 ? 'bad' : 'normal'} />
          </div>
          {h.queue.pending_by_type.length > 0 && (
            <div className="text-xs text-gray-600">
              Pending by item type:{' '}
              {h.queue.pending_by_type.map((t, i) => (
                <span key={t.k}>
                  <strong>{t.k}</strong> {t.n}
                  {i < h.queue.pending_by_type.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* FLAGS */}
        <Section icon={<XCircle className="w-5 h-5" />} title="Data-quality flags">
          <div className="bg-orange-50 border-2 border-orange-300 p-4 rounded mb-4">
            <div className="font-bold text-orange-900 mb-2 text-sm">
              {h.flags.placeholder_cases.length} suspect cases (downgraded to verified=false earlier)
            </div>
            <ul className="text-sm space-y-1 text-orange-900">
              {h.flags.placeholder_cases.map((p) => (
                <li key={p.id}>
                  • <span className="font-semibold">{p.case_citation}</span> — fake URL, LLM declined verification
                </li>
              ))}
            </ul>
            <p className="text-xs text-orange-700 mt-2">
              Either confirm via research or delete. Currently invisible as &ldquo;Verified&rdquo; but still listed in the practitioner views.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-7 w-7 rounded items-center justify-center" style={{ background: '#000', color: '#fff' }}>
          {icon}
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone = 'normal',
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: 'normal' | 'warn' | 'good' | 'bad' | 'muted';
}) {
  const palette =
    tone === 'warn'
      ? { bg: '#fffaeb', border: '#f0c36f' }
      : tone === 'good'
      ? { bg: '#f1fbf3', border: '#9fc3a6' }
      : tone === 'bad'
      ? { bg: '#fdf1f1', border: '#d6a0a0' }
      : tone === 'muted'
      ? { bg: '#f5f5f5', border: '#d1d5db' }
      : { bg: '#fff', border: '#000' };
  return (
    <div className="border-2 p-4" style={{ background: palette.bg, borderColor: palette.border, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-700 mb-1">{label}</div>
      <div className="text-4xl font-black tabular-nums leading-none">{value}</div>
      {sub && <div className="text-[11px] mt-1 text-gray-600">{sub}</div>}
    </div>
  );
}

function Bar({ label, pct, have, total }: { label: string; pct: number; have: number; total: number }) {
  const tone = pct >= 80 ? 'good' : pct >= 50 ? 'normal' : pct >= 25 ? 'warn' : 'bad';
  const bar = pct >= 80 ? '#3d6f4a' : pct >= 50 ? '#4a2560' : pct >= 25 ? '#a96a1c' : '#8a2a2a';
  const ring =
    tone === 'good'
      ? '#9fc3a6'
      : tone === 'normal'
      ? '#000'
      : tone === 'warn'
      ? '#f0c36f'
      : '#d6a0a0';
  return (
    <div className="border-2 bg-white p-3" style={{ borderColor: ring }}>
      <div className="text-[11px] text-gray-700 font-semibold mb-2 leading-tight">{label}</div>
      <div className="rounded-full overflow-hidden h-2.5 bg-gray-100 mb-2">
        <div className="h-full" style={{ width: `${pct}%`, background: bar }} />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black tabular-nums">{pct}%</span>
        <span className="text-[11px] text-gray-500 tabular-nums">
          {have} / {total}
        </span>
      </div>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600 mb-2">{children}</div>;
}
function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-700 ${className ?? ''}`}>{children}</th>;
}
function Td({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2 align-top ${className ?? ''}`}>
      {children}
    </td>
  );
}
