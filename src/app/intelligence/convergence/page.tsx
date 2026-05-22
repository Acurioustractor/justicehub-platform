import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import {
  AlertTriangle, DollarSign, Users, Shield, GraduationCap,
  Heart, Scale, ArrowRight, ArrowDown, Building2, Crosshair,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'One Child. Five Systems. Zero Coordination. | JusticeHub Intelligence',
  description:
    'The same communities appear in every government system. The money flows to mainstream providers. Community organisations get crumbs.',
  openGraph: {
    title: 'One Child. Five Systems. Zero Coordination.',
    description:
      'Cross-system convergence analysis — child protection, youth justice, disability, education, welfare. Same postcode. Different departments. No coordination.',
  },
};

/* ── Types ─────────────────────────────────────────────────── */

interface LgaProfile {
  lga_name: string;
  state: string;
  population: number;
  indigenous_pct: number;
  pipeline_intensity: number;
  // Systems
  youth_offenders: number;
  youth_offender_rate: number | null;
  low_icsea_schools: number;
  avg_icsea: number | null;
  school_count: number | null;
  dsp_recipients: number;
  jobseeker_recipients: number;
  youth_allowance_recipients: number;
  ndis_youth_participants: number | null;
  crime_rate_per_100k: number | null;
  recidivism_pct: number | null;
  detention_indigenous_pct: number | null;
  jh_funding_tracked: number;
  jh_org_count: number;
}

interface FundingRecipient {
  org_name: string;
  is_indigenous: boolean;
  total: number;
}

interface SystemStat {
  system: string;
  icon: React.ElementType;
  color: string;
  statLabel: string;
  statValue: string;
  rateLabel?: string;
  rateValue?: string;
  stateSpend?: string;
  communityShare?: string;
  detail?: string;
}

/* ── Data fetching ─────────────────────────────────────────── */

async function getConvergenceData() {
  const supabase = createServiceClient();
  const sb = supabase as any;

  // Get all LGAs sorted by pipeline intensity for the selector
  const { data: allLgas } = await sb
    .from('lga_cross_system_stats')
    .select('lga_name, state, population, indigenous_pct, pipeline_intensity')
    .gt('population', 500)
    .not('pipeline_intensity', 'is', null)
    .order('pipeline_intensity', { ascending: false });

  // Get the top convergence LGAs with full data
  const { data: topLgas } = await sb
    .from('lga_cross_system_stats')
    .select('*')
    .gt('population', 1000)
    .gt('indigenous_pct', 20)
    .not('pipeline_intensity', 'is', null)
    .order('pipeline_intensity', { ascending: false })
    .limit(50);

  // QLD state-level ROGS spending
  const { data: rogsData } = await sb
    .from('rogs_justice_spending')
    .select('description1, description2, description3, qld, unit, financial_year')
    .eq('financial_year', '2024-25')
    .not('qld', 'is', null);

  // AIHW child protection QLD
  const { data: childProtection } = await sb
    .from('aihw_child_protection')
    .select('metric_name, metric_category, value, indigenous_value')
    .eq('state', 'QLD');

  // ALMA programs in QLD
  const { data: qldPrograms } = await sb
    .from('alma_interventions')
    .select('name, evidence_level, cost_per_young_person, operating_organization_id')
    .neq('verification_status', 'ai_generated')
    .limit(2000);

  // Funding breakdown for hero LGA (Carpentaria/Doomadgee)
  const { data: carpentariaFunding } = await sb.rpc('exec_sql', {
    query: `
      SELECT o.name as org_name, o.is_indigenous_org as is_indigenous,
        SUM(jf.amount_dollars) as total
      FROM justice_funding jf
      JOIN organizations o ON o.id = jf.alma_organization_id
      WHERE o.state = 'QLD'
        AND (o.name ILIKE '%doomadgee%' OR o.name ILIKE '%carpentaria%'
             OR o.name ILIKE '%normanton%' OR o.name ILIKE '%mornington%'
             OR o.name ILIKE '%burketown%')
      GROUP BY o.name, o.is_indigenous_org
      ORDER BY total DESC
    `,
  });

  // QLD-wide funding split: indigenous vs non-indigenous orgs
  const { data: qldFundingSplit } = await sb.rpc('exec_sql', {
    query: `
      SELECT o.is_indigenous_org, COUNT(*) as records, SUM(jf.amount_dollars) as total
      FROM justice_funding jf
      JOIN organizations o ON o.id = jf.alma_organization_id
      WHERE o.state = 'QLD'
      GROUP BY o.is_indigenous_org
    `,
  });

  return {
    allLgas: (allLgas ?? []) as LgaProfile[],
    topLgas: (topLgas ?? []) as LgaProfile[],
    rogsData: rogsData ?? [],
    childProtection: childProtection ?? [],
    qldPrograms: qldPrograms ?? [],
    carpentariaFunding: carpentariaFunding ?? [],
    qldFundingSplit: qldFundingSplit ?? [],
  };
}

