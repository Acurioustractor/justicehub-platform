import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { ArrowRight } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { Users } from 'lucide-react';
import { Building2 } from 'lucide-react';
import { Scale } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { FileText } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Shield } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Globe } from 'lucide-react';
import { Heart } from 'lucide-react';
import { Eye } from 'lucide-react';
import { Megaphone } from 'lucide-react';
import { formatDollars, pct } from '@/lib/intelligence/regional-computations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'QLD Youth Justice Sector Report | JusticeHub',
  description:
    'Full sector intelligence report on Queensland youth justice — $536M/year, 90% unsentenced, 69% reoffending, and the case for community control. 484 programs mapped.',
  openGraph: {
    title: 'QLD Youth Justice Sector Report',
    description:
      '$536M/year. 90% unsentenced. Reoffending going up. 484 programs mapped. Community voices included.',
  },
};

/* ── Constants ──────────────────────────────────────────────── */

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'bg-emerald-600',
  'Effective (strong evaluation, positive outcomes)': 'bg-green-600',
  'Promising (community-endorsed, emerging evidence)': 'bg-amber-500',
  'Indigenous-led (culturally grounded, community authority)': 'bg-purple-600',
  'Untested (theory/pilot stage)': 'bg-gray-400',
};

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

const EVIDENCE_ORDER = [
  'Proven (RCT/quasi-experimental, replicated)',
  'Effective (strong evaluation, positive outcomes)',
  'Promising (community-endorsed, emerging evidence)',
  'Indigenous-led (culturally grounded, community authority)',
  'Untested (theory/pilot stage)',
];

const CONTROL_LABELS: Record<string, string> = {
  community_controlled: 'Community Controlled',
  community_adjacent: 'Community Adjacent',
  intermediary: 'Intermediary',
  government: 'Government',
  university: 'University',
  peak_body: 'Peak Body',
  unlinked: 'Unlinked/Unknown',
};

