import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ArrowLeft, Scale, Megaphone, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Digest · Justice Matrix',
  description:
    'What is new in the Justice Matrix. The latest cases and campaigns added to the clearing house, week by week.',
};

export const dynamic = 'force-dynamic';

// Local "research tool" tokens — matches /justice-matrix/explore and the
// landing page so the whole tool feels like one experience. Scoped to this
// route; the global JusticeHub editorial design system is not used here.
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  borderStrong: '#d4d4d8',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  accentSoft: 'rgba(74,37,96,0.08)',
  barBg: '#1c1420',
  gold: '#d3b583',
};

// Kind styling mirrors KIND in ExploreClient so a digest row reads the same as
// a search result.
const KIND = {
  case: { label: 'Case', color: '#4a2560', soft: 'rgba(74,37,96,0.10)', border: '#c8b2d4', Icon: Scale },
  campaign: { label: 'Campaign', color: '#a96a1c', soft: 'rgba(169,106,28,0.10)', border: '#dbbf90', Icon: Megaphone },
} as const;

// A human-readable label for a non-decision case_type, matching the explore
// surface so reports and inquiries do not masquerade as court rulings.
function caseTypeLabel(t: string | null): string {
  if (!t) return 'Record';
  return t
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

interface DigestItem {
  kind: 'case' | 'campaign';
  id: string;
  title: string;
  jurisdiction: string | null;
  caseType: string | null; // cases only
  createdAt: string;
}

interface DigestData {
  items: DigestItem[];
  windowDays: number;
  fellBackToLatest: boolean;
}

const WINDOW_DAYS = 30;
const LATEST_LIMIT = 20;

async function loadDigest(): Promise<DigestData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // What cleared review and published into the matrix in the last 30 days.
  const [casesRes, campaignsRes] = await Promise.all([
    supabase
      .from('justice_matrix_cases')
      .select('id,case_citation,jurisdiction,case_type,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabase
      .from('justice_matrix_campaigns')
      .select('id,campaign_name,country_region,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
  ]);

  let cases = (casesRes.data ?? []) as Array<{
    id: string;
    case_citation: string;
    jurisdiction: string | null;
    case_type: string | null;
    created_at: string;
  }>;
  let campaigns = (campaignsRes.data ?? []) as Array<{
    id: string;
    campaign_name: string;
    country_region: string | null;
    created_at: string;
  }>;

  // Fallback: a quiet 30-day window should still show the feed. If nothing
  // cleared review recently, show the latest items regardless of date so the
  // page is never empty.
  let fellBackToLatest = false;
  if (!cases.length && !campaigns.length) {
    fellBackToLatest = true;
    const [latestCases, latestCampaigns] = await Promise.all([
      supabase
        .from('justice_matrix_cases')
        .select('id,case_citation,jurisdiction,case_type,created_at')
        .order('created_at', { ascending: false })
        .limit(LATEST_LIMIT),
      supabase
        .from('justice_matrix_campaigns')
        .select('id,campaign_name,country_region,created_at')
        .order('created_at', { ascending: false })
        .limit(LATEST_LIMIT),
    ]);
    cases = (latestCases.data ?? []) as typeof cases;
    campaigns = (latestCampaigns.data ?? []) as typeof campaigns;
  }

  const items: DigestItem[] = [
    ...cases.map((c) => ({
      kind: 'case' as const,
      id: c.id,
      title: c.case_citation,
      jurisdiction: c.jurisdiction,
      caseType: c.case_type,
      createdAt: c.created_at,
    })),
    ...campaigns.map((m) => ({
      kind: 'campaign' as const,
      id: m.id,
      title: m.campaign_name,
      jurisdiction: m.country_region,
      caseType: null,
      createdAt: m.created_at,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { items, windowDays: WINDOW_DAYS, fellBackToLatest };
}

// Group items by ISO week (Monday start) so the feed reads as "this week / last
// week" without a date library.
function weekKey(iso: string): { key: string; label: string } {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (x: Date) =>
    x.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return { key: monday.toISOString().slice(0, 10), label: `Week of ${fmt(monday)} – ${fmt(sunday)}` };
}

function hitHref(item: DigestItem): string {
  return `/justice-matrix/${item.kind === 'campaign' ? 'campaigns' : 'cases'}/${item.id}`;
}

export default async function DigestPage() {
  const { items, fellBackToLatest } = await loadDigest();

  // Build week-grouped sections in descending order.
  const groups = new Map<string, { label: string; items: DigestItem[] }>();
  for (const item of items) {
    const { key, label } = weekKey(item.createdAt);
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(item);
  }
  const sections = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const caseCount = items.filter((i) => i.kind === 'case').length;
  const campaignCount = items.filter((i) => i.kind === 'campaign').length;

  return (
    <main style={{ background: C.page, color: C.ink, fontFamily: SANS }} className="min-h-screen">
      {/* HEADER BAR — matches the explore sticky bar tone */}
      <header className="border-b" style={{ background: C.barBg, borderColor: '#000' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <Link
            href="/justice-matrix"
            className="flex items-center gap-2 shrink-0"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: C.gold }}
          >
            JUSTICE MATRIX
          </Link>
          <Link
            href="/justice-matrix/explore"
            className="ml-auto inline-flex items-center gap-1.5 text-sm"
            style={{ color: '#cbb8d6' }}
          >
            <ArrowLeft className="w-4 h-4" /> Explore
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* TITLE */}
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.accent }} className="uppercase mb-3">
          What cleared review lately
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3" style={{ color: C.ink }}>
          Recently added to the matrix
        </h1>
        <p className="text-base leading-7 max-w-2xl" style={{ color: C.body }}>
          {fellBackToLatest
            ? `The latest ${items.length} cases and campaigns added to the Justice Matrix.`
            : `Cases and campaigns added to the Justice Matrix in the last ${WINDOW_DAYS} days.`}
        </p>

        {/* COUNT STRIP */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5" style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
          <span>
            <strong style={{ color: C.ink }}>{caseCount.toLocaleString()}</strong> case{caseCount === 1 ? '' : 's'}
          </span>
          <span>
            <strong style={{ color: C.ink }}>{campaignCount.toLocaleString()}</strong> campaign{campaignCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* SECTIONS */}
        {items.length === 0 ? (
          <div className="rounded-lg border p-10 text-center mt-8" style={{ background: C.surface, borderColor: C.border }}>
            <p className="text-base mb-1" style={{ color: C.ink }}>
              Nothing has cleared review yet.
            </p>
            <p className="text-sm" style={{ color: C.muted }}>
              Check back soon, or{' '}
              <Link href="/justice-matrix/explore" className="underline" style={{ color: C.accent }}>
                browse the full matrix
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {sections.map(([key, section]) => (
              <section key={key}>
                <div
                  style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: C.muted }}
                  className="uppercase mb-2.5"
                >
                  {section.label}
                </div>
                <ul className="divide-y rounded-lg border" style={{ borderColor: C.border, background: C.surface }}>
                  {section.items.map((item) => (
                    <DigestRow key={`${item.kind}-${item.id}`} item={item} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function DigestRow({ item }: { item: DigestItem }) {
  const k = KIND[item.kind];
  const isReport = item.kind === 'case' && item.caseType && item.caseType !== 'court_decision';
  const dateLabel = new Date(item.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <li>
      <Link href={hitHref(item)} className="group flex items-start gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors">
        <k.Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: k.color }} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[15px] leading-snug" style={{ color: C.ink }}>
            {item.title}
          </div>
          <span
            className="mt-1 inline-flex flex-wrap items-center gap-x-2 gap-y-1"
            style={{ fontFamily: MONO, fontSize: 10.5 }}
          >
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 uppercase tracking-wider"
              style={{ background: k.soft, color: k.color, border: `1px solid ${k.border}` }}
            >
              {k.label}
            </span>
            {/* Non-decision cases are reports or inquiries, not rulings. Badge
                the real type so the feed stays honest, matching explore. */}
            {isReport && (
              <span
                className="rounded px-1.5 py-0.5 uppercase tracking-wider"
                style={{ background: '#f1f1f3', border: `1px solid ${C.border}`, color: C.body }}
              >
                {caseTypeLabel(item.caseType)}
              </span>
            )}
            {item.jurisdiction && <span style={{ color: C.muted }}>{item.jurisdiction}</span>}
            <span style={{ color: C.muted }}>· {dateLabel}</span>
          </span>
        </div>
        <ChevronRight className="w-4 h-4 self-center opacity-0 group-hover:opacity-50 shrink-0" style={{ color: C.accent }} />
      </Link>
    </li>
  );
}
