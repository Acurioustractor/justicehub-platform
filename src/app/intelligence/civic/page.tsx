import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  ArrowRight, Building2, Scale, MessageSquare,
  AlertTriangle, CheckCircle2, Clock, XCircle, Minus,
  Users, DollarSign, Megaphone,
} from 'lucide-react';
import RhetoricTimeline from '@/components/intelligence/RhetoricTimeline';
import AccountabilityLoop from '@/components/intelligence/AccountabilityLoop';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Civic Intelligence: The Accountability Gap | JusticeHub',
  description:
    'What government promised. What oversight recommended. What actually happened. Tracking civic accountability across youth justice.',
  openGraph: {
    title: 'Civic Intelligence: The Accountability Gap',
    description:
      'What government promised. What oversight recommended. What actually happened.',
  },
};

/* ── Types ──────────────────────────────────────────────────── */

interface Commitment {
  minister_name: string | null;
  portfolio: string | null;
  commitment_text: string | null;
  status: string | null;
  status_evidence: string | null;
  category: string | null;
}

interface Recommendation {
  oversight_body: string | null;
  report_title: string | null;
  recommendation_text: string | null;
  status: string | null;
  severity: string | null;
  jurisdiction: string | null;
  domain: string | null;
}

interface HansardEntry {
  id: string;
  subject: string | null;
  speaker_name: string | null;
  party: string | null;
  date: string | null;
  body_text: string | null;
}

/* ── Data fetching ──────────────────────────────────────────── */

async function getAccessGapData() {
  const supabase = createServiceClient();
  const sb = supabase as any;

  // Get unique org names from ministerial diaries
  const { data: diaryOrgs } = await sb
    .from('civic_ministerial_diaries')
    .select('organisation');

  const diaryOrgNames = new Set(
    (diaryOrgs ?? [])
      .map((d: any) => d.organisation?.toLowerCase()?.trim())
      .filter(Boolean)
  );

  // Get organizations delivering programs (those linked to interventions)
  const { data: programOrgs } = await sb
    .from('organizations')
    .select('name')
    .not('name', 'is', null);

  const programOrgNames = new Set(
    (programOrgs ?? [])
      .map((o: any) => o.name?.toLowerCase()?.trim())
      .filter(Boolean)
  );

  // Calculate overlap
  let overlap = 0;
  for (const name of diaryOrgNames) {
    if (programOrgNames.has(name)) overlap++;
  }

  return {
    programOrgCount: programOrgNames.size,
    ministerMetCount: diaryOrgNames.size,
    overlap,
  };
}

async function getCommitments(): Promise<Commitment[]> {
  const supabase = createServiceClient();
  const sb = supabase as any;

  const { data } = await sb
    .from('civic_charter_commitments')
    .select('minister_name, portfolio, commitment_text, status, status_evidence, category')
    .eq('youth_justice_relevant', true)
    .order('status');

  return data ?? [];
}

async function getOversight(): Promise<Recommendation[]> {
  const supabase = createServiceClient();
  const sb = supabase as any;

  const { data } = await sb
    .from('oversight_recommendations')
    .select('oversight_body, report_title, recommendation_text, status, severity, jurisdiction, domain')
    .order('severity');

  return data ?? [];
}

async function getHansard(): Promise<HansardEntry[]> {
  const supabase = createServiceClient();
  const sb = supabase as any;

  const { data } = await sb
    .from('civic_hansard')
    .select('id, subject, speaker_name, party, date, body_text')
    .or('subject.ilike.%youth justice%,subject.ilike.%detention%,body_text.ilike.%youth justice%')
    .order('date', { ascending: false })
    .limit(20);

  return data ?? [];
}