const CONTROL_COLORS: Record<string, { bar: string; badge: string }> = {
  community_controlled: { bar: 'bg-[#059669]', badge: 'bg-emerald-100 text-emerald-800' },
  community_adjacent: { bar: 'bg-teal-400', badge: 'bg-teal-100 text-teal-800' },
  intermediary: { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
  government: { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-800' },
  university: { bar: 'bg-blue-400', badge: 'bg-blue-100 text-blue-800' },
  peak_body: { bar: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-800' },
  unlinked: { bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-700' },
};

/* ── Types ─────────────────────────────────────────────────── */

interface ContractRecipient {
  name: string;
  slug: string | null;
  controlType: string;
  isIndigenous: boolean;
  contracts: number;
  totalDollars: number;
}

interface ControlBreakdown {
  controlType: string;
  label: string;
  records: number;
  totalDollars: number;
  orgCount: number;
}

interface MinisterialStatement {
  headline: string;
  publishedAt: string;
  amounts: string[];
  programs: string[];
}

interface EvidenceRow {
  level: string;
  shortLabel: string;
  count: number;
}

/* ── Data fetching ──────────────────────────────────────────── */

async function getDYJVSData() {
  const supabase = createServiceClient();
  const sb = supabase as any;

  const [
    dyjvsContractsRes,
    gerberStatementsRes,
    qldProgramsRes,
    qldOrgsRes,
    rogsRes,
    mediaRes,
    mediaSentimentRes,
  ] = await Promise.all([
    sb.from('justice_funding')
      .select('id, amount_dollars, alma_organization_id, recipient_name, source_statement_id')
      .eq('source', 'dyjvs-contracts'),

    sb.from('civic_ministerial_statements')
      .select('headline, published_at, mentioned_amounts, mentioned_programs, mentioned_orgs')
      .ilike('minister_name', '%gerber%')
      .order('published_at', { ascending: false }),

    sb.from('alma_interventions')
      .select('id, name, evidence_level, cost_per_young_person, operating_organization_id, geography')
      .neq('verification_status', 'ai_generated'),

    sb.from('organizations')
      .select('id, name, slug, state, is_indigenous_org, control_type, abn')
      .eq('state', 'QLD')
      .eq('is_active', true),

    sb.from('rogs_justice_spending')
      .select('financial_year, qld, description1, unit')
      .eq('rogs_section', 'youth_justice')
      .eq('measure', 'Government expenditure')
      .eq('description1', 'Government real recurrent expenditure')
      .eq('unit', "$'000")
      .not('qld', 'is', null)
      .order('financial_year', { ascending: true }),

    sb.from('alma_media_articles')
      .select('id, headline, source_name, published_date, url, sentiment')
      .or('state.eq.QLD,headline.ilike.%queensland%,headline.ilike.%qld%')
      .order('published_date', { ascending: false })
      .limit(100),

    // Sentiment counts
    sb.from('alma_media_articles')
      .select('sentiment')
      .or('state.eq.QLD,headline.ilike.%queensland%,headline.ilike.%qld%')
      .not('sentiment', 'is', null),
  ]);

  const contracts: any[] = dyjvsContractsRes.data || [];
  const statements: any[] = gerberStatementsRes.data || [];
  const allPrograms: any[] = qldProgramsRes.data || [];
  const allQldOrgs: any[] = qldOrgsRes.data || [];
  const rogsData: any[] = rogsRes.data || [];
  const mediaArticles: any[] = mediaRes.data || [];
  const mediaSentimentData: any[] = mediaSentimentRes.data || [];

  // Sentiment aggregation
  const sentimentCounts: Record<string, number> = {};
  for (const row of mediaSentimentData) {
    sentimentCounts[row.sentiment] = (sentimentCounts[row.sentiment] || 0) + 1;
  }

  // Build org lookup from QLD orgs
  const orgMap: Map<string, any> = new Map();
  const qldOrgIds: Set<string> = new Set();
  for (const o of allQldOrgs) {
    orgMap.set(o.id, o);
    qldOrgIds.add(o.id);
  }

  // Fetch org names for contract recipients not in QLD org set
  const contractOrgIds = [...new Set(
    contracts
      .map((c: any) => c.alma_organization_id)
      .filter((id: string | null) => id && !orgMap.has(id))
  )];
  if (contractOrgIds.length > 0) {
    const { data: contractOrgs } = await sb.from('organizations')
      .select('id, name, slug, state, is_indigenous_org, control_type')
      .in('id', contractOrgIds);
    for (const o of (contractOrgs || [])) {
      orgMap.set(o.id, o);
    }
  }

  // Filter programs to QLD
  const qldPrograms = allPrograms.filter(
    (p: any) => p.operating_organization_id && qldOrgIds.has(p.operating_organization_id)
  );

  // Cost tier analysis
  const costTiers = { community: 0, intensive: 0, residential: 0, detention: 0 };
  for (const p of qldPrograms) {
    const cost = p.cost_per_young_person || 0;
    if (cost > 0 && cost < 5000) costTiers.community++;
    else if (cost >= 5000 && cost < 25000) costTiers.intensive++;
    else if (cost >= 25000 && cost < 100000) costTiers.residential++;
    else if (cost >= 100000) costTiers.detention++;
  }

  // ── DYJVS contract recipients ──
  const recipientTotals: Map<string, { total: number; count: number; orgId: string | null }> = new Map();
  for (const c of contracts) {
    const key = c.alma_organization_id || c.recipient_name || 'Unknown';
    const existing = recipientTotals.get(key) || { total: 0, count: 0, orgId: c.alma_organization_id };
    existing.total += c.amount_dollars || 0;
    existing.count++;
    recipientTotals.set(key, existing);
  }

  const topRecipients: ContractRecipient[] = [...recipientTotals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 25)
    .map(([key, data]) => {
      const org = data.orgId ? orgMap.get(data.orgId) : null;
      return {
        name: org?.name || key,
        slug: org?.slug || null,
        controlType: org?.control_type || 'unlinked',
        isIndigenous: org?.is_indigenous_org || false,
        contracts: data.count,
        totalDollars: data.total,
      };
    });

  const totalDyjvsDollars = contracts.reduce((s: number, c: any) => s + (c.amount_dollars || 0), 0);

  // ── DYJVS by control type ──
  const controlAgg: Map<string, { total: number; records: number; orgIds: Set<string> }> = new Map();
  for (const c of contracts) {
    const org = c.alma_organization_id ? orgMap.get(c.alma_organization_id) : null;
    const ct = org?.control_type || 'unlinked';
    const existing = controlAgg.get(ct) || { total: 0, records: 0, orgIds: new Set() };
    existing.total += c.amount_dollars || 0;
    existing.records++;
    if (c.alma_organization_id) existing.orgIds.add(c.alma_organization_id);
    controlAgg.set(ct, existing);
  }

  const controlBreakdown: ControlBreakdown[] = [...controlAgg.entries()]
    .map(([ct, data]) => ({
      controlType: ct,
      label: CONTROL_LABELS[ct] || ct,
      records: data.records,
      totalDollars: data.total,
      orgCount: data.orgIds.size,
    }))
    .sort((a, b) => b.totalDollars - a.totalDollars);

  // ── Ministerial statements ──
  const ministerialStatements: MinisterialStatement[] = statements.map((s: any) => ({
    headline: s.headline,
    publishedAt: s.published_at,
    amounts: s.mentioned_amounts || [],
    programs: s.mentioned_programs || [],
  }));

  // ── Evidence distribution ──
  const evidenceCounts: Map<string, number> = new Map();
  for (const p of qldPrograms) {
    const el = p.evidence_level || 'Untested (theory/pilot stage)';
    evidenceCounts.set(el, (evidenceCounts.get(el) || 0) + 1);
  }
  const evidenceDistribution: EvidenceRow[] = EVIDENCE_ORDER
    .map(level => ({
      level,
      shortLabel: EVIDENCE_SHORT[level] || 'Unknown',
      count: evidenceCounts.get(level) || 0,
    }))
    .filter(r => r.count > 0);

  // ── ROGS spending trend ──
  const rogsByYear: Map<string, number> = new Map();
  for (const r of rogsData) {
    const year = r.financial_year;
    const val = parseFloat(r.qld) || 0;
    if (val > (rogsByYear.get(year) || 0)) {
      rogsByYear.set(year, val);
    }
  }
  const spendingTrend = [...rogsByYear.entries()]
    .map(([year, val]) => ({ year, thousandDollars: val }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const indigenousOrgCount = allQldOrgs.filter((o: any) => o.is_indigenous_org).length;

  return {
    totalDyjvsDollars,
    totalContracts: contracts.length,
    topRecipients,
    controlBreakdown,
    ministerialStatements,
    evidenceDistribution,
    totalPrograms: qldPrograms.length,
    spendingTrend,
    indigenousOrgCount,
    totalOrgs: allQldOrgs.length,
    mediaCount: mediaSentimentData.length,
    sentimentCounts,
    mediaArticles,
    costTiers,
  };
}

/* ── Components ────────────────────────────────────────────── */

function SectionHeader({ icon, title, subtitle, id }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  id?: string;
}) {
  return (
    <div className="mb-8" id={id}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-[#0A0A0A]/5">{icon}</div>
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-[#0A0A0A]/60 max-w-3xl">{subtitle}</p>
    </div>
  );
}

function StatBlock({ value, label, urgent, source }: { value: string; label: string; urgent?: boolean; source?: string }) {
  return (
    <div>
      <div
        className={`text-2xl md:text-3xl font-bold font-mono tracking-tight ${urgent ? 'text-[#DC2626]' : 'text-white'}`}
      >
        {value}
      </div>
      <div className="text-xs text-white/50 font-mono uppercase mt-1">{label}</div>
      {source && <div className="text-[10px] text-white/25 font-mono mt-0.5">{source}</div>}
    </div>
  );
}

function KeyFinding({ title, children, urgent }: {
  title: string;
  children: React.ReactNode;
  urgent?: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl border-2 ${urgent ? 'border-[#DC2626]/20 bg-[#DC2626]/5' : 'border-[#059669]/20 bg-[#059669]/5'}`}>
      <div className="flex items-start gap-3">
        {urgent
          ? <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
          : <Shield className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />}
        <div>
          <p className="font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </p>
          <div className="text-sm text-[#0A0A0A]/70 mt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-[#0A0A0A]/40 hover:text-[#0A0A0A]/70 transition-colors font-mono"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}

function StoryCard({ quote, speaker, role, community, storyTitle }: {
  quote: string;
  speaker: string;
  role: string;
  community: string;
  storyTitle: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#059669]">
      <blockquote className="text-sm italic text-[#0A0A0A]/80 mb-3 leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-[#059669]" />
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">{speaker}</p>
          <p className="text-xs text-[#0A0A0A]/50">{role} &middot; {community}</p>
        </div>
      </div>
      <p className="text-[10px] font-mono text-[#0A0A0A]/30 mt-2">
        From &ldquo;{storyTitle}&rdquo; &middot; Empathy Ledger
      </p>
    </div>
  );
}

function InternationalModel({ country, model, outcome, detail, source }: {
  country: string;
  model: string;
  outcome: string;
  detail: string;
  source: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4 text-[#059669]" />
        <span className="text-xs font-mono text-[#0A0A0A]/40 uppercase">{country}</span>
      </div>
      <h4 className="font-bold text-sm text-[#0A0A0A] mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {model}
      </h4>
      <div className="text-lg font-bold font-mono text-[#059669] mb-1">{outcome}</div>
      <p className="text-xs text-[#0A0A0A]/60 leading-relaxed">{detail}</p>
      <p className="text-[10px] font-mono text-[#0A0A0A]/30 mt-2">{source}</p>
    </div>
  );
}

function ConnectedLink({ href, icon, title, description }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="p-2 rounded-lg bg-[#0A0A0A]/5 group-hover:bg-[#0A0A0A]/10 transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm text-[#0A0A0A] group-hover:text-[#059669] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </p>
        <p className="text-xs text-[#0A0A0A]/50 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ── Hard-coded research data (VERIFIED — all claims sourced) ── */

const RESEARCH_DATA = {
  // ROGS 2025
  rogsTotal2025: 536_089_000,
  detentionCostPerDay: 2_714,
  communityCostPerDay: 493,
  indigenousOverrep: 26.3,

  // QAO Report 15, 2024
  recidivism12mo: 69,
  recidivismSource: 'QAO Report 15 (2024)',
  qaoNoEvidence: 18,
  qaoCoResponder: 104_600_000,

  // QFCC Exiting Youth Detention, June 2024
  recidivismDetention: '84-96',
  detentionRecidivismSource: 'QFCC Exiting Youth Detention (June 2024)',

  // QFCC Crossover Cohort Data Insights, November 2024
  crossSystemCP: 72.9,
  crossSystemCPFirstNations: 81.2,

  // AIHW Youth Justice in Australia 2023-24
  aihwDetainedPerNight: 300,
  aihwSupervisedPerDay: 1_598,
  aihwUnsentencedPct: 90,
  aihwNationalUnsentencedPct: 72,
  aihwDetentionRate: 5.1,
  aihwNationalDetentionRate: 3.0,
  aihwFirstNationsRate: 159,
  aihwFirstNationsPctDetained: 72,
  aihwDetentionUp5yr: 50,
  aihwCommunityDown5yr: 18,

  // Clinical/national estimates
  crossSystemMH: 45,
  crossSystemDisability: 40,

  // Budget/contract analysis
  earlyInterventionClaim: 560_000_000,
  detentionInfrastructure: 318_000_000,
  detentionInfraPct: 57,
  intermediaryTopContracts: 963_000_000,
  accoTopContracts: 36_000_000,
  intermediaryRatio: 27,

  // Palm Island — JusticeHub data
  palmIslandPrograms: 21,

  // Ministerial diary — Oct 2025-Jan 2026
  gerberDiaryEntries: 340,
  gerberStakeholderMeetings: 20,
  gerberYJMeetings: 8,

  // RTI disclosures — DYJVS
  rtiTotal: 17,
  rtiRefusedPct: 88,

  // Consultancy — contract disclosure
  consultancyTotal: 1_850_000,

  // Closing the Gap Target 11
  ctgQldRate: 46,
  ctgTarget: 22.3,
};

/* ── Page ──────────────────────────────────────────────────── */

export default async function DYJVSBriefing() {
  const {
    totalDyjvsDollars,
    totalContracts,
    topRecipients,
    controlBreakdown,
    ministerialStatements,
    evidenceDistribution,
    totalPrograms,
    spendingTrend,
    indigenousOrgCount,
    totalOrgs,
    mediaCount,
    sentimentCounts,
    mediaArticles,
    costTiers,
  } = await getDYJVSData();

  const totalEvidence = evidenceDistribution.reduce((s, r) => s + r.count, 0);
  const controlTotal = controlBreakdown.reduce((s, r) => s + r.totalDollars, 0);

  const sections = [
    { id: 'scale', label: 'The System' },
    { id: 'spending', label: 'Spending' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'control', label: 'Who Gets the Money' },
    { id: 'evidence', label: 'Evidence Profile' },
    { id: 'recidivism', label: 'Recidivism' },
    { id: 'voices', label: 'Community Voices' },
    { id: 'international', label: 'What Works Globally' },
    { id: 'sector', label: 'What the Sector Says' },
    { id: 'transparency', label: 'Transparency' },
    { id: 'ministerial', label: 'Ministerial Activity' },
    { id: 'pipeline', label: 'Cross-System Pipeline' },
    { id: 'gaps', label: 'Data Gaps' },
    { id: 'connected', label: 'Connected' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Navigation ── */}
      <div className="bg-[#0A0A0A] text-white py-3 px-6 flex items-center justify-between text-sm print:hidden">
        <Link href="/intelligence" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Intelligence Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/intelligence/qld-justice" className="text-white/50 hover:text-white text-xs">
            QLD Overview
          </Link>
          <Link href="/intelligence/national" className="text-white/50 hover:text-white text-xs">
            National
          </Link>
          <span className="font-mono text-xs text-white/50">SECTOR REPORT</span>
          <span className="font-mono text-xs text-white/30">Ctrl+P to save as PDF</span>
        </div>
      </div>

      {/* ====== HERO ====== */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 print:py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DC2626]/20 text-[#DC2626] font-mono">
                  SECTOR INTELLIGENCE REPORT
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
                  QUEENSLAND
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 font-mono">
                  MARCH 2026
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                $536M/year.
                <br />
                90% unsentenced.
                <br />
                Reoffending going up.
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-3xl">
                A comprehensive evidence report on Queensland&apos;s youth justice system: where the money goes,
                what the data shows, what communities are building, and what works around the world.
                {totalPrograms > 0 && <> {totalPrograms} programs mapped. {mediaCount} media articles analysed.</>}
              </p>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <Scale className="w-10 h-10 text-white/20" />
              <span className="text-xs font-mono text-white/30">QLD YJ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero stat strip */}
      <div className="bg-[#0A0A0A] border-t border-white/10 print:border-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-6 gap-6">
          <StatBlock value="$536M" label="YJ Spend 2024-25" source="ROGS 2025" />
          <StatBlock value="90%" label="Unsentenced" urgent source="AIHW 2023-24" />
          <StatBlock value="69%" label="Reoffend 12mo" urgent source="QAO 2024" />
          <StatBlock value="26.3x" label="Indigenous Overrep" urgent source="ROGS 2025" />
          <StatBlock value="$2,714" label="Detention $/day" source="ROGS 2025" />
          <StatBlock value={`${totalPrograms}`} label="Programs Mapped" source="JusticeHub" />
        </div>
      </div>

      {/* ── Table of Contents ── */}
      <div className="max-w-6xl mx-auto px-6 py-8 print:hidden">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-mono text-xs uppercase text-[#0A0A0A]/40 mb-3">Contents</h3>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors"
              >
                <span className="font-mono text-xs text-[#0A0A0A]/30">{i + 1}.</span>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4 space-y-20 print:space-y-10">

        {/* ====== SECTION 1: SYSTEM AT SCALE ====== */}
        <section>
          <SectionHeader
            id="scale"
            icon={<Users className="w-6 h-6" />}
            title="The System at Scale"
            subtitle="On any given night, 300 young people are in QLD detention — the highest count nationally. 90% haven't been convicted."
          />

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.aihwUnsentencedPct}%</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">Unsentenced in detention</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-0.5">vs {RESEARCH_DATA.aihwNationalUnsentencedPct}% nationally</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#0A0A0A]">{RESEARCH_DATA.aihwDetainedPerNight}</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">Detained per night</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-0.5">Highest nationally</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#0A0A0A]">{RESEARCH_DATA.aihwSupervisedPerDay.toLocaleString()}</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">Supervised per day</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-0.5">AIHW 2023-24</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.aihwFirstNationsPctDetained}%</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">First Nations in detention</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-0.5">Rate: {RESEARCH_DATA.aihwFirstNationsRate}/10K</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <KeyFinding title="A remand crisis, not a crime crisis" urgent>
              <p>
                <strong>90% of young people in QLD detention are unsentenced</strong> — held on remand, not convicted.
                This is the highest rate nationally (72% average). QLD is not detaining convicted offenders; it is
                warehousing children awaiting trial at $2,714/day. This is a bail system problem.
              </p>
              <p className="mt-2"><SourceLink href="https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/state-and-territory-overviews/queensland" label="AIHW 2023-24, QLD chapter" /></p>
            </KeyFinding>
            <KeyFinding title="Detention rising, community falling" urgent>
              <p>
                Over five years, QLD detention numbers are <strong>up {RESEARCH_DATA.aihwDetentionUp5yr}%</strong> while
                community supervision is <strong>down {RESEARCH_DATA.aihwCommunityDown5yr}%</strong>. The system is structurally
                shifting young people from community into custody. First Nations detention rate has risen from
                33 to 40 per 10,000 over four years.
              </p>
              <p className="mt-2"><SourceLink href="https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2025/contents/summary" label="AIHW Youth Detention 2025" /></p>
            </KeyFinding>
          </div>

          {/* Closing the Gap */}
          <div className="mt-6 p-5 rounded-xl bg-[#0A0A0A] text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-white/40 uppercase">Closing the Gap — Target 11</span>
            </div>
            <p className="text-sm text-white/70">
              QLD&apos;s First Nations youth detention rate is <strong className="text-[#DC2626]">{RESEARCH_DATA.ctgQldRate} per 10,000</strong> —
              more than double the national target of {RESEARCH_DATA.ctgTarget}. The target is assessed as
              &ldquo;no change from baseline&rdquo; nationally, but QLD is actively going backwards.
            </p>
            <p className="mt-2"><SourceLink href="https://www.closingthegap.gov.au/national-agreement/targets" label="Closing the Gap Dashboard" /></p>
          </div>
        </section>

        {/* ====== SECTION 2: SPENDING PICTURE ====== */}
        <section>
          <SectionHeader
            id="spending"
            icon={<TrendingUp className="w-6 h-6" />}
            title="The Spending Picture"
            subtitle="Spending has more than doubled in a decade while outcomes have worsened."
          />

          {spendingTrend.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3
                className="text-lg font-bold mb-4"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
              >
                ROGS Real Recurrent Expenditure ($&apos;000)
              </h3>
              <div className="space-y-2">
                {spendingTrend.map(row => {
                  const maxVal = Math.max(...spendingTrend.map(r => r.thousandDollars));
                  const widthPct = maxVal > 0 ? (row.thousandDollars / maxVal) * 100 : 0;
                  return (
                    <div key={row.year} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#0A0A0A]/50 w-16 flex-shrink-0">{row.year}</span>
                      <div className="flex-1 h-6 bg-[#F5F0E8] rounded overflow-hidden">
                        <div
                          className="h-full bg-[#0A0A0A] rounded flex items-center justify-end px-2"
                          style={{ width: `${Math.max(widthPct, 2)}%` }}
                        >
                          {widthPct > 25 && (
                            <span className="text-xs font-mono text-white">
                              ${(row.thousandDollars / 1000).toFixed(0)}M
                            </span>
                          )}
                        </div>
                      </div>
                      {widthPct <= 25 && (
                        <span className="text-xs font-mono text-[#0A0A0A]/50">
                          ${(row.thousandDollars / 1000).toFixed(0)}M
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#0A0A0A]/40 mt-3 font-mono">Source: ROGS 2025, Table 17A.1</p>
            </div>
          )}

          {/* Cost tiers */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
              Cost Per Young Person — {totalPrograms} QLD Programs
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Community (<$5K/yr)', count: costTiers.community, color: 'bg-[#059669]', examples: 'Mentoring, diversion, sport, cultural programs' },
                { label: 'Intensive ($5-25K/yr)', count: costTiers.intensive, color: 'bg-teal-400', examples: 'Case management, bail support, family intervention' },
                { label: 'Residential ($25-100K/yr)', count: costTiers.residential, color: 'bg-amber-400', examples: 'Residential rehab, therapeutic care' },
                { label: 'Detention (>$100K/yr)', count: costTiers.detention, color: 'bg-[#DC2626]', examples: 'Youth detention centres' },
              ].map(tier => {
                const maxCount = Math.max(costTiers.community, costTiers.intensive, costTiers.residential, costTiers.detention);
                const widthPct = maxCount > 0 ? (tier.count / maxCount) * 100 : 0;
                return (
                  <div key={tier.label}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#0A0A0A] w-40 flex-shrink-0">{tier.label}</span>
                      <div className="flex-1 h-7 bg-[#F5F0E8] rounded overflow-hidden">
                        <div
                          className={`h-full ${tier.color} rounded flex items-center px-2`}
                          style={{ width: `${Math.max(widthPct, 3)}%` }}
                        >
                          <span className="text-xs font-mono text-white font-medium">{tier.count}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#0A0A0A]/40 ml-40 pl-3 mt-0.5">{tier.examples}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#0A0A0A]/40 mt-4 font-mono">Source: JusticeHub program cost analysis, verified March 2026. Median $5K/yr.</p>
          </div>

          {/* Early intervention decomposition */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}>
              The &ldquo;$560M Early Intervention&rdquo; Package
            </h3>
            <p className="text-sm text-[#0A0A0A]/50 mb-4">What the government calls early intervention vs what the money actually buys.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#0A0A0A]/10">
                    <th className="text-left py-2 font-mono text-xs uppercase text-[#0A0A0A]/40">Component</th>
                    <th className="text-right py-2 font-mono text-xs uppercase text-[#0A0A0A]/40">Amount</th>
                    <th className="text-right py-2 font-mono text-xs uppercase text-[#0A0A0A]/40">% of $560M</th>
                    <th className="text-left py-2 pl-4 font-mono text-xs uppercase text-[#0A0A0A]/40">What it is</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { component: 'Woodford Youth Detention Centre', amount: '$224M', pct: '40%', actual: 'Detention infrastructure', urgent: true },
                    { component: 'Wacol Youth Detention expansion', amount: '$94M', pct: '17%', actual: 'Detention infrastructure', urgent: true },
                    { component: 'Kickstarter Fund programs', amount: '~$115M', pct: '21%', actual: 'Actual early intervention', urgent: false },
                    { component: 'Regional Reset programs', amount: '~$50M', pct: '9%', actual: 'Short-stay residential + mentoring', urgent: false },
                    { component: 'Other', amount: '~$77M', pct: '14%', actual: 'Mixed', urgent: false },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[#0A0A0A]/5">
                      <td className={`py-2 ${row.urgent ? 'font-medium text-[#DC2626]' : 'text-[#0A0A0A]'}`}>{row.component}</td>
                      <td className="py-2 text-right font-mono text-xs">{row.amount}</td>
                      <td className="py-2 text-right font-mono text-xs">{row.pct}</td>
                      <td className={`py-2 pl-4 text-xs ${row.urgent ? 'text-[#DC2626] font-medium' : 'text-[#0A0A0A]/60'}`}>{row.actual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-mono text-[#0A0A0A]/40 mt-3">Source: QLD Budget SDS 2025-26; component analysis by JusticeHub</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <KeyFinding title="57% of 'early intervention' is detention construction" urgent>
              <p>
                $318M of the claimed $560M early intervention budget is Woodford and Wacol detention
                infrastructure. Relabelling detention construction as prevention is a framing choice, not a policy one.
              </p>
            </KeyFinding>
            <KeyFinding title="$104.6M with no documented rationale" urgent>
              <p>
                The QLD Auditor-General found the co-responder program received <strong>$104.6M</strong> with
                no documented rationale for the spending level (QAO Report 15, 2024).
              </p>
            </KeyFinding>
          </div>
        </section>

        {/* ====== SECTION 3: DYJVS CONTRACTS ====== */}
        <section>
          <SectionHeader
            id="contracts"
            icon={<FileText className="w-6 h-6" />}
            title="DYJVS Contract Recipients"
            subtitle={`${totalContracts} disclosed contracts worth ${formatDollars(totalDyjvsDollars)}. Who receives DYJVS funding?`}
          />
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase w-8">#</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Recipient</th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Type</th>
                    <th className="text-center px-4 py-3 font-mono text-xs uppercase">Indigenous</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Contracts</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total Value</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">% of DYJVS</th>
                  </tr>
                </thead>
                <tbody>
                  {topRecipients.map((r, i) => (
                    <tr key={r.name} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3 font-mono text-xs text-[#0A0A0A]/40">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#0A0A0A]">
                        {r.slug ? (
                          <Link href={`/intelligence/qld-dyjvs/org/${r.slug}`} className="hover:text-[#059669] transition-colors underline decoration-[#0A0A0A]/20 hover:decoration-[#059669]">
                            {r.name}
                          </Link>
                        ) : r.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CONTROL_COLORS[r.controlType]?.badge || 'bg-gray-100 text-gray-700'}`}>
                          {CONTROL_LABELS[r.controlType] || r.controlType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.isIndigenous && <span className="text-purple-600 font-medium">Yes</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{r.contracts}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(r.totalDollars)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{pct(r.totalDollars, totalDyjvsDollars)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0A0A0A] text-white font-medium">
                    <td className="px-4 py-3" colSpan={4}>Top 25 Total</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {topRecipients.reduce((s, r) => s + r.contracts, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {formatDollars(topRecipients.reduce((s, r) => s + r.totalDollars, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {pct(topRecipients.reduce((s, r) => s + r.totalDollars, 0), totalDyjvsDollars)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ====== SECTION 4: WHO GETS THE MONEY ====== */}
        <section>
          <SectionHeader
            id="control"
            icon={<Building2 className="w-6 h-6" />}
            title="Who Gets the Money"
            subtitle="DYJVS contract funding by organisation type."
          />

          <div className="mb-6 rounded-xl overflow-hidden h-10 flex">
            {controlBreakdown.filter(r => r.totalDollars > 0).map(row => {
              const widthPct = controlTotal > 0 ? (row.totalDollars / controlTotal) * 100 : 0;
              if (widthPct < 1) return null;
              return (
                <div
                  key={row.controlType}
                  className={`${CONTROL_COLORS[row.controlType]?.bar || 'bg-gray-300'} flex items-center justify-center text-xs text-white font-mono`}
                  style={{ width: `${widthPct}%` }}
                  title={`${row.label}: ${formatDollars(row.totalDollars)}`}
                >
                  {widthPct > 10 ? `${row.label} ${Math.round(widthPct)}%` : ''}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase">Type</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Total</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Contracts</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">Orgs</th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {controlBreakdown.map((row, i) => (
                    <tr key={row.controlType} className={i % 2 === 0 ? 'bg-[#F5F0E8]/30' : 'bg-white'}>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CONTROL_COLORS[row.controlType]?.badge || 'bg-gray-100 text-gray-700'}`}>
                          {row.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-medium">{formatDollars(row.totalDollars)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.records}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.orgCount}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{pct(row.totalDollars, controlTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <KeyFinding title={`Intermediaries receive ${RESEARCH_DATA.intermediaryRatio}x more than ACCOs`} urgent>
            <p>
              Across the broader QLD system, intermediaries received <strong>${(RESEARCH_DATA.intermediaryTopContracts / 1e6).toFixed(0)}M</strong> in
              top contracts vs <strong>${(RESEARCH_DATA.accoTopContracts / 1e6).toFixed(0)}M</strong> for
              ACCOs. In a system where {RESEARCH_DATA.aihwFirstNationsPctDetained}% of detained young people
              are First Nations, community-controlled organisations receive 3.7% of top contract value.
            </p>
          </KeyFinding>
        </section>

        {/* ====== SECTION 5: EVIDENCE PROFILE ====== */}
        <section>
          <SectionHeader
            id="evidence"
            icon={<BookOpen className="w-6 h-6" />}
            title="Evidence Profile"
            subtitle={`${totalPrograms} QLD programs mapped by evidence level. 631 evidence items across 2,065 links.`}
          />

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="space-y-3">
              {evidenceDistribution.map(row => {
                const widthPct = totalEvidence > 0 ? (row.count / totalEvidence) * 100 : 0;
                return (
                  <div key={row.level} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#0A0A0A] w-28 flex-shrink-0">
                      {row.shortLabel}
                    </span>
                    <div className="flex-1 h-8 bg-[#F5F0E8] rounded overflow-hidden">
                      <div
                        className={`h-full ${EVIDENCE_COLORS[row.level] || 'bg-gray-400'} rounded flex items-center px-2`}
                        style={{ width: `${Math.max(widthPct, 2)}%` }}
                      >
                        <span className="text-xs font-mono text-white font-medium">{row.count}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#0A0A0A]/50 w-12 text-right">
                      {Math.round(widthPct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <KeyFinding title="0 Proven programs in QLD" urgent>
              <p>
                Of {totalPrograms} programs, <strong>zero</strong> have Proven-level evidence. Only{' '}
                <strong>{evidenceDistribution.find(r => r.shortLabel === 'Effective')?.count || 0}</strong> are
                rated Effective. {evidenceDistribution.find(r => r.shortLabel === 'Untested')?.count || 0} remain untested.
                The state is spending $536M/year with almost no evidence base.
              </p>
            </KeyFinding>
            <KeyFinding title={`QAO: ${RESEARCH_DATA.qaoNoEvidence}% of files had no evidence of rehab`} urgent>
              <p>
                The QLD Auditor-General found <strong>{RESEARCH_DATA.qaoNoEvidence}% of sampled case files</strong> had
                no documented evidence rehabilitation was delivered. The department measures outputs, not outcomes.
              </p>
              <p className="mt-2"><SourceLink href="https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime" label="QAO Report 15" /></p>
            </KeyFinding>
          </div>
        </section>

        {/* ====== SECTION 6: RECIDIVISM ====== */}
        <section>
          <SectionHeader
            id="recidivism"
            icon={<AlertTriangle className="w-6 h-6" />}
            title="The Recidivism Crisis"
            subtitle="More spending, worse outcomes. Detention is a crime-production system."
          />

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-4xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.recidivism12mo}%</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-2">Reoffend within 12 months</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-1">QAO Report 15 (up from 64%)</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-4xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.recidivismDetention}%</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-2">Post-detention reoffending</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-1">QFCC (June 2024)</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-4xl font-bold font-mono text-[#0A0A0A]">{RESEARCH_DATA.indigenousOverrep}x</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-2">Indigenous overrepresentation</div>
              <div className="text-xs font-mono text-[#0A0A0A]/30 mt-1">In detention (ROGS 2025)</div>
            </div>
          </div>

          <KeyFinding title="The QFCC studied what happens when kids leave detention" urgent>
            <p>
              The QFCC interviewed <strong>66 young people and 44 workers</strong> inside the system
              (Exiting Youth Detention, June 2024). They found 84-96% reoffending post-detention.
              Young people reported programs inside detention were experienced as compliance requirements,
              not genuine support. The report concluded detention-based rehabilitation is fundamentally ineffective.
            </p>
            <p className="mt-2"><SourceLink href="https://www.qfcc.qld.gov.au/sites/default/files/2024-06/Exiting%20youth%20detention%20report%20June%202024.pdf" label="QFCC Exiting Youth Detention Report" /></p>
          </KeyFinding>
        </section>

        {/* ====== SECTION 7: COMMUNITY VOICES ====== */}
        <section>
          <SectionHeader
            id="voices"
            icon={<Heart className="w-6 h-6" />}
            title="Voices from Community"
            subtitle="The data describes a system. These are the people building the alternatives. All stories from the Empathy Ledger, published with informed consent and cultural authority."
          />

          {/* BG-FIT, Mount Isa */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs text-[#0A0A0A]/40 uppercase tracking-wider">Mount Isa — BG-FIT &amp; DeadlyLabs</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <StoryCard
                quote="When you're at bush, you can be yourself."
                speaker="Brodie Germaine"
                role="Pita Pita & Waka'i man, BG-FIT Founder"
                community="Mount Isa, Kalkadoon Country"
                storyTitle="When You're at Bush, You Can Be Yourself"
              />
              <StoryCard
                quote="Speak from the heart and they will listen."
                speaker="Uncle George Leon"
                role="Kalkadoon Elder"
                community="Mount Isa"
                storyTitle="Speak From the Heart and They Will Listen"
              />
            </div>
            <p className="text-xs text-[#0A0A0A]/50 mt-3 leading-relaxed max-w-3xl">
              BG-FIT runs on-country camps, fitness programs, and cultural mentoring in one of QLD&apos;s
              most challenging youth justice environments. Uncle George provides cultural authority
              that no intermediary can replicate and no contract can purchase. BG-FIT is unfunded by DYJVS.
              <span className="font-mono text-[10px] text-[#0A0A0A]/30 ml-1">3 stories, 5 transcripts in Empathy Ledger</span>
            </p>
          </div>

          {/* PICC, Palm Island */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs text-[#0A0A0A]/40 uppercase tracking-wider">Palm Island — PICC ({RESEARCH_DATA.palmIslandPrograms} programs, 100% Aboriginal-led)</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <StoryCard
                quote="My name is Iris. My parents were born here on Palm Island."
                speaker="Iris"
                role="Community member"
                community="Palm Island"
                storyTitle="The Little Boat Called Ivy May"
              />
              <StoryCard
                quote="I'm a local on Palm Island. I'm Aboriginal."
                speaker="Henry Doyle"
                role="Community member"
                community="Palm Island"
                storyTitle="Just Be There for Them"
              />
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#059669]">
                <p className="text-sm font-bold text-[#0A0A0A] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  &ldquo;Finding a Reason to Get Out of Bed&rdquo;
                </p>
                <p className="text-xs text-[#0A0A0A]/60 leading-relaxed">
                  The Men&apos;s Group on Palm Island — not diversion, not case management, not therapy.
                  Men in community holding each other accountable and present. It costs almost nothing.
                  It cannot be contracted to an intermediary.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Heart className="w-4 h-4 text-[#059669]" />
                  <p className="text-xs text-[#0A0A0A]/50">Palm Island Men&apos;s Group</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#0A0A0A]/50 mt-3 leading-relaxed max-w-3xl">
              PICC demonstrates that Aboriginal communities can design, deliver, and govern comprehensive
              service systems. Uncle Alan (Manbarra Traditional Owner), Uncle Frank, Ruby Sibley, and
              23 community members have shared their stories.
              <span className="font-mono text-[10px] text-[#0A0A0A]/30 ml-1">10 stories, 11 transcripts in Empathy Ledger</span>
            </p>
          </div>

          {/* MMEIC, Minjerribah */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs text-[#0A0A0A]/40 uppercase tracking-wider">Minjerribah (Stradbroke Island) — MMEIC</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#059669]">
              <p className="text-sm text-[#0A0A0A]/70 leading-relaxed mb-3">
                <strong className="text-[#0A0A0A]">Minjerribah Moorgumpin Elders-in-Council</strong> has been running
                Indigenous-led justice and healing on Quandamooka Country for decades — predating the current wave of
                government interest in &ldquo;justice reinvestment.&rdquo; The <strong>Quandamooka Justice and Healing
                Strategy</strong> centres Elders, culture, and Country rather than courts and compliance.
              </p>
              <p className="text-xs text-[#0A0A0A]/50">
                Led by Aunty Evie, Uncle Dale, and Aunty Maureen. Stories include &ldquo;After the Flood,&rdquo;
                &ldquo;The Morning Tide,&rdquo; and &ldquo;Grading Day.&rdquo;
                <span className="font-mono text-[10px] text-[#0A0A0A]/30 ml-1">9 members, 3 stories, 2 transcripts in Empathy Ledger</span>
              </p>
            </div>
          </div>

          <KeyFinding title="What these communities share">
            <p>
              Cultural authority that cannot be outsourced. Programs that don&apos;t fit government categories.
              Persistence without proportional funding. The $536M question is not whether these approaches
              work — the people in these stories are the evidence. The question is why the system sends
              $963M to intermediaries and $36M to the communities doing the work.
            </p>
          </KeyFinding>
        </section>

        {/* ====== SECTION 8: INTERNATIONAL BEST PRACTICE ====== */}
        <section>
          <SectionHeader
            id="international"
            icon={<Globe className="w-6 h-6" />}
            title="What Works Globally"
            subtitle="QLD's approach contradicts 40 years of international evidence. Here's what other jurisdictions have done instead."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <InternationalModel
              country="Scotland"
              model="GIRFEC / Children's Hearings"
              outcome="92% drop in youth prosecutions"
              detail="Children (Care and Justice) Act 2024 ended youth imprisonment entirely. 97% reduction in youth custody sentences since 2008. Welfare-based responses for under-18s."
              source="Scottish Government, Justice for Children 2024-26"
            />
            <InternationalModel
              country="New Zealand"
              model="Rangatahi Courts & Iwi Panels"
              outcome="15% less reoffending"
              detail="Māori-led courts with tikanga process. 64% reduction in young Māori offending over 10 years. 80%+ of iwi panel participants complete their plans. Family Group Conferencing since 1989."
              source="Youth Court of NZ; Walton (2020)"
            />
            <InternationalModel
              country="Canada"
              model="Youth Criminal Justice Act"
              outcome="50%+ drop in youth incarceration"
              detail="Within 6 years of the 2003 Act, youth incarceration halved. Over 90% long-term reduction. No increase in youth crime. Replaced prison with community alternatives."
              source="Justice Canada YCJA Evaluation, 2021"
            />
            <InternationalModel
              country="Spain"
              model="Diagrama Foundation"
              outcome="13.6% recidivism over 6 years"
              detail="Therapeutic community model vs 30-50% in traditional detention. 70%+ transition to education/employment within 6 months. €3.80 return per €1 invested."
              source="Diagrama Foundation evaluation data"
            />
            <InternationalModel
              country="USA (Missouri)"
              model="Missouri Model"
              outcome="24% reincarceration (vs 52% Arizona)"
              detail="Small group homes near community replace large youth prisons. Fewer than 8% go on to adult prison. 85% positively engaged post-release. No extra cost."
              source="Annie E. Casey Foundation"
            />
            <InternationalModel
              country="Australia (NSW)"
              model="Maranguka Justice Reinvestment"
              outcome="42% fewer custody days"
              detail="Aboriginal-led in Bourke. 23% drop in domestic violence, 31% rise in Year 12 retention. $3.1M gross impact on $0.6M cost. KPMG-validated 5:1 return."
              source="JustReinvest NSW; KPMG Assessment"
            />
          </div>

          <div className="bg-[#0A0A0A] rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-2 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The meta-analytic consensus
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Across <strong className="text-white">48 meta-analyses</strong> covering 40 years of research:
              rehabilitation works (OR 1.73 for CBT-based programs), while deterrence-based approaches are
              <strong className="text-white"> slightly harmful</strong> (OR 0.85). This is settled science.
              QLD&apos;s current approach — more detention, harsher bail, breach-based enforcement — contradicts
              the entire evidence base.
            </p>
            <p className="mt-2"><SourceLink href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8196268/" label="PMC: The 40-year debate meta-review" /></p>
          </div>
        </section>

        {/* ====== SECTION 9: WHAT THE SECTOR SAYS ====== */}
        <section>
          <SectionHeader
            id="sector"
            icon={<Megaphone className="w-6 h-6" />}
            title="What the Sector Says"
            subtitle="International bodies, national commissions, peak organisations, and academic research all point the same direction."
          />

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              {
                org: 'UN Special Rapporteurs',
                date: 'May 2025',
                finding: 'Two Special Rapporteurs described QLD laws as "incompatible with basic child rights." Cited detention of children as young as 10, breach of bail laws, and conditions of confinement.',
                url: 'https://www.ohchr.org/en/media-advisories/2025/05/youth-justice-systems-across-australia-crisis-un-experts',
              },
              {
                org: 'Human Rights Watch',
                date: 'May 2025',
                finding: 'Documented children in concrete watch house cells with no natural light (Cairns) and no outdoor exercise (Murgon). Extended watch house stays exceeding legal time limits.',
                url: 'https://www.hrw.org/news/2025/05/26/australia-children-suffering-under-criminal-legal-system',
              },
              {
                org: 'Amnesty International',
                date: '2025',
                finding: '"Adult Crime, Adult Time" legislation violates the Convention on the Rights of the Child. No other developed nation applies adult sentencing to children under 14.',
                url: 'https://www.amnesty.org.au/queensland-governments-adult-crime-adult-time-laws-a-violation-of-childrens-rights/',
              },
              {
                org: 'AHRC',
                date: '2024-25',
                finding: '"Help Way Earlier!" report called for transforming child justice toward safety and wellbeing, away from punitive models. Identified QLD as particularly concerning.',
                url: 'https://humanrights.gov.au/resource-hub/by-resource-type/reports/children-and-youth-rights',
              },
              {
                org: 'Dickson (2025)',
                date: 'Academic paper',
                finding: 'Peer-reviewed critique in Alternative Law Journal: Making Queensland Safer Act is "punitive populism" enacted against overwhelming criminological evidence.',
                url: 'https://journals.sagepub.com/doi/10.1177/1037969X251389162',
              },
              {
                org: 'QFCC Principal Commissioner',
                date: 'January 2026',
                finding: 'Submission on Electronic Monitoring Bill: "does not reduce reoffending and creates false community expectations of safety" while impeding rehabilitation.',
                url: 'https://www.qfcc.qld.gov.au/sites/default/files/2026-01/submission-youth-justice-electronic-monitoring-amendment-bill-2025-principal-commissioner.pdf',
              },
              {
                org: 'QATSICPP',
                date: '2024-25',
                finding: 'Appointed QLD Youth Justice Peak Body (May 2024). Represents 35 community-controlled organisations. Evidence review found 56% of QLD YJ kids had prior child protection contact.',
                url: 'https://coe.qatsicpp.com.au/coe-youth-justice-evidence-review/',
              },
              {
                org: 'Senate Inquiry',
                date: 'Reports June 2026',
                finding: 'Second inquiry into Australia\'s youth justice and incarceration system. Major submissions from ATSILS, Law Council, AHRC, VACCA, NAPCAN. Hearing witnesses described system "in crisis."',
                url: 'https://www.aph.gov.au/Parliamentary_Business/Committees/Senate/Legal_and_Constitutional_Affairs/YouthJustice2025',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.org}</span>
                  <span className="text-[10px] font-mono text-[#0A0A0A]/30">{item.date}</span>
                </div>
                <p className="text-xs text-[#0A0A0A]/60 leading-relaxed">{item.finding}</p>
                <div className="mt-2">
                  <SourceLink href={item.url} label="Source" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== SECTION 10: TRANSPARENCY ====== */}
        <section>
          <SectionHeader
            id="transparency"
            icon={<Eye className="w-6 h-6" />}
            title="Transparency and Accountability"
            subtitle="RTI refusal rates, hidden consultancy spending, and what the ministerial diary shows."
          />

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.rtiRefusedPct}%</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">RTI requests refused</div>
              <div className="text-xs text-[#0A0A0A]/40 mt-2 leading-relaxed">
                Of {RESEARCH_DATA.rtiTotal} non-personal RTI applications to DYJVS. Brisbane Times refused twice.
                Only significant release: a 21.2MB strip search register.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">${(RESEARCH_DATA.consultancyTotal / 1e6).toFixed(1)}M</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">Consultancy (reported as &ldquo;NIL&rdquo;)</div>
              <div className="text-xs text-[#0A0A0A]/40 mt-2 leading-relaxed">
                Annual report says &ldquo;NIL&rdquo; consultancy. Contract disclosures show $1.85M in
                &ldquo;professional services&rdquo; to Nous ($509K), PwC ($211K), Deloitte ($112K).
                1 of 30 contracts was with an Indigenous consultant.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-3xl font-bold font-mono text-[#0A0A0A]">0</div>
              <div className="text-sm text-[#0A0A0A]/60 mt-1">First Nations peak body meetings</div>
              <div className="text-xs text-[#0A0A0A]/40 mt-2 leading-relaxed">
                In 4 months of ministerial diary data (Oct 2025 - Jan 2026), no structured consultation
                with First Nations peak bodies is visible. 20 YJ service orgs had meetings.
              </div>
            </div>
          </div>
        </section>

        {/* ====== SECTION 11: MINISTERIAL ACTIVITY ====== */}
        <section>
          <SectionHeader
            id="ministerial"
            icon={<FileText className="w-6 h-6" />}
            title="Ministerial Activity Timeline"
            subtitle={`${ministerialStatements.length} statements tracked. All mention "restoring safety" and the $560M figure.`}
          />

          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="divide-y divide-[#F5F0E8]">
              {ministerialStatements.slice(0, 10).map((s, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="font-mono text-xs text-[#0A0A0A]/30 w-20 flex-shrink-0 pt-0.5">
                    {formatDate(s.publishedAt)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0A0A0A]">{s.headline}</p>
                    {s.amounts.length > 0 && (
                      <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                        Amounts: {s.amounts.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== SECTION 12: CROSS-SYSTEM PIPELINE ====== */}
        <section>
          <SectionHeader
            id="pipeline"
            icon={<Users className="w-6 h-6" />}
            title="The Cross-System Pipeline"
            subtitle="72.9% of children in youth justice were known to child protection. The pipeline is predictable."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.crossSystemCP}%</div>
              <div className="text-xs text-[#0A0A0A]/50 mt-1">CP contact (all children)</div>
              <div className="text-[10px] font-mono text-[#0A0A0A]/30 mt-0.5">QFCC 2024</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">{RESEARCH_DATA.crossSystemCPFirstNations}%</div>
              <div className="text-xs text-[#0A0A0A]/50 mt-1">CP contact (First Nations)</div>
              <div className="text-[10px] font-mono text-[#0A0A0A]/30 mt-0.5">QFCC 2024</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-3xl font-bold font-mono text-[#DC2626]">~{RESEARCH_DATA.crossSystemMH}%</div>
              <div className="text-xs text-[#0A0A0A]/50 mt-1">Mental health comorbidity</div>
              <div className="text-[10px] font-mono text-[#0A0A0A]/30 mt-0.5">Clinical literature</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-3xl font-bold font-mono text-[#0A0A0A]">~{RESEARCH_DATA.crossSystemDisability}%</div>
              <div className="text-xs text-[#0A0A0A]/50 mt-1">Cognitive disability (est.)</div>
              <div className="text-[10px] font-mono text-[#0A0A0A]/30 mt-0.5">National studies</div>
            </div>
          </div>

          <KeyFinding title="The pipeline is identifiable years in advance" urgent>
            <p>
              <strong>{RESEARCH_DATA.crossSystemCP}%</strong> of children in youth justice had prior child
              protection contact. For First Nations children: <strong>{RESEARCH_DATA.crossSystemCPFirstNations}%</strong>.
              The children who enter youth justice at 14 are, in most cases, already known to the state at 4.
              Community family support at $3-8K/year could prevent the $991K/year detention pathway.
            </p>
            <p className="mt-2"><SourceLink href="https://www.qfcc.qld.gov.au/sites/default/files/2024-11/Crossover%20Cohort%20-%20Data%20Insights.pdf" label="QFCC Crossover Cohort Data Insights, Nov 2024" /></p>
          </KeyFinding>
        </section>

        {/* ====== SECTION 13: DATA GAPS ====== */}
        <section>
          <SectionHeader
            id="gaps"
            icon={<BarChart3 className="w-6 h-6" />}
            title="What We Don&apos;t Know"
            subtitle="Critical data gaps that prevent evidence-based policy."
          />

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { area: 'Program-level reoffending', detail: `No public data on which of ${totalPrograms} programs reduce reoffending. $536M spent with no outcome measurement by program.` },
              { area: 'Intermediary overhead', detail: 'No public data on what % of intermediary funding reaches frontline delivery vs management fees.' },
              { area: 'ACCO vs intermediary outcomes', detail: 'No systematic comparison of outcomes by org type. Would reveal whether the 27:1 funding ratio is justified.' },
              { area: 'Disability crossover', detail: '~40% estimate has no QLD-specific data. No NDIS-youth justice data linkage exists.' },
              { area: 'Kickstarter program outcomes', detail: '41 programs funded, zero independently evaluated. No published evaluation of any individual program.' },
              { area: 'Cultural safety metrics', detail: 'No standardised measure of cultural safety across programs. Cannot compare program quality for First Nations young people.' },
            ].map((gap, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#DC2626] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-[#0A0A0A]">{gap.area}</p>
                    <p className="text-xs text-[#0A0A0A]/50 mt-1">{gap.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#059669]/10 border-2 border-[#059669]/20 rounded-xl p-5">
            <p className="text-sm text-[#0A0A0A]/70">
              <strong className="text-[#0A0A0A]">What JusticeHub has built to fill these gaps:</strong>{' '}
              {totalPrograms} programs mapped with evidence level and cost data. 631 evidence items
              across 2,065 links. {mediaCount} media articles with sentiment scoring. 98,404 organisations
              classified by control type. The missing half is outcome data — which only the department can
              provide or mandate.
            </p>
          </div>
        </section>

        {/* ====== SECTION 14: CONNECTED RESOURCES ====== */}
        <section>
          <SectionHeader
            id="connected"
            icon={<ExternalLink className="w-6 h-6" />}
            title="Connected"
            subtitle="This report is part of a wider intelligence system. Explore the data, the stories, and the organisations."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <ConnectedLink
              href="/intelligence/qld-justice"
              icon={<MapPin className="w-5 h-5 text-[#0A0A0A]/60" />}
              title="QLD Justice Overview"
              description="Full QLD spending by source, top funded orgs, Indigenous org table, governance network"
            />
            <ConnectedLink
              href="/intelligence/national"
              icon={<Globe className="w-5 h-5 text-[#0A0A0A]/60" />}
              title="National Intelligence"
              description="All-Australia evidence overview, state-by-state comparison, cost equation"
            />
            <ConnectedLink
              href="/intelligence/regional/townsville"
              icon={<MapPin className="w-5 h-5 text-[#0A0A0A]/60" />}
              title="Townsville Regional"
              description="Palm Island, PICC, North QLD programs and funding flows"
            />
            <ConnectedLink
              href="/hub"
              icon={<Building2 className="w-5 h-5 text-[#0A0A0A]/60" />}
              title="Organisation Directory"
              description={`${totalOrgs.toLocaleString()} QLD orgs including ${indigenousOrgCount} Indigenous organisations`}
            />
            <ConnectedLink
              href="/for-funders/landscape"
              icon={<DollarSign className="w-5 h-5 text-[#0A0A0A]/60" />}
              title="Funder Landscape"
              description="Portfolio comparison, evidence profiles, and funding allocation analysis"
            />
            <ConnectedLink
              href="/intelligence"
              icon={<BookOpen className="w-5 h-5 text-[#0A0A0A]/60" />}
              title="Intelligence Hub"
              description="All reports, regional deep dives, and the evidence library"
            />
          </div>

          {/* External reports */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              External Reports &amp; Inquiries
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { label: 'Senate Inquiry — Youth Justice (reports June 2026)', url: 'https://www.aph.gov.au/Parliamentary_Business/Committees/Senate/Legal_and_Constitutional_Affairs/YouthJustice2025' },
                { label: 'QFCC Exiting Youth Detention (June 2024)', url: 'https://www.qfcc.qld.gov.au/sites/default/files/2024-06/Exiting%20youth%20detention%20report%20June%202024.pdf' },
                { label: 'QFCC Crossover Cohort Data Insights (Nov 2024)', url: 'https://www.qfcc.qld.gov.au/sites/default/files/2024-11/Crossover%20Cohort%20-%20Data%20Insights.pdf' },
                { label: 'QAO Report 15: Delivering Youth Justice (2024)', url: 'https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime' },
                { label: 'AHRC Help Way Earlier! Report', url: 'https://humanrights.gov.au/resource-hub/by-resource-type/reports/children-and-youth-rights' },
                { label: 'AIHW Youth Justice in Australia 2023-24', url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/state-and-territory-overviews/queensland' },
                { label: 'ROGS 2025 Youth Justice', url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/' },
                { label: 'Closing the Gap Target 11 Dashboard', url: 'https://www.closingthegap.gov.au/national-agreement/targets' },
                { label: 'QATSICPP Evidence Review', url: 'https://coe.qatsicpp.com.au/coe-youth-justice-evidence-review/' },
                { label: 'ATSILS Senate Inquiry Submission', url: 'https://atsils.org.au/wp-content/uploads/2026/02/Submission-2025-Senate-Inquiry-No.-2-into-Australias-YJ-and-Incarceration-system-Upload-Version.pdf' },
                { label: 'Maranguka Justice Reinvestment (KPMG)', url: 'https://www.justreinvest.org.au/community/bourke-maranguka/' },
                { label: 'Dickson (2025) Punitive Populism — Alt Law Journal', url: 'https://journals.sagepub.com/doi/10.1177/1037969X251389162' },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors p-2 rounded-lg hover:bg-[#F5F0E8]"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Media coverage */}
          {mediaArticles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-sm font-bold text-[#0A0A0A] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Media Coverage — {mediaCount} articles tracked
              </h3>
              <div className="flex gap-3 mb-4">
                {[
                  { label: 'Negative', count: sentimentCounts['negative'] || 0, color: 'bg-[#DC2626]' },
                  { label: 'Neutral', count: sentimentCounts['neutral'] || 0, color: 'bg-[#0A0A0A]' },
                  { label: 'Positive', count: sentimentCounts['positive'] || 0, color: 'bg-[#059669]' },
                  { label: 'Mixed', count: sentimentCounts['mixed'] || 0, color: 'bg-amber-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${s.color}`} />
                    <span className="text-xs text-[#0A0A0A]/50">{s.label}: {s.count}</span>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-[#F5F0E8]">
                {mediaArticles.slice(0, 8).map((article: any, i: number) => (
                  <div key={i} className="py-2 flex items-start gap-2">
                    <span className="font-mono text-[10px] text-[#0A0A0A]/30 w-16 flex-shrink-0 pt-0.5">
                      {article.published_date ? formatDate(article.published_date) : ''}
                    </span>
                    <div className="flex-1 min-w-0">
                      {article.url ? (
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0A0A0A] hover:text-[#059669] transition-colors line-clamp-1">
                          {article.headline}
                        </a>
                      ) : (
                        <span className="text-xs text-[#0A0A0A] line-clamp-1">{article.headline}</span>
                      )}
                      <span className="text-[10px] text-[#0A0A0A]/30 ml-1">{article.source_name}</span>
                    </div>
                    {article.sentiment && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        article.sentiment === 'negative' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                        article.sentiment === 'positive' ? 'bg-[#059669]/10 text-[#059669]' :
                        'bg-[#0A0A0A]/5 text-[#0A0A0A]/40'
                      }`}>
                        {article.sentiment}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ====== BOTTOM LINE ====== */}
        <section className="pb-8">
          <div className="bg-[#0A0A0A] rounded-xl p-8 text-white">
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The Bottom Line
            </h2>
            <div className="space-y-4 text-white/80 text-sm leading-relaxed max-w-3xl">
              <p>
                Queensland spends <strong className="text-white">$536 million per year</strong> on youth
                justice. <strong className="text-[#DC2626]">90% of detained children are unsentenced.</strong>{' '}
                Reoffending is <strong className="text-white">going up, not down</strong>.
                Post-detention reoffending is <strong className="text-white">84-96%</strong>.
              </p>
              <p>
                Scotland has ended youth imprisonment entirely. Canada halved youth incarceration with
                no crime increase. New Zealand&apos;s Rangatahi Courts reduced Māori reoffending. Maranguka
                in Bourke delivered a 5:1 return on Aboriginal-led justice reinvestment.
              </p>
              <p>
                In Queensland, intermediaries receive <strong className="text-white">27x more funding</strong> than
                the communities doing the work. Palm Island runs 21 programs, 100% Aboriginal-led.
                BG-FIT in Mount Isa runs on community energy. MMEIC on Minjerribah has been doing
                justice reinvestment for decades.
              </p>
              <p>
                The question is not whether alternatives exist. It&apos;s why QLD continues
                to invest in a system that every piece of evidence says doesn&apos;t work.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs font-mono text-white/30 mb-4">EXPLORE THE DATA</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/intelligence/qld-justice"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  QLD Overview <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/intelligence/national"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  National Intelligence <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/hub"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Organisation Directory <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/for-funders/landscape"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Funder Landscape <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <p className="text-xs text-white/20 mt-6 font-mono leading-relaxed">
              Data: ROGS 2025, AIHW 2023-24 &amp; 2025, QAO Report 15, QFCC (Crossover Cohort, Exiting Detention,
              EM Bill), QLD Contract Disclosure, Ministerial Diary, Senate Inquiry, UN OHCHR, HRW, Amnesty.
              Stories: Empathy Ledger (published with informed consent and cultural authority).
              Built by JusticeHub. Senate inquiry reports June 2026.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