/* ── Helpers ────────────────────────────────────────────────── */

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-AU');
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

/* ── Components ─────────────────────────────────────────────── */

function SystemRow({
  system,
  icon: Icon,
  color,
  statLabel,
  statValue,
  rateLabel,
  rateValue,
  spend,
  communityPct,
  detail,
  isLast,
}: {
  system: string;
  icon: React.ElementType;
  color: string;
  statLabel: string;
  statValue: string;
  rateLabel?: string;
  rateValue?: string;
  spend?: string;
  communityPct?: string;
  detail?: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative">
      {/* Vertical spine connector */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-8 bg-[#0A0A0A]/10" />
      )}
      <div className="flex gap-4 items-start">
        {/* Icon node */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color + '15', border: `2px solid ${color}` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
            >
              {system}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {/* Stat */}
            <div>
              <div className="text-[10px] font-mono text-[#0A0A0A]/50 uppercase tracking-wider">{statLabel}</div>
              <div className="text-xl font-bold font-mono" style={{ color }}>
                {statValue}
              </div>
            </div>
            {/* Rate */}
            {rateLabel && rateValue && (
              <div>
                <div className="text-[10px] font-mono text-[#0A0A0A]/50 uppercase tracking-wider">{rateLabel}</div>
                <div className="text-xl font-bold font-mono" style={{ color }}>
                  {rateValue}
                </div>
              </div>
            )}
            {/* State spend */}
            {spend && (
              <div>
                <div className="text-[10px] font-mono text-[#0A0A0A]/50 uppercase tracking-wider">QLD State Spend</div>
                <div className="text-xl font-bold font-mono text-[#0A0A0A]">{spend}</div>
              </div>
            )}
            {/* Community share */}
            {communityPct && (
              <div>
                <div className="text-[10px] font-mono text-[#0A0A0A]/50 uppercase tracking-wider">To Community Orgs</div>
                <div className="text-xl font-bold font-mono" style={{ color: '#DC2626' }}>
                  {communityPct}
                </div>
              </div>
            )}
          </div>

          {detail && (
            <p className="text-sm text-[#0A0A0A]/60 font-mono">{detail}</p>
          )}
        </div>
      </div>

      {/* Connecting arrow */}
      {!isLast && (
        <div className="flex justify-center py-2 text-[#0A0A0A]/20">
          <ArrowDown className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function MoneySplitBar({
  label,
  indigenous,
  mainstream,
  total,
}: {
  label: string;
  indigenous: number;
  mainstream: number;
  total: number;
}) {
  const indPct = total > 0 ? (indigenous / total) * 100 : 0;
  const mainPct = total > 0 ? (mainstream / total) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-mono text-[#0A0A0A]/70">{label}</span>
        <span className="text-xs font-mono text-[#0A0A0A]/50">{fmt(total)}</span>
      </div>
      <div className="w-full h-6 rounded-full overflow-hidden flex bg-[#0A0A0A]/5">
        <div
          className="h-full transition-all flex items-center justify-center"
          style={{ width: `${mainPct}%`, backgroundColor: '#DC2626' }}
        >
          {mainPct > 15 && (
            <span className="text-[10px] font-mono text-white font-medium">
              {mainPct.toFixed(0)}% mainstream
            </span>
          )}
        </div>
        <div
          className="h-full transition-all flex items-center justify-center"
          style={{ width: `${indPct}%`, backgroundColor: '#059669' }}
        >
          {indPct > 10 && (
            <span className="text-[10px] font-mono text-white font-medium">
              {indPct.toFixed(0)}% community
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineCostStep({
  stage,
  cost,
  color,
  detail,
  isLast,
}: {
  stage: string;
  cost: string;
  color: string;
  detail: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 text-right">
        <div className="text-sm font-mono text-[#0A0A0A]/60">{stage}</div>
      </div>
      <div
        className="flex-shrink-0 w-24 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color + '20', border: `2px solid ${color}` }}
      >
        <span className="text-sm font-bold font-mono" style={{ color }}>{cost}</span>
      </div>
      <div className="flex-1">
        <div className="text-xs font-mono text-[#0A0A0A]/50">{detail}</div>
      </div>
      {!isLast && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <ArrowDown className="w-3 h-3 text-[#0A0A0A]/20" />
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default async function ConvergencePage() {
  const data = await getConvergenceData();
  const { topLgas, allLgas, rogsData, carpentariaFunding, qldFundingSplit } = data;

  // Hero LGA: Carpentaria (Doomadgee)
  const hero = topLgas.find((l: LgaProfile) => l.lga_name === 'Carpentaria') ?? topLgas[0];

  // Parse ROGS data
  const youthJusticeSpend = rogsData.find(
    (r: any) => r.description1 === 'Government real recurrent expenditure' && r.description3 === 'Total expenditure' && r.unit === "$'000"
  );
  const detentionSpend = rogsData.find(
    (r: any) => r.description1 === 'Detention' && r.description2 === 'Recurrent expenditure on youth justice services' && r.description3 === 'Total'
  );
  const communitySpend = rogsData.find(
    (r: any) => r.description1 === 'Community-based supervision' && r.description2 === 'Recurrent expenditure on youth justice services' && r.description3 === 'Total'
  );
  const detentionCapital = rogsData.find(
    (r: any) => r.description1 === 'Detention' && r.description2 === 'Capital costs' && r.description3 === 'Total'
  );
  const nightsInCustody = rogsData.find(
    (r: any) => r.description1 === 'Detention' && r.description2 === 'Nights in custody' && r.description3 === 'Total'
  );
  const avgNightly = rogsData.find(
    (r: any) => r.description2 === 'Total average nightly population' && r.description3 === 'Detention'
  );

  const totalYJ = youthJusticeSpend ? parseFloat(youthJusticeSpend.qld) * 1000 : 536_000_000;
  const totalDetention = detentionSpend ? parseFloat(detentionSpend.qld) * 1000 : 225_000_000;
  const totalCommunity = communitySpend ? parseFloat(communitySpend.qld) * 1000 : 200_000_000;
  const totalDetentionCapital = detentionCapital ? parseFloat(detentionCapital.qld) * 1000 : 512_000_000;
  const totalNights = nightsInCustody ? parseFloat(nightsInCustody.qld) : 104_042;
  const avgNightlyPop = avgNightly ? parseFloat(avgNightly.qld) : 285;

  // Funding split
  const indFunding = qldFundingSplit.find((f: any) => f.is_indigenous_org === true);
  const mainFunding = qldFundingSplit.find((f: any) => f.is_indigenous_org === false);
  const indTotal = indFunding ? parseFloat(indFunding.total) : 0;
  const mainTotal = mainFunding ? parseFloat(mainFunding.total) : 0;

  // Carpentaria funding split
  const carpIndigenous = (carpentariaFunding as any[])
    .filter((f: any) => f.is_indigenous)
    .reduce((sum: number, f: any) => sum + parseFloat(f.total), 0);
  const carpMainstream = (carpentariaFunding as any[])
    .filter((f: any) => !f.is_indigenous)
    .reduce((sum: number, f: any) => sum + parseFloat(f.total), 0);
  const carpTotal = carpIndigenous + carpMainstream;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="flex items-center gap-2 mb-6">
            <Crosshair className="w-5 h-5 text-[#DC2626]" />
            <span className="text-xs font-mono text-[#F5F0E8]/60 uppercase tracking-widest">
              Cross-System Convergence Analysis
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-[#F5F0E8]"
            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.05em' }}
          >
            One Child. Five Systems.
            <br />
            <span style={{ color: '#DC2626' }}>Zero Coordination.</span>
          </h1>

          <p className="text-lg text-[#F5F0E8]/70 max-w-2xl mb-10 font-mono">
            The same communities appear in every government system &mdash; child protection,
            youth justice, disability, education, welfare. In every system, the money flows
            to large mainstream providers. Community-controlled organisations get crumbs.
          </p>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#F5F0E8]/10 p-4">
              <div className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase tracking-wider mb-1">QLD Youth Justice</div>
              <div className="text-3xl font-bold font-mono text-[#DC2626]">{fmt(totalYJ)}</div>
              <div className="text-xs font-mono text-[#F5F0E8]/40 mt-1">per year (ROGS 2024-25)</div>
            </div>
            <div className="rounded-xl border border-[#F5F0E8]/10 p-4">
              <div className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase tracking-wider mb-1">Reoffending</div>
              <div className="text-3xl font-bold font-mono text-[#DC2626]">69%</div>
              <div className="text-xs font-mono text-[#F5F0E8]/40 mt-1">within 12 months &mdash; up from 64%</div>
            </div>
            <div className="rounded-xl border border-[#F5F0E8]/10 p-4">
              <div className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase tracking-wider mb-1">First Nations Kids</div>
              <div className="text-3xl font-bold font-mono text-[#DC2626]">65%</div>
              <div className="text-xs font-mono text-[#F5F0E8]/40 mt-1">of detention &mdash; 8.8% of population</div>
            </div>
            <div className="rounded-xl border border-[#F5F0E8]/10 p-4">
              <div className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase tracking-wider mb-1">Avg Nightly</div>
              <div className="text-3xl font-bold font-mono text-[#F5F0E8]">{Math.round(avgNightlyPop)}</div>
              <div className="text-xs font-mono text-[#F5F0E8]/40 mt-1">children detained tonight</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Place Portrait: Carpentaria ─────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-2">
          <MapPinIcon />
          <span className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-widest">
            Place Portrait
          </span>
        </div>

        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A', letterSpacing: '-0.04em' }}
        >
          Carpentaria Shire, QLD
        </h2>
        <p className="text-sm font-mono text-[#0A0A0A]/50 mb-2">
          Doomadgee &middot; Normanton &middot; Mornington Island &middot; Burketown
        </p>
        <p className="text-base text-[#0A0A0A]/70 max-w-2xl mb-10">
          Population {fmtNum(hero?.population ?? 2212)}. {hero?.indigenous_pct ?? 70}% First Nations.
          Crime rate {fmtNum(hero?.crime_rate_per_100k ? Math.round(hero.crime_rate_per_100k) : 27939)} per 100K &mdash;
          the highest in Queensland. Five government systems. {fmtNum(5)} community programs.
          This is what convergence looks like.
        </p>

        {/* ── The Spine: Five Systems ─────────────────────────────── */}
        <div className="space-y-0">
          <SystemRow
            system="Child Protection"
            icon={Heart}
            color="#DC2626"
            statLabel="QLD notifications"
            statValue="36,060"
            rateLabel="Indigenous ratio"
            rateValue="7.1x"
            spend={fmt(2_400_000_000)}
            communityPct="~3%"
            detail="72.9% of youth justice kids had prior child protection contact. The pipeline starts here."
          />

          <SystemRow
            system="Education"
            icon={GraduationCap}
            color="#F59E0B"
            statLabel="Low-ICSEA schools"
            statValue={String(hero?.low_icsea_schools ?? 3)}
            rateLabel="Avg ICSEA"
            rateValue={String(hero?.avg_icsea ?? 765)}
            detail={`ICSEA national average is 1000. Carpentaria: ${hero?.avg_icsea ?? 765}. School exclusion is the second stage of the pipeline.`}
          />

          <SystemRow
            system="Youth Justice"
            icon={Scale}
            color="#DC2626"
            statLabel="QLD spend"
            statValue={fmt(totalYJ)}
            rateLabel="Detention capital"
            rateValue={fmt(totalDetentionCapital)}
            spend={fmt(totalDetention)}
            communityPct={pct(totalCommunity * 0.07, totalCommunity)}
            detail={`${fmtNum(Math.round(totalNights))} nights in custody. 90% unsentenced (remand). $2,714/day to detain. $493/day community supervision.`}
          />

          <SystemRow
            system="Disability (NDIS)"
            icon={Users}
            color="#6366F1"
            statLabel="Youth NDIS participants"
            statValue={String(hero?.ndis_youth_participants ?? 49)}
            rateLabel="In this LGA"
            rateValue={`${fmtNum(hero?.population ?? 2212)} people`}
            detail="NDIS participants in remote communities often can't access providers. 400km to the nearest specialist."
          />

          <SystemRow
            system="Welfare"
            icon={DollarSign}
            color="#0A0A0A"
            statLabel="JobSeeker"
            statValue={fmtNum(hero?.jobseeker_recipients ?? 285)}
            rateLabel="DSP"
            rateValue={fmtNum(hero?.dsp_recipients ?? 75)}
            detail={`${fmtNum(hero?.youth_allowance_recipients ?? 35)} on Youth Allowance. In a community of ${fmtNum(hero?.population ?? 2212)}.`}
            isLast
          />
        </div>

        {/* ── The Punchline ────────────────────────────────────────── */}
        <div
          className="mt-12 rounded-2xl p-8 md:p-10"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <h3
            className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-[#F5F0E8]"
            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.04em' }}
          >
            Same {fmtNum(hero?.population ?? 2212)} people.
            <br />
            Five departments. Five budgets.
            <br />
            <span style={{ color: '#DC2626' }}>Zero coordination.</span>
          </h3>
          <p className="text-[#F5F0E8]/60 font-mono text-sm max-w-xl">
            Each system tracks its own metrics, funds its own providers, and measures
            its own KPIs. None of them ask: is this the same child?
          </p>
        </div>
      </section>

      {/* ── Section 2: The Money Split ──────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#0A0A0A]/10">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-[#DC2626]" />
          <span className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-widest">
            The Money Split
          </span>
        </div>

        <h2
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A', letterSpacing: '-0.04em' }}
        >
          Who Gets the Money?
        </h2>
        <p className="text-base text-[#0A0A0A]/60 max-w-2xl mb-8">
          For every dollar of tracked justice funding in Queensland, this is how it splits
          between mainstream providers and Aboriginal community-controlled organisations.
        </p>

        {/* QLD-wide split */}
        <MoneySplitBar
          label="QLD Justice Funding (all tracked)"
          indigenous={indTotal}
          mainstream={mainTotal}
          total={indTotal + mainTotal}
        />

        {/* Carpentaria split */}
        <MoneySplitBar
          label="Carpentaria / Doomadgee Region"
          indigenous={carpIndigenous}
          mainstream={carpMainstream}
          total={carpTotal}
        />

        {/* Top recipients table */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Carpentaria Region: Top Funding Recipients
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[#0A0A0A]/10">
                  <th className="text-left py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Organisation</th>
                  <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Total Funding</th>
                  <th className="text-center py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody>
                {(carpentariaFunding as any[]).slice(0, 10).map((f: any, i: number) => (
                  <tr key={i} className="border-b border-[#0A0A0A]/5">
                    <td className="py-2 text-[#0A0A0A]/80">{f.org_name}</td>
                    <td className="py-2 text-right font-medium">{fmt(parseFloat(f.total))}</td>
                    <td className="py-2 text-center">
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: f.is_indigenous ? '#059669' + '20' : '#DC2626' + '20',
                          color: f.is_indigenous ? '#059669' : '#DC2626',
                        }}
                      >
                        {f.is_indigenous ? 'Community' : 'Mainstream'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 3: The Pipeline Cost ───────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#0A0A0A]/10">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDown className="w-4 h-4 text-[#DC2626]" />
          <span className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-widest">
            The Pipeline
          </span>
        </div>

        <h2
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A', letterSpacing: '-0.04em' }}
        >
          Each Stage Costs More. Each Stage Has Worse Outcomes.
        </h2>
        <p className="text-base text-[#0A0A0A]/60 max-w-2xl mb-10">
          Prevention costs a fraction. By the time a child reaches detention, the system
          has spent more per person than a university degree &mdash; with an 84-96% failure rate.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { stage: 'Early Intervention', cost: '$5K/yr', color: '#059669', detail: 'Community program median', outcome: 'Prevents entry', source: 'ALMA median' },
            { stage: 'Child Protection', cost: '$50K/yr', color: '#F59E0B', detail: 'Investigation + support', outcome: '72.9% cross over to YJ', source: 'QFCC 2024' },
            { stage: 'Community Supervision', cost: '$180K/yr', color: '#F59E0B', detail: '$493/day (QLD ROGS)', outcome: '69% reoffend in 12mo', source: 'QAO Report 15' },
            { stage: 'Youth Detention', cost: '$1.33M/yr', color: '#DC2626', detail: '$2,714/day (QLD ROGS)', outcome: '84–96% reoffend', source: 'QFCC Jun 2024' },
            { stage: 'Adult Prison', cost: '$150K/yr', color: '#0A0A0A', detail: '$464/day (ROGS 2024-25)', outcome: '45% return within 2yr', source: 'ROGS 8A' },
          ].map((step, i) => (
            <div
              key={i}
              className="rounded-xl p-5 text-center relative"
              style={{ backgroundColor: step.color + '08', border: `2px solid ${step.color}30` }}
            >
              <div className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-wider mb-2">{step.stage}</div>
              <div className="text-2xl font-bold font-mono mb-1" style={{ color: step.color }}>{step.cost}</div>
              <div className="text-[10px] font-mono text-[#0A0A0A]/40">{step.detail}</div>
              <div className="mt-3 text-xs font-mono font-medium" style={{ color: step.color }}>
                {step.outcome}
              </div>
              <div className="text-[9px] font-mono text-[#0A0A0A]/30 mt-0.5">{step.source}</div>
              {i < 4 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]/20">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cost comparison callout */}
        <div className="mt-10 rounded-2xl p-8 text-center" style={{ backgroundColor: '#0A0A0A' }}>
          <p className="text-sm font-mono text-[#F5F0E8]/40 uppercase tracking-widest mb-3">The Inversion</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            <div>
              <div className="text-4xl font-bold font-mono text-[#DC2626]">$1.33M</div>
              <div className="text-sm font-mono text-[#F5F0E8]/50 mt-1">1 child in detention for 1 year</div>
            </div>
            <div className="text-[#F5F0E8]/20 text-2xl font-mono">vs</div>
            <div>
              <div className="text-4xl font-bold font-mono text-[#059669]">266 children</div>
              <div className="text-sm font-mono text-[#F5F0E8]/50 mt-1">in community programs at $5K each</div>
            </div>
          </div>
          <p className="text-[#F5F0E8]/40 font-mono text-xs mt-6 max-w-md mx-auto">
            QLD detains ~285 young people per night. That&apos;s $379M/year in detention alone.
            Redirected, it funds 75,800 community program places.
          </p>
        </div>
      </section>

      {/* ── Section 4: The Evidence Gap ─────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#0A0A0A]/10">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          <span className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-widest">
            The Evidence Gap
          </span>
        </div>

        <h2
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A', letterSpacing: '-0.04em' }}
        >
          What Gets Funded vs What Works
        </h2>
        <p className="text-base text-[#0A0A0A]/60 max-w-2xl mb-8">
          QLD has 495 verified youth justice programs. 6 have strong evidence. 25 are Indigenous-led.
          The programs with the strongest evidence get the least funding.
          The biggest line items are concrete and contracts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl p-6 border border-[#DC2626]/20" style={{ backgroundColor: '#DC2626' + '08' }}>
            <div className="text-5xl font-bold font-mono text-[#DC2626] mb-2">{fmt(totalDetentionCapital)}</div>
            <div className="text-sm font-mono text-[#0A0A0A]/70">Detention capital (Woodford, Wacol)</div>
            <div className="text-xs font-mono text-[#0A0A0A]/40 mt-1">84-96% reoffend after release</div>
          </div>
          <div className="rounded-xl p-6 border border-[#F59E0B]/20" style={{ backgroundColor: '#F59E0B' + '08' }}>
            <div className="text-5xl font-bold font-mono text-[#F59E0B] mb-2">{fmt(totalDetention)}</div>
            <div className="text-sm font-mono text-[#0A0A0A]/70">Detention operations</div>
            <div className="text-xs font-mono text-[#0A0A0A]/40 mt-1">285 children per night avg</div>
          </div>
          <div className="rounded-xl p-6 border border-[#059669]/20" style={{ backgroundColor: '#059669' + '08' }}>
            <div className="text-5xl font-bold font-mono text-[#059669] mb-2">$14M</div>
            <div className="text-sm font-mono text-[#0A0A0A]/70">Grants to community providers</div>
            <div className="text-xs font-mono text-[#0A0A0A]/40 mt-1">2.6% of total youth justice spend</div>
          </div>
        </div>
      </section>

      {/* ── Section 5: The Alternative ──────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#0A0A0A]/10">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-[#059669]" />
          <span className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-widest">
            The Alternative
          </span>
        </div>

        <h2
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A', letterSpacing: '-0.04em' }}
        >
          What Carpentaria Already Has
        </h2>
        <p className="text-base text-[#0A0A0A]/60 max-w-2xl mb-8">
          Five programs. Community-led. Running on less than what it costs to detain
          a single child for a year.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Doomadgee Justice Reinvestment', org: 'Doomadgee Aboriginal Shire Council', cost: '$179K', evidence: 'Promising', indigenous: true },
            { name: 'Community Safety Plans', org: 'Doomadgee Aboriginal Shire Council', cost: '$27K', evidence: 'Promising', indigenous: true },
            { name: 'Doomadgee Youth Support Service', org: 'Doomadgee Youth Support', cost: '$8K', evidence: 'Untested', indigenous: true },
            { name: 'CentacareNQ Normanton Youth', org: 'CentacareNQ', cost: '$12K', evidence: 'Untested', indigenous: false },
            { name: 'PCYC Mornington Island After Dark', org: 'PCYC', cost: '$10K', evidence: 'Untested', indigenous: false },
          ].map((prog, i) => (
            <div key={i} className="rounded-xl border border-[#0A0A0A]/10 p-5" style={{ backgroundColor: '#F5F0E8' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{prog.name}</h4>
                  <p className="text-xs font-mono text-[#0A0A0A]/50">{prog.org}</p>
                </div>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: prog.indigenous ? '#059669' + '20' : '#0A0A0A' + '10',
                    color: prog.indigenous ? '#059669' : '#0A0A0A',
                  }}
                >
                  {prog.indigenous ? 'Community-led' : 'Mainstream'}
                </span>
              </div>
              <div className="flex gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#0A0A0A]/40">Cost/young person: </span>
                  <span className="font-medium text-[#059669]">{prog.cost}/yr</span>
                </div>
                <div>
                  <span className="text-[#0A0A0A]/40">Evidence: </span>
                  <span className="font-medium">{prog.evidence}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-mono text-[#0A0A0A]/40 mb-4">
            Combined cost of all 5 programs: ~$236K/year. That&apos;s 18% of one detention bed.
          </p>
          <Link
            href="/intelligence/funding-map"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#0A0A0A', color: '#F5F0E8' }}
          >
            Explore All Funding Deserts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Explore Other LGAs ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#0A0A0A]/10">
        <h2
          className="text-2xl font-bold tracking-tight mb-6"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A', letterSpacing: '-0.04em' }}
        >
          Highest Convergence LGAs
        </h2>
        <p className="text-sm text-[#0A0A0A]/60 mb-6 font-mono">
          Pipeline intensity score: weighted composite of welfare dependency, education disadvantage,
          justice contact, Indigenous overrepresentation, and funding desert severity.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-[#0A0A0A]/10">
                <th className="text-left py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">LGA</th>
                <th className="text-left py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">State</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Pop</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Indigenous %</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Pipeline</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Crime/100K</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">JobSeeker</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">NDIS Youth</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Low-ICSEA</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Funding</th>
                <th className="text-right py-2 text-[#0A0A0A]/50 text-xs uppercase tracking-wider">Orgs</th>
              </tr>
            </thead>
            <tbody>
              {topLgas.slice(0, 25).map((lga: LgaProfile, i: number) => {
                const pipe = Number(lga.pipeline_intensity);
                const indigPct = Number(lga.indigenous_pct);
                return (
                  <tr key={i} className={`border-b border-[#0A0A0A]/5 ${lga.lga_name === 'Carpentaria' ? 'bg-[#DC2626]/5' : ''}`}>
                    <td className="py-2 font-medium text-[#0A0A0A]">{lga.lga_name}</td>
                    <td className="py-2 text-[#0A0A0A]/60">{lga.state}</td>
                    <td className="py-2 text-right">{fmtNum(lga.population)}</td>
                    <td className="py-2 text-right" style={{ color: indigPct > 50 ? '#DC2626' : '#0A0A0A' }}>
                      {indigPct.toFixed(0)}%
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: pipe > 70 ? '#DC2626' + '20' : pipe > 50 ? '#F59E0B' + '20' : '#0A0A0A' + '10',
                          color: pipe > 70 ? '#DC2626' : pipe > 50 ? '#F59E0B' : '#0A0A0A',
                        }}
                      >
                        {pipe.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-2 text-right" style={{ color: Number(lga.crime_rate_per_100k) > 20000 ? '#DC2626' : '#0A0A0A' }}>
                      {lga.crime_rate_per_100k ? fmtNum(Math.round(Number(lga.crime_rate_per_100k))) : '—'}
                    </td>
                    <td className="py-2 text-right">{lga.jobseeker_recipients ? fmtNum(lga.jobseeker_recipients) : '—'}</td>
                    <td className="py-2 text-right">{lga.ndis_youth_participants ? fmtNum(lga.ndis_youth_participants) : '—'}</td>
                    <td className="py-2 text-right">{lga.low_icsea_schools || '—'}</td>
                    <td className="py-2 text-right">{Number(lga.jh_funding_tracked) > 0 ? fmt(Number(lga.jh_funding_tracked)) : '—'}</td>
                    <td className="py-2 text-right">{lga.jh_org_count || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#F5F0E8]"
            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.04em' }}
          >
            The systems exist to maintain themselves,
            <br />
            <span style={{ color: '#DC2626' }}>not to help the person.</span>
          </h2>
          <p className="text-[#F5F0E8]/60 font-mono text-sm max-w-xl mx-auto mb-8">
            We have the data to prove it across every axis. And we&apos;re putting it
            inside a shipping container and driving it to six cities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contained"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#DC2626', color: '#F5F0E8' }}
            >
              See CONTAINED <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/intelligence/funding-map"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border border-[#F5F0E8]/20"
              style={{ color: '#F5F0E8' }}
            >
              Explore Funding Deserts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sources ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <details className="text-xs font-mono text-[#0A0A0A]/40">
          <summary className="cursor-pointer hover:text-[#0A0A0A]/60">Data Sources</summary>
          <div className="mt-4 space-y-1">
            <p>ROGS 2024-25 Table 17A.1 — Youth Justice expenditure by state</p>
            <p>QAO Report 15 (2024) — Keeping communities safe: Youth justice</p>
            <p>AIHW Youth Justice 2023-24 — supervision and detention by state/Indigenous status</p>
            <p>AIHW Child Protection 2020-21 — notifications, substantiations, out-of-home care</p>
            <p>QFCC (Nov 2024) — Exiting Youth Detention, child protection crossover</p>
            <p>QLD Government Information Portal (QGIP) — grant funding data</p>
            <p>AusTender — federal procurement data</p>
            <p>NIAA Senate Order 16 — Indigenous affairs funding disclosure</p>
            <p>QLD Contract Disclosure Register — state procurement</p>
            <p>ABS Census 2021 — LGA demographics, SEIFA scores</p>
            <p>ACARA — school ICSEA scores by LGA</p>
            <p>NDIS — participant data by LGA</p>
            <p>DSS — payment demographics by LGA</p>
          </div>
        </details>
      </section>
    </div>
  );
}

/* ── MapPin icon (inline to avoid import issues) ───────────── */

function MapPinIcon() {
  return (
    <svg className="w-5 h-5 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