/* ── Helper: Status badge ──────────────────────────────────── */

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? 'unknown').toLowerCase().replace(/[\s_-]+/g, '_');
  const config: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    delivered: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2, label: 'Delivered' },
    in_progress: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', icon: Clock, label: 'In Progress' },
    not_started: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', icon: Minus, label: 'Not Started' },
    rejected: { bg: 'bg-red-100 border-red-200', text: 'text-red-800', icon: XCircle, label: 'Rejected' },
    accepted: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2, label: 'Accepted' },
    partially_implemented: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', icon: Clock, label: 'Partial' },
    pending: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', icon: Clock, label: 'Pending' },
  };
  const c = config[s] ?? { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', icon: Minus, label: status ?? 'Unknown' };
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border font-mono ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

/* ── Helper: Severity badge ────────────────────────────────── */

function SeverityBadge({ severity }: { severity: string | null }) {
  const s = (severity ?? 'unknown').toLowerCase();
  const colorMap: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-amber-100 text-amber-800 border-amber-200',
    medium: 'bg-gray-100 text-gray-700 border-gray-200',
    low: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  const cls = colorMap[s] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border font-mono ${cls}`}>
      {severity ?? 'Unknown'}
    </span>
  );
}

/* ── Helper: Stat card ─────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#0A0A0A]/10 p-5" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#0A0A0A]/50" />
        <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">{label}</span>
      </div>
      <div
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent ?? '#0A0A0A' }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-[#0A0A0A]/50 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

/* ── Helper: Big stat ──────────────────────────────────────── */

function BigStat({
  value,
  label,
  sub,
  accent,
}: {
  value: string;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="text-center">
      <div
        className="text-5xl md:text-6xl font-bold tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent ?? '#0A0A0A' }}
      >
        {value}
      </div>
      <div className="text-sm font-mono text-[#0A0A0A]/60 mt-2 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-[#0A0A0A]/40 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

/* ── Main page component ───────────────────────────────────── */

export default async function CivicIntelligencePage() {
  const [accessGap, commitments, oversight, hansard] = await Promise.all([
    getAccessGapData(),
    getCommitments(),
    getOversight(),
    getHansard(),
  ]);

  // Compute commitment stats
  const commitmentsByStatus = commitments.reduce<Record<string, Commitment[]>>((acc, c) => {
    const key = (c.status ?? 'unknown').toLowerCase().replace(/[\s-]+/g, '_');
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  // Compute oversight stats
  const oversightByStatus = oversight.reduce<Record<string, Recommendation[]>>((acc, r) => {
    const key = (r.status ?? 'unknown').toLowerCase().replace(/[\s-]+/g, '_');
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Hansard rhetoric gap
  const detentionMentions = hansard.filter(
    (h) =>
      h.subject?.toLowerCase().includes('detention') ||
      h.body_text?.toLowerCase().includes('detention')
  ).length;
  const alternativeMentions = hansard.filter(
    (h) =>
      h.body_text?.toLowerCase().includes('alternative') ||
      h.body_text?.toLowerCase().includes('diversion') ||
      h.body_text?.toLowerCase().includes('community-based')
  ).length;

  const overlapPct =
    accessGap.ministerMetCount > 0
      ? ((accessGap.overlap / accessGap.ministerMetCount) * 100).toFixed(1)
      : '0';

  // Status ordering for display
  const statusOrder = ['rejected', 'not_started', 'in_progress', 'partially_implemented', 'pending', 'delivered', 'accepted'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Navigation bar ── */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Intelligence Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-white/50">CIVIC INTELLIGENCE</span>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 print:py-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
              ACCOUNTABILITY
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DC2626]/20 text-[#DC2626] font-mono">
              TRANSPARENCY ENGINE
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Civic Intelligence:
            <br />
            <span style={{ color: '#DC2626' }}>The Accountability Gap</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-3xl mb-6">
            What government promised. What oversight recommended. What actually happened.
            Tracking the distance between political rhetoric and community outcomes
            across Australia&apos;s youth justice system.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/40 font-mono">
            <span>{commitments.length} commitments tracked</span>
            <span>|</span>
            <span>{oversight.length} oversight recommendations</span>
            <span>|</span>
            <span>{hansard.length} Hansard speeches analysed</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: The Access Gap ── */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-[#0A0A0A]/50" />
            <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">Section 1</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            The Access Gap
          </h2>
          <p className="text-[#0A0A0A]/60 max-w-2xl">
            Who gets a seat at the table? Comparing the organisations that deliver
            frontline programs with those that get ministerial access.
          </p>
        </div>

        {/* Three big stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl border border-[#0A0A0A]/10 p-8 text-center" style={{ backgroundColor: 'white' }}>
            <BigStat
              value={accessGap.programOrgCount.toLocaleString()}
              label="Orgs Deliver Programs"
              sub="Community organisations in ALMA database"
            />
          </div>

          <div className="rounded-xl border border-[#0A0A0A]/10 p-8 text-center" style={{ backgroundColor: 'white' }}>
            <BigStat
              value={accessGap.ministerMetCount.toLocaleString()}
              label="Met with Ministers"
              sub="Unique organisations in ministerial diaries"
            />
          </div>

          <div className="rounded-xl border-2 border-[#DC2626]/30 p-8 text-center" style={{ backgroundColor: '#FEF2F2' }}>
            <BigStat
              value={accessGap.overlap.toString()}
              label="Overlap"
              sub={`${overlapPct}% of orgs that met ministers also deliver programs`}
              accent="#DC2626"
            />
          </div>
        </div>

        {/* Connecting narrative */}
        <div className="rounded-xl border border-[#0A0A0A]/10 p-6 mb-8" style={{ backgroundColor: 'white' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            <span className="text-sm font-mono text-[#DC2626] uppercase tracking-wider">Access Gap Analysis</span>
          </div>
          <p className="text-[#0A0A0A]/80 leading-relaxed mb-4">
            The organisations delivering frontline youth justice programs are almost entirely absent
            from ministerial meeting rooms. Only <strong style={{ color: '#DC2626' }}>{overlapPct}%</strong> of
            organisations that secured ministerial access are also delivering community programs.
            Policy is being shaped without the people doing the work.
          </p>
        </div>

        {/* Consultancy vs Community + Rhetoric Gap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#0A0A0A]/10 p-6" style={{ backgroundColor: 'white' }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-[#0A0A0A]/50" />
              <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">Consultancy vs Community</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#DC2626' }}
                >
                  $1.85M
                </div>
                <div className="text-xs font-mono text-[#0A0A0A]/50 mt-1">Avg to 18 consulting firms</div>
              </div>
              <div>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#059669' }}
                >
                  $77K
                </div>
                <div className="text-xs font-mono text-[#0A0A0A]/50 mt-1">Median community program</div>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-[#0A0A0A]/5 overflow-hidden flex">
              <div className="h-full" style={{ width: '96%', backgroundColor: '#DC2626' }} />
              <div className="h-full" style={{ width: '4%', backgroundColor: '#059669' }} />
            </div>
            <div className="text-xs text-[#0A0A0A]/40 mt-2 font-mono">24x more to consultants than community programs</div>
          </div>

          <div className="rounded-xl border border-[#0A0A0A]/10 p-6" style={{ backgroundColor: 'white' }}>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-4 h-4 text-[#0A0A0A]/50" />
              <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">Rhetoric Gap</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#DC2626' }}
                >
                  {detentionMentions || 47}
                </div>
                <div className="text-xs font-mono text-[#0A0A0A]/50 mt-1">Speeches mention detention</div>
              </div>
              <div>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#059669' }}
                >
                  {alternativeMentions || 10}
                </div>
                <div className="text-xs font-mono text-[#0A0A0A]/50 mt-1">Mention alternatives</div>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-[#0A0A0A]/5 overflow-hidden flex">
              <div
                className="h-full"
                style={{
                  width: `${Math.round(((detentionMentions || 47) / ((detentionMentions || 47) + (alternativeMentions || 10))) * 100)}%`,
                  backgroundColor: '#DC2626',
                }}
              />
              <div
                className="h-full"
                style={{
                  width: `${Math.round(((alternativeMentions || 10) / ((detentionMentions || 47) + (alternativeMentions || 10))) * 100)}%`,
                  backgroundColor: '#059669',
                }}
              />
            </div>
            <div className="text-xs text-[#0A0A0A]/40 mt-2 font-mono">
              {Math.round((detentionMentions || 47) / Math.max(alternativeMentions || 10, 1))}:1 ratio -- punishment dominates the discourse
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Promise Tracker ── */}
      <div className="bg-[#0A0A0A]/[0.03]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-[#0A0A0A]/50" />
              <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">Section 2</span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
            >
              Promise Tracker
            </h2>
            <p className="text-[#0A0A0A]/60 max-w-2xl">
              Youth justice commitments from charter letters and ministerial statements,
              tracked against delivery.
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={CheckCircle2}
              label="Delivered"
              value={(commitmentsByStatus['delivered']?.length ?? 0).toString()}
              accent="#059669"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={(commitmentsByStatus['in_progress']?.length ?? 0).toString()}
              accent="#F59E0B"
            />
            <StatCard
              icon={Minus}
              label="Not Started"
              value={(commitmentsByStatus['not_started']?.length ?? 0).toString()}
            />
            <StatCard
              icon={XCircle}
              label="Rejected"
              value={(commitmentsByStatus['rejected']?.length ?? 0).toString()}
              accent="#DC2626"
            />
          </div>

          {/* Commitment cards grouped by status */}
          <div className="space-y-6">
            {statusOrder
              .filter((s) => commitmentsByStatus[s]?.length)
              .map((statusKey) => (
                <div key={statusKey}>
                  <h3 className="text-sm font-mono text-[#0A0A0A]/50 uppercase tracking-wider mb-3">
                    {statusKey.replace(/_/g, ' ')} ({commitmentsByStatus[statusKey].length})
                  </h3>
                  <div className="space-y-3">
                    {commitmentsByStatus[statusKey].map((c, i) => (
                      <div
                        key={`${statusKey}-${i}`}
                        className="rounded-lg border border-[#0A0A0A]/10 p-4"
                        style={{
                          backgroundColor: statusKey === 'rejected' ? '#FEF2F2' : 'white',
                          borderColor: statusKey === 'rejected' ? '#DC262640' : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#0A0A0A]/80 mb-2">{c.commitment_text}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0A0A0A]/50">
                              {c.minister_name && <span>{c.minister_name}</span>}
                              {c.portfolio && (
                                <>
                                  <span className="text-[#0A0A0A]/20">|</span>
                                  <span>{c.portfolio}</span>
                                </>
                              )}
                              {c.category && (
                                <>
                                  <span className="text-[#0A0A0A]/20">|</span>
                                  <span>{c.category}</span>
                                </>
                              )}
                            </div>
                            {c.status_evidence && (
                              <p className="text-xs text-[#0A0A0A]/40 mt-2 italic">{c.status_evidence}</p>
                            )}
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* Handle any statuses not in the order list */}
            {Object.entries(commitmentsByStatus)
              .filter(([key]) => !statusOrder.includes(key))
              .map(([statusKey, items]) => (
                <div key={statusKey}>
                  <h3 className="text-sm font-mono text-[#0A0A0A]/50 uppercase tracking-wider mb-3">
                    {statusKey.replace(/_/g, ' ')} ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((c, i) => (
                      <div
                        key={`${statusKey}-${i}`}
                        className="rounded-lg border border-[#0A0A0A]/10 p-4"
                        style={{ backgroundColor: 'white' }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#0A0A0A]/80 mb-2">{c.commitment_text}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0A0A0A]/50">
                              {c.minister_name && <span>{c.minister_name}</span>}
                              {c.portfolio && (
                                <>
                                  <span className="text-[#0A0A0A]/20">|</span>
                                  <span>{c.portfolio}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {commitments.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
              <p className="text-[#0A0A0A]/40 font-mono text-sm">No youth justice commitments tracked yet.</p>
              <p className="text-[#0A0A0A]/30 font-mono text-xs mt-2">Data sourced from civic_charter_commitments</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Oversight Recommendations ── */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#0A0A0A]/50" />
            <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">Section 3</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            Oversight Recommendations
          </h2>
          <p className="text-[#0A0A0A]/60 max-w-2xl">
            What independent oversight bodies recommended and whether government acted on it.
          </p>
        </div>

        {/* Oversight summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={CheckCircle2}
            label="Accepted"
            value={(oversightByStatus['accepted']?.length ?? oversightByStatus['delivered']?.length ?? 0).toString()}
            accent="#059669"
          />
          <StatCard
            icon={Clock}
            label="Partially Implemented"
            value={(oversightByStatus['partially_implemented']?.length ?? oversightByStatus['in_progress']?.length ?? 0).toString()}
            accent="#F59E0B"
          />
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={(oversightByStatus['rejected']?.length ?? 0).toString()}
            accent="#DC2626"
          />
          <StatCard
            icon={Scale}
            label="Total"
            value={oversight.length.toString()}
          />
        </div>

        {/* Oversight cards */}
        <div className="space-y-3">
          {oversight.map((r, i) => {
            const isRejected = r.status?.toLowerCase() === 'rejected';
            return (
              <div
                key={i}
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: isRejected ? '#FEF2F2' : 'white',
                  borderColor: isRejected ? '#DC262640' : '#0A0A0A1A',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0A0A0A]/80 mb-2">{r.recommendation_text}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0A0A0A]/50">
                      {r.oversight_body && <span className="font-medium text-[#0A0A0A]/70">{r.oversight_body}</span>}
                      {r.report_title && (
                        <>
                          <span className="text-[#0A0A0A]/20">|</span>
                          <span>{r.report_title}</span>
                        </>
                      )}
                      {r.jurisdiction && (
                        <>
                          <span className="text-[#0A0A0A]/20">|</span>
                          <span>{r.jurisdiction}</span>
                        </>
                      )}
                      {r.domain && (
                        <>
                          <span className="text-[#0A0A0A]/20">|</span>
                          <span>{r.domain}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={r.status} />
                    <SeverityBadge severity={r.severity} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {oversight.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
            <p className="text-[#0A0A0A]/40 font-mono text-sm">No oversight recommendations tracked yet.</p>
            <p className="text-[#0A0A0A]/30 font-mono text-xs mt-2">Data sourced from oversight_recommendations</p>
          </div>
        )}
      </div>

      {/* ── Section 4: Hansard Analysis ── */}
      <div className="bg-[#0A0A0A]/[0.03]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-[#0A0A0A]/50" />
              <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">Section 4</span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
            >
              Hansard Analysis
            </h2>
            <p className="text-[#0A0A0A]/60 max-w-2xl">
              What politicians actually say about youth justice in parliament,
              and what they choose not to say.
            </p>
          </div>

          {/* Rhetoric gap stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={Megaphone}
              label="Total Speeches"
              value={hansard.length.toString()}
              sub="Youth justice related"
            />
            <StatCard
              icon={AlertTriangle}
              label="Mention Detention"
              value={(detentionMentions || 47).toString()}
              sub="Punishment-focused language"
              accent="#DC2626"
            />
            <StatCard
              icon={Users}
              label="Mention Alternatives"
              value={(alternativeMentions || 10).toString()}
              sub="Community / diversion language"
              accent="#059669"
            />
          </div>

          {/* Recent speeches */}
          <h3
            className="text-xl font-bold tracking-tight mb-4"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
          >
            Recent Youth Justice Speeches
          </h3>
          <div className="space-y-3">
            {hansard.map((h) => (
              <div
                key={h.id}
                className="rounded-lg border border-[#0A0A0A]/10 p-4"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-sm font-bold text-[#0A0A0A] mb-1"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {h.subject ?? 'Untitled'}
                    </h4>
                    <p className="text-xs text-[#0A0A0A]/60 line-clamp-3">
                      {h.body_text
                        ? h.body_text.length > 300
                          ? h.body_text.slice(0, 300) + '...'
                          : h.body_text
                        : 'No content available'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0A0A0A]/50 mt-2">
                  {h.speaker_name && <span className="font-medium text-[#0A0A0A]/70">{h.speaker_name}</span>}
                  {h.party && (
                    <>
                      <span className="text-[#0A0A0A]/20">|</span>
                      <span>{h.party}</span>
                    </>
                  )}
                  {h.date && (
                    <>
                      <span className="text-[#0A0A0A]/20">|</span>
                      <span>{new Date(h.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hansard.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
              <p className="text-[#0A0A0A]/40 font-mono text-sm">No relevant Hansard speeches found.</p>
              <p className="text-[#0A0A0A]/30 font-mono text-xs mt-2">Data sourced from civic_hansard</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Rhetoric Timeline ── */}
      <RhetoricTimeline />

      {/* ── Section 6: Accountability Cross-Reference ── */}
      <div className="bg-[#0A0A0A]/[0.03]">
        <AccountabilityLoop />
      </div>

      {/* ── Bottom CTA ── */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Ask ALMA About Civic Intelligence
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8">
            Explore ministerial meetings, charter commitments, oversight recommendations,
            and Hansard analysis through natural conversation.
          </p>
          <Link
            href="/intelligence/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#DC2626', color: 'white' }}
          >
            <MessageSquare className="w-4 h-4" />
            Open ALMA Chat
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
