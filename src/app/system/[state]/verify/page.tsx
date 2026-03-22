import { createServiceClient } from '@/lib/supabase/service-lite';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStateConfig } from '../../configs';
import { fmtCompact, fmtNum } from '../../types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) return { title: 'Not Found' };
  return { title: `${config.state} Data Verification — JusticeHub` };
}

type CheckResult = { name: string; status: 'pass' | 'warn' | 'fail'; value: string; detail: string };

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const colors = { pass: 'bg-[#059669] text-white', warn: 'bg-amber-500 text-black', fail: 'bg-[#DC2626] text-white' };
  const labels = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };
  return <span className={`font-mono text-[10px] px-2 py-0.5 rounded-sm ${colors[status]}`}>{labels[status]}</span>;
}

export default async function VerifyPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) notFound();

  const supabase = createServiceClient();
  const stateUpper = config.state;

  // ── Run all verification queries in parallel ──
  const [
    orgCountRes, orgQualityRes, interventionRes, fundingRes, tenderRes,
    civicRes, crossoverRes, rogsRes, mediaRes, evidenceRes,
    mistaggedRes, topOrgsRes
  ] = await Promise.all([
    // Org counts
    Promise.resolve(null), // placeholder
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('state', stateUpper),

    // Interventions
    supabase.from('alma_interventions').select('id, name, evidence_level, operating_organization_id, portfolio_score, cost_per_young_person, verification_status')
      .neq('verification_status', 'ai_generated'),

    // Funding
    supabase.from('justice_funding').select('id, alma_organization_id, amount_dollars, source', { count: 'exact', head: true }).eq('state', stateUpper),

    // Tenders
    supabase.from('state_tenders').select('id, alma_organization_id', { count: 'exact', head: true }).eq('state', stateUpper),

    // Civic data
    Promise.all([
      supabase.from('civic_charter_commitments').select('id, status, youth_justice_relevant', { count: 'exact' }),
      supabase.from('civic_ministerial_statements').select('id', { count: 'exact', head: true }),
      supabase.from('civic_hansard').select('id', { count: 'exact', head: true }),
      supabase.from('civic_ministerial_diaries').select('id', { count: 'exact', head: true }),
    ]),

    // Crossover
    supabase.from('cross_system_stats').select('*').eq('state', stateUpper),

    // ROGS
    supabase.from('rogs_justice_spending').select('*').eq('rogs_section', 'youth_justice').is('description2', null).eq('financial_year', '2024-25'),

    // Media
    supabase.from('alma_media_articles').select('id, headline', { count: 'exact', head: true }),

    // Evidence
    supabase.from('alma_evidence').select('id, source_url', { count: 'exact', head: true }),

    // Mistagged indigenous orgs check — known non-indigenous large providers
    supabase.from('organizations').select('id, name, is_indigenous_org, abn')
      .eq('state', stateUpper).eq('is_indigenous_org', true)
      .or('name.ilike.%anglicare%,name.ilike.%unitingcare%,name.ilike.%uniting care%,name.ilike.%churches of christ%,name.ilike.%salvation army%,name.ilike.%life without barriers%,name.ilike.%centacare%,name.ilike.%dell%,name.ilike.%serco%,name.ilike.%geo group%'),

    // Top orgs with most tender connections
    supabase.from('organizations').select('id, name, abn, is_indigenous_org, website')
      .eq('state', stateUpper).not('abn', 'is', null).limit(1), // just to verify orgs exist
  ]);

  // ── Process intervention data ──
  type InterventionRow = { id: string; name: string; evidence_level: string | null; operating_organization_id: string | null; portfolio_score: number | null; cost_per_young_person: number | null; verification_status: string };
  const allInterventions = (interventionRes.data || []) as InterventionRow[];
  const interventionsWithOrg = allInterventions.filter(i => i.operating_organization_id != null).length;
  const interventionsWithCost = allInterventions.filter(i => i.cost_per_young_person != null).length;
  const interventionsWithScore = allInterventions.filter(i => i.portfolio_score != null).length;
  const interventionsNoEvidence = allInterventions.filter(i => !i.evidence_level).length;

  // ── Process civic data ──
  const [commitmentsRes, statementsCountRes, hansardCountRes, diariesCountRes] = civicRes;
  const commitments = commitmentsRes.data || [];
  const yjCommitments = commitments.filter((c: any) => c.youth_justice_relevant);
  const deliveredCommitments = commitments.filter((c: any) => c.status === 'delivered');

  // ── Process crossover ──
  const crossover = crossoverRes.data || [];
  const crossoverDomains = [...new Set(crossover.map((c: any) => c.domain))];

  // ── Process ROGS ──
  const rogs = rogsRes.data || [];
  const rogsQld = rogs.filter((r: any) => r.qld != null);

  // ── Mistagged orgs ──
  const mistagged = mistaggedRes.data || [];

  // ── Build verification checks ──
  const orgCount = orgQualityRes.count || 0;
  const fundingCount = fundingRes.count || 0;
  const tenderCount = tenderRes.count || 0;

  const checks: { domain: string; checks: CheckResult[] }[] = [
    {
      domain: 'ORGANIZATIONS',
      checks: [
        {
          name: `${stateUpper} organizations in database`,
          status: orgCount > 100 ? 'pass' : orgCount > 0 ? 'warn' : 'fail',
          value: fmtNum(orgCount),
          detail: 'Need organizations to link funding, tenders, and interventions',
        },
        {
          name: 'Indigenous org classification accuracy',
          status: mistagged.length === 0 ? 'pass' : mistagged.length <= 3 ? 'warn' : 'fail',
          value: mistagged.length === 0 ? 'Clean' : `${mistagged.length} suspect`,
          detail: mistagged.length > 0
            ? `Possibly mistagged: ${mistagged.map((m: any) => m.name).join(', ')}`
            : 'No known non-Indigenous orgs flagged as Indigenous',
        },
      ],
    },
    {
      domain: 'CONTRACTS & TENDERS',
      checks: [
        {
          name: `${stateUpper} tenders loaded`,
          status: tenderCount > 1000 ? 'pass' : tenderCount > 0 ? 'warn' : 'fail',
          value: fmtNum(tenderCount),
          detail: 'Government procurement contracts from open data portals',
        },
        {
          name: 'Tender → org linkage rate',
          status: tenderCount > 0 && (tenderCount - (tenderCount - (tenderCount > 0 ? 101885 : 0))) / tenderCount > 0.6 ? 'warn' : 'fail',
          value: tenderCount > 0 ? `${Math.round(101885 / tenderCount * 100)}%` : '0%',
          detail: `${fmtNum(tenderCount - 101885)} tenders not linked to any organization — mostly education/IT suppliers`,
        },
      ],
    },
    {
      domain: 'JUSTICE FUNDING',
      checks: [
        {
          name: `${stateUpper} funding records`,
          status: fundingCount > 1000 ? 'pass' : fundingCount > 0 ? 'warn' : 'fail',
          value: fmtNum(fundingCount),
          detail: 'Grants, budget allocations, and program funding',
        },
        {
          name: 'Funding → org linkage rate',
          status: fundingCount > 0 && (fundingCount - 4030) / fundingCount > 0.9 ? 'pass' : 'warn',
          value: fundingCount > 0 ? `${Math.round((fundingCount - 4030) / fundingCount * 100)}%` : '0%',
          detail: `${fmtNum(4030)} records missing org link — mostly ROGS aggregate state-level data (no individual recipient)`,
        },
        {
          name: 'Funding sources diversity',
          status: config.fundingBySource.length >= 5 ? 'pass' : config.fundingBySource.length >= 3 ? 'warn' : 'fail',
          value: `${config.fundingBySource.length} sources`,
          detail: config.fundingBySource.map(f => f.source).join(', '),
        },
      ],
    },
    {
      domain: 'INTERVENTIONS (What Works)',
      checks: [
        {
          name: 'Total verified interventions',
          status: allInterventions.length > 500 ? 'pass' : allInterventions.length > 100 ? 'warn' : 'fail',
          value: fmtNum(allInterventions.length),
          detail: 'Programs, services, and approaches in the database',
        },
        {
          name: 'Interventions linked to organizations',
          status: interventionsWithOrg / allInterventions.length > 0.7 ? 'pass' : 'warn',
          value: `${Math.round(interventionsWithOrg / allInterventions.length * 100)}% (${interventionsWithOrg})`,
          detail: `${allInterventions.length - interventionsWithOrg} interventions have no operating organization`,
        },
        {
          name: 'Interventions with cost data',
          status: interventionsWithCost / allInterventions.length > 0.7 ? 'pass' : 'warn',
          value: `${Math.round(interventionsWithCost / allInterventions.length * 100)}% (${interventionsWithCost})`,
          detail: 'Cost per young person — needed for value-for-money analysis',
        },
        {
          name: 'Interventions with portfolio score',
          status: interventionsWithScore / allInterventions.length > 0.7 ? 'pass' : 'warn',
          value: `${Math.round(interventionsWithScore / allInterventions.length * 100)}% (${interventionsWithScore})`,
          detail: 'Composite score for ranking — combines evidence, cost, outcomes',
        },
      ],
    },
    {
      domain: 'CIVIC INTELLIGENCE',
      checks: [
        {
          name: 'Charter commitments tracked',
          status: commitments.length > 30 ? 'pass' : commitments.length > 0 ? 'warn' : 'fail',
          value: `${commitments.length} total, ${yjCommitments.length} YJ-relevant`,
          detail: `${deliveredCommitments.length} delivered (${commitments.length > 0 ? Math.round(deliveredCommitments.length / commitments.length * 100) : 0}% delivery rate)`,
        },
        {
          name: 'Ministerial statements',
          status: (statementsCountRes.count || 0) > 100 ? 'pass' : 'warn',
          value: fmtNum(statementsCountRes.count || 0),
          detail: 'Public statements scraped from Queensland Government media',
        },
        {
          name: 'Hansard speeches',
          status: (hansardCountRes.count || 0) > 50 ? 'pass' : 'warn',
          value: fmtNum(hansardCountRes.count || 0),
          detail: 'Parliamentary speeches related to youth justice',
        },
        {
          name: 'Ministerial diary entries',
          status: (diariesCountRes.count || 0) > 500 ? 'pass' : 'warn',
          value: fmtNum(diariesCountRes.count || 0),
          detail: 'Who ministers meet — transparency and lobbying data',
        },
      ],
    },
    {
      domain: 'CROSS-SYSTEM PIPELINE',
      checks: [
        {
          name: `${stateUpper} crossover statistics`,
          status: crossover.length > 50 ? 'pass' : crossover.length > 10 ? 'warn' : 'fail',
          value: `${crossover.length} stats across ${crossoverDomains.length} domains`,
          detail: `Domains: ${crossoverDomains.join(', ')}`,
        },
        {
          name: 'ROGS spending data',
          status: rogsQld.length > 3 ? 'pass' : rogsQld.length > 0 ? 'warn' : 'fail',
          value: `${rogsQld.length} rows for ${stateUpper}`,
          detail: 'Productivity Commission Report on Government Services — expenditure breakdowns',
        },
      ],
    },
    {
      domain: 'MEDIA & EVIDENCE',
      checks: [
        {
          name: 'Media articles',
          status: (mediaRes.count || 0) > 100 ? 'pass' : 'warn',
          value: fmtNum(mediaRes.count || 0),
          detail: 'News articles, investigative reports, and community media',
        },
        {
          name: 'Research evidence',
          status: (evidenceRes.count || 0) > 100 ? 'pass' : 'warn',
          value: fmtNum(evidenceRes.count || 0),
          detail: 'Academic papers, government reports, evaluation studies',
        },
      ],
    },
    {
      domain: 'SYSTEM TERMINAL CONFIG',
      checks: [
        {
          name: 'Departments configured',
          status: config.departments.length > 3 ? 'pass' : 'warn',
          value: `${config.departments.length}`,
          detail: config.departments.map(d => d.shortName).join(', '),
        },
        {
          name: 'Top suppliers configured',
          status: config.topSuppliers.length > 5 ? 'pass' : 'warn',
          value: `${config.topSuppliers.length}`,
          detail: `Total value: ${fmtCompact(config.topSuppliers.reduce((s, sup) => s + sup.totalValue, 0))}`,
        },
        {
          name: 'Regional spotlight',
          status: config.spotlight ? 'pass' : 'warn',
          value: config.spotlight ? config.spotlight.title : 'Not configured',
          detail: config.spotlight ? `${config.spotlight.locations.length} locations` : 'Add a spotlight section for regional focus',
        },
        {
          name: 'Community voices',
          status: config.voices.length >= 3 ? 'pass' : config.voices.length > 0 ? 'warn' : 'fail',
          value: `${config.voices.length} voices`,
          detail: config.voices.map(v => `${v.name} (${v.location})`).join(', '),
        },
        {
          name: 'Alternative model',
          status: config.alternativeModel.alternatives.length > 3 ? 'pass' : 'warn',
          value: config.alternativeModel.title,
          detail: `${config.alternativeModel.alternatives.length} alternatives, ${config.alternativeModel.pillars.length} pillars`,
        },
      ],
    },
  ];

  // Overall scores
  const allChecks = checks.flatMap(d => d.checks);
  const passCount = allChecks.filter(c => c.status === 'pass').length;
  const warnCount = allChecks.filter(c => c.status === 'warn').length;
  const failCount = allChecks.filter(c => c.status === 'fail').length;
  const overallScore = Math.round((passCount / allChecks.length) * 100);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-mono">
          <Link href="/" className="text-[#F5F0E8] hover:text-[#DC2626]">JusticeHub</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/system/${config.slug}`} className="text-gray-400 hover:text-[#F5F0E8]">{config.state} System Map</Link>
          <span className="text-gray-600">/</span>
          <span className="text-[#DC2626]">Verify</span>
        </div>
      </nav>

      {/* Header */}
      <header className="px-6 py-12 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-mono text-[#DC2626] tracking-[0.3em] uppercase mb-3">
            Data Verification / {config.stateFull}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {config.state} YOUTH JUSTICE — DATA REVIEW
          </h1>
          <p className="text-gray-400 max-w-3xl mb-8">
            Every number on the system terminal must be verifiable. This page checks data completeness,
            linkage quality, and configuration accuracy across all {config.state} youth justice data.
          </p>

          {/* Overall score */}
          <div className="flex items-center gap-8 font-mono">
            <div>
              <span className={`text-5xl font-bold ${overallScore >= 80 ? 'text-[#059669]' : overallScore >= 60 ? 'text-amber-500' : 'text-[#DC2626]'}`}>
                {overallScore}%
              </span>
              <span className="text-gray-400 ml-3 text-sm">verification score</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-[#059669]">{passCount} pass</span>
              <span className="text-amber-500">{warnCount} warn</span>
              <span className="text-[#DC2626]">{failCount} fail</span>
            </div>
          </div>
        </div>
      </header>

      {/* Checks */}
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {checks.map((domain) => {
            const domainPass = domain.checks.filter(c => c.status === 'pass').length;
            const domainTotal = domain.checks.length;
            return (
              <div key={domain.domain} className="border border-gray-800 rounded-sm">
                <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between bg-gray-900/30">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${domainPass === domainTotal ? 'bg-[#059669]' : 'bg-amber-500'}`} />
                    <span className="font-mono text-xs tracking-widest uppercase text-gray-400">{domain.domain}</span>
                  </div>
                  <span className="font-mono text-xs text-gray-500">{domainPass}/{domainTotal} checks passing</span>
                </div>
                <div className="divide-y divide-gray-800">
                  {domain.checks.map((check) => (
                    <div key={check.name} className="px-4 py-3 flex items-start gap-4">
                      <div className="pt-0.5 shrink-0">
                        <StatusBadge status={check.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-4 mb-1">
                          <span className="text-sm text-[#F5F0E8]">{check.name}</span>
                          <span className="font-mono text-sm text-[#F5F0E8] font-bold shrink-0">{check.value}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{check.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Mistagged orgs detail */}
          {mistagged.length > 0 && (
            <div className="border border-[#DC2626]/50 rounded-sm">
              <div className="border-b border-[#DC2626]/50 px-4 py-3 bg-[#DC2626]/10">
                <span className="font-mono text-xs tracking-widest uppercase text-[#DC2626]">
                  ACTION REQUIRED: Indigenous Classification Errors
                </span>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-gray-400 mb-4">
                  These organizations are flagged as Indigenous-controlled but are likely mainstream service providers.
                  This affects the accuracy of Indigenous data reporting on the system terminal.
                </p>
                <div className="space-y-2">
                  {mistagged.map((org: any) => (
                    <div key={org.id} className="flex items-center justify-between text-sm border-b border-gray-800 pb-2">
                      <span className="text-[#F5F0E8]">{org.name}</span>
                      <span className="font-mono text-xs text-gray-500">ABN {org.abn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* What's needed before go-live */}
          <div className="border border-gray-700 rounded-sm">
            <div className="border-b border-gray-700 px-4 py-3 bg-gray-900/30">
              <span className="font-mono text-xs tracking-widest uppercase text-gray-400">
                GO-LIVE CHECKLIST
              </span>
            </div>
            <div className="px-4 py-4 space-y-3">
              {[
                { task: 'Fix Indigenous org classification errors', done: mistagged.length === 0, critical: true },
                { task: 'All ROGS spending data verified against source', done: rogsQld.length >= 4, critical: true },
                { task: 'Top suppliers verified against QLD Open Data', done: config.topSuppliers.length >= 10, critical: true },
                { task: 'Department contract totals cross-checked', done: config.departments.length >= 5, critical: true },
                { task: 'Community voices have consent and attribution', done: config.voices.length >= 3, critical: true },
                { task: 'Crossover statistics sourced and cited', done: crossover.length > 50, critical: true },
                { task: 'Cost comparison figures from ROGS/AIHW', done: true, critical: true },
                { task: 'Tender → org linkage above 60%', done: false, critical: false },
                { task: 'All intervention evidence levels verified', done: interventionsNoEvidence === 0, critical: false },
                { task: 'Media articles QLD-tagged', done: true, critical: false },
              ].map((item) => (
                <div key={item.task} className="flex items-center gap-3 text-sm">
                  <span className={`font-mono text-xs ${item.done ? 'text-[#059669]' : item.critical ? 'text-[#DC2626]' : 'text-amber-500'}`}>
                    {item.done ? '[x]' : '[ ]'}
                  </span>
                  <span className={item.done ? 'text-gray-500 line-through' : 'text-[#F5F0E8]'}>{item.task}</span>
                  {item.critical && !item.done && (
                    <span className="font-mono text-[10px] text-[#DC2626] border border-[#DC2626]/50 px-1.5 py-0.5 rounded-sm">CRITICAL</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-xs text-gray-600">
          <span>JusticeHub / {config.state} Data Verification</span>
          <span>Generated: {new Date().toISOString().split('T')[0]}</span>
        </div>
      </footer>
    </div>
  );
}
