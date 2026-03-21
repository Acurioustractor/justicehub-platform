'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight, ArrowDown, Loader2, TrendingUp, TrendingDown,
  AlertTriangle, DollarSign, Users, Scale, Heart, BarChart3,
  FileText, Landmark, ExternalLink, Download
} from 'lucide-react';

interface TrackerInquiry {
  case_citation: string;
  jurisdiction: string;
  year: number;
  court: string;
  strategic_issue: string;
  key_holding: string;
  outcome: string;
  precedent_strength: string;
  status: string;
  categories: string[];
}

interface TrackerCampaign {
  campaign_name: string;
  country_region: string;
  lead_organizations: string;
  goals: string;
  outcome_status: string;
  start_year: number;
  is_ongoing: boolean;
}

interface TrackerDoc {
  title: string;
  document_type: string;
  source_organization: string;
  publication_date: string;
  abstract: string;
  authority_level: string;
}

interface TrackerData {
  summary: {
    total_inquiries: number;
    active_inquiries: number;
    completed_inquiries: number;
    active_campaigns: number;
    source_documents: number;
    media_articles: number;
  };
  active_inquiries: TrackerInquiry[];
  completed_inquiries: TrackerInquiry[];
  campaigns: TrackerCampaign[];
  key_documents: TrackerDoc[];
  timeline: { year: number; type: string; title: string; status: string }[];
}

interface StoryData {
  title: string;
  summary: string;
  story_type: string;
  impact_areas: Record<string, string>;
  featured: boolean;
  story_date: string;
}

interface ResearchFinding {
  finding_type: string;
  content: Record<string, string>;
  confidence: number;
  sources: string[];
}

interface CaseData {
  spending: {
    financial_year: string;
    service_type: string;
    aust: number;
    qld: number;
    nsw: number;
    vic: number;
    nt: number;
  }[];
  total_spending: {
    financial_year: string;
    aust: number;
    qld: number;
  }[];
  indigenous: {
    financial_year: string;
    ratio: number;
    indigenous_count: number;
    total_count: number;
  }[];
  supervision: {
    financial_year: string;
    service_type: string;
    total: number;
    rate: number;
  }[];
  interventions: { type: string; count: number }[];
  funding_evidence: {
    with_evidence: number;
    without_evidence: number;
  };
  outcome_types: { outcome_type: string; intervention_count: number }[];
  intervention_outcome_matrix: {
    intervention_type: string;
    outcome_type: string;
    link_count: number;
  }[];
  detention_facilities: {
    name: string;
    state: string;
    operational_status: string;
    capacity_beds: number;
  }[];
  stats: {
    total_interventions: number;
    interventions_with_outcomes: number;
    total_outcomes: number;
    total_evidence: number;
    total_orgs: number;
    indigenous_orgs: number;
    media_articles: number;
    detention_facilities: number;
    operational_facilities: number;
    total_beds: number;
    political_donations_total: number;
    political_donation_records: number;
    total_current_population: number;
    avg_indigenous_pct: number;
    case_studies: number;
    research_findings: number;
    source_documents: number;
    justice_cases_au: number;
    active_campaigns: number;
  };
}

function fmt$(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toFixed(0)}M`;
}

export default function AnalysisPage() {
  const [data, setData] = useState<CaseData | null>(null);
  const [tracker, setTracker] = useState<TrackerData | null>(null);
  const [stories, setStories] = useState<StoryData[]>([]);
  const [research, setResearch] = useState<ResearchFinding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analysis/case-for-change').then(r => r.json()),
      fetch('/api/analysis/report?type=inquiry-tracker&jurisdiction=National').then(r => r.json()),
      fetch('/api/analysis/report?type=case-for-change').then(r => r.json()),
    ])
      .then(([caseData, trackerData, fullReport]) => {
        setData(caseData);
        setTracker(trackerData);
        setStories(fullReport.case_studies || []);
        setResearch(fullReport.research_findings?.evidence_links || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navigation />
        <main className="header-offset">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mr-3" />
            <span className="font-bold text-gray-500">Loading analysis...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  // Extract key numbers
  const latest = data.indigenous?.[0];
  const oldest = data.indigenous?.[data.indigenous.length - 1];
  const latestYear = latest?.financial_year || '2024-25';

  // Spending breakdown for latest year
  const latestSpending = data.spending?.filter(s => s.financial_year === latestYear) || [];
  const detentionSpend = latestSpending.find(s => s.service_type === 'Detention-based supervision');
  const communitySpend = latestSpending.find(s => s.service_type === 'Community-based supervision');
  const conferencingSpend = latestSpending.find(s => s.service_type === 'Group conferencing');
  const totalSpendLatest = data.total_spending?.find(s => s.financial_year === latestYear);

  // Spending trend
  const spendingTrend = data.total_spending?.slice(0, 5).reverse() || [];

  // Supervision numbers for latest year
  const latestDetention = data.supervision?.find(
    s => s.financial_year === latestYear && s.service_type === 'Detention-based supervision' && s.total
  );

  // Indigenous trend
  const indigenousTrend = [...(data.indigenous || [])].reverse();

  // Intervention counts
  const totalInterventions = data.interventions?.reduce((s, i) => s + i.count, 0) || 0;

  // Funding evidence split
  const withEvidence = data.funding_evidence?.with_evidence || 0;
  const withoutEvidence = data.funding_evidence?.without_evidence || 0;
  const totalFunding = withEvidence + withoutEvidence;
  const evidencePct = totalFunding > 0 ? Math.round((withEvidence / totalFunding) * 100) : 0;

  // Detention as % of total
  const detentionPct = detentionSpend && totalSpendLatest
    ? Math.round((detentionSpend.aust / totalSpendLatest.aust) * 100)
    : 66;
  const communityPct = communitySpend && totalSpendLatest
    ? Math.round((communitySpend.aust / totalSpendLatest.aust) * 100)
    : 30;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="header-offset">

        {/* Hero — The Headline */}
        <section className="section-padding bg-black text-white border-b-2 border-black">
          <div className="container-justice max-w-4xl">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">
              Intelligence / Analysis
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-8">
              The Case<br />for Change
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-snug max-w-3xl mb-10">
              Australia spends <span className="text-white font-black">${totalSpendLatest?.aust || 644}M per year</span> on
              youth justice. <span className="text-white font-black">{detentionPct}%</span> goes to detention.
              Indigenous children are <span className="text-white font-black">{latest?.ratio || 23}x</span> more
              likely to be locked up. The system is failing. The data proves it.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-bold">Source: ROGS {latestYear}</span>
              <span>|</span>
              <span className="font-bold">ALMA Intelligence</span>
              <span>|</span>
              <span className="font-bold">JusticeHub Analysis</span>
            </div>
          </div>
        </section>

        {/* Section 1: The Money */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 1</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              Where the money goes
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              For every dollar spent on youth justice, two-thirds locks children up.
              One-third supports them in community. The evidence says we have it backwards.
            </p>

            {/* The Big Split */}
            <div className="mb-10">
              <div className="flex rounded-lg overflow-hidden border-2 border-black h-16 mb-4">
                <div
                  className="bg-red-600 flex items-center justify-center text-white font-black text-sm transition-all duration-700"
                  style={{ width: `${detentionPct}%` }}
                >
                  Detention {detentionPct}%
                </div>
                <div
                  className="bg-emerald-600 flex items-center justify-center text-white font-black text-sm transition-all duration-700"
                  style={{ width: `${communityPct}%` }}
                >
                  Community {communityPct}%
                </div>
                {conferencingSpend && (
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white font-black text-xs transition-all duration-700"
                    style={{ width: `${100 - detentionPct - communityPct}%` }}
                  >
                    {100 - detentionPct - communityPct}%
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl md:text-3xl font-black text-red-600">
                    ${detentionSpend?.aust || 427}M
                  </p>
                  <p className="text-xs font-bold text-gray-500">Detention</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-black text-emerald-600">
                    ${communitySpend?.aust || 194}M
                  </p>
                  <p className="text-xs font-bold text-gray-500">Community</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-black text-blue-500">
                    ${conferencingSpend?.aust || 23}M
                  </p>
                  <p className="text-xs font-bold text-gray-500">Conferencing</p>
                </div>
              </div>
            </div>

            {/* Spending Trend */}
            <h3 className="text-lg font-black mb-4">National spending is growing — but not on what works</h3>
            <div className="space-y-2 mb-6">
              {spendingTrend.map((s, i) => {
                const maxSpend = Math.max(...spendingTrend.map(t => t.aust));
                const pct = (s.aust / maxSpend) * 100;
                return (
                  <div key={s.financial_year} className="flex items-center gap-4">
                    <span className="w-16 text-sm font-bold text-gray-500 shrink-0 text-right">
                      {s.financial_year.split('-')[0]}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm font-black text-right shrink-0">
                      ${s.aust}M
                    </span>
                  </div>
                );
              })}
            </div>

            {/* QLD spotlight */}
            <div className="bg-ochre-50 border-2 border-black rounded-lg p-6">
              <p className="font-black text-lg mb-2">Queensland: highest spender, worst outcomes</p>
              <p className="text-sm text-gray-600 mb-4">
                QLD spends <span className="font-black">${totalSpendLatest?.qld || 922}M</span> per year —
                more than any other state. Yet QLD has the highest youth detention rate
                (5.0 per 10,000 vs national 2.7) and the highest Indigenous overrepresentation
                in detention (40.6 per 10,000 vs national 25.7).
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3 border border-black">
                  <p className="text-xl font-black text-red-600">${detentionSpend?.qld || 513}M</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">QLD Detention</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-black">
                  <p className="text-xl font-black text-emerald-600">${communitySpend?.qld || 392}M</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">QLD Community</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-black">
                  <p className="text-xl font-black">{
                    data.indigenous?.[0] ? '40.6' : '40.6'
                  }</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Indigenous rate/10K</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: The People */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 2</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              Who gets locked up
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              On any given night, {latest?.total_count || 734} children are in youth detention
              across Australia. {latest?.indigenous_count || 453} of them — {latest ? Math.round((latest.indigenous_count / latest.total_count) * 100) : 62}% — are
              Aboriginal and Torres Strait Islander.
            </p>

            {/* The Overrepresentation Chart */}
            <h3 className="text-lg font-black mb-4">
              Indigenous overrepresentation is getting worse
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              An Indigenous child is {latest?.ratio || 23}x more likely to be detained than a
              non-Indigenous child. This ratio has <span className="font-black text-red-600">increased
              from {oldest?.ratio || 20}x to {latest?.ratio || 23}x</span> since {oldest?.financial_year || '2017-18'}.
            </p>

            <div className="space-y-3 mb-10">
              {indigenousTrend.map((y) => {
                const maxRatio = Math.max(...indigenousTrend.map(t => t.ratio));
                const pct = (y.ratio / maxRatio) * 100;
                const isLatest = y.financial_year === latestYear;
                return (
                  <div key={y.financial_year} className="flex items-center gap-4">
                    <span className={`w-16 text-sm font-bold text-right shrink-0 ${isLatest ? 'text-black' : 'text-gray-400'}`}>
                      {y.financial_year.split('-')[0]}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isLatest ? 'bg-red-600' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-12 text-sm font-black text-right shrink-0 ${isLatest ? 'text-red-600' : 'text-gray-500'}`}>
                      {y.ratio}x
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Absolute numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-black rounded-lg p-6 text-center">
                <p className="text-4xl md:text-5xl font-black">{latest?.total_count || 734}</p>
                <p className="text-sm font-bold text-gray-500 mt-2">Children in detention tonight</p>
                <p className="text-xs text-gray-400 mt-1">Average day, {latestYear}</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-6 text-center">
                <p className="text-4xl md:text-5xl font-black text-red-600">{latest?.indigenous_count || 453}</p>
                <p className="text-sm font-bold text-gray-500 mt-2">Are Indigenous children</p>
                <p className="text-xs text-gray-400 mt-1">{latest ? Math.round((latest.indigenous_count / latest.total_count) * 100) : 62}% of the total</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: What Works */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 3</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              What actually works
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              ALMA has identified {totalInterventions.toLocaleString()} verified community-based
              interventions across Australia. The evidence is clear: community-led approaches work.
              Detention doesn't.
            </p>

            {/* Intervention types */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
              {data.interventions?.map(i => (
                <div key={i.type} className="border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <p className="text-2xl font-black text-emerald-600">{i.count}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">{i.type}</p>
                </div>
              ))}
            </div>

            {/* The Funding Mismatch */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-black text-lg text-red-900">The Funding Mismatch</h3>
              </div>
              <p className="text-sm text-red-800 mb-6">
                Of the ${(totalFunding / 1_000_000_000).toFixed(1)}B in tracked justice funding,
                only <span className="font-black">{evidencePct}%</span> goes to organisations
                with verified ALMA interventions. The rest — {fmt$(withoutEvidence)} — goes to
                organisations with no documented evidence of what works.
              </p>
              <div className="flex rounded-lg overflow-hidden border-2 border-red-300 h-12 mb-4">
                <div
                  className="bg-emerald-600 flex items-center justify-center text-white font-black text-sm"
                  style={{ width: `${evidencePct}%` }}
                >
                  Evidence-backed {evidencePct}%
                </div>
                <div
                  className="bg-gray-400 flex items-center justify-center text-white font-black text-sm"
                  style={{ width: `${100 - evidencePct}%` }}
                >
                  No evidence {100 - evidencePct}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xl font-black text-emerald-600">{fmt$(withEvidence)}</p>
                  <p className="text-xs font-bold text-gray-500">To orgs WITH proven interventions</p>
                </div>
                <div>
                  <p className="text-xl font-black text-gray-400">{fmt$(withoutEvidence)}</p>
                  <p className="text-xs font-bold text-gray-500">To orgs WITHOUT evidence</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3b: Proven Outcomes */}
        <section className="section-padding border-b-2 border-black bg-white">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 3b</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              Proven outcomes
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              {data.stats?.interventions_with_outcomes || 398} of {totalInterventions} interventions
              have documented outcomes linked to {data.stats?.total_outcomes || 506} measured
              results. Here's what community-based programs actually achieve.
            </p>

            {/* Outcome types */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
              {data.outcome_types?.map(o => (
                <div key={o.outcome_type} className="border-2 border-black rounded-lg p-4">
                  <p className="text-2xl font-black">{o.intervention_count}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">{o.outcome_type}</p>
                  <p className="text-[10px] text-gray-400">interventions with this outcome</p>
                </div>
              ))}
            </div>

            {/* Intervention → Outcome Matrix */}
            <h3 className="text-lg font-black mb-4">What types of interventions produce what outcomes</h3>
            <div className="bg-white border-2 border-black rounded-lg overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-50">
                      <th className="text-left p-2 font-black uppercase tracking-wider sticky left-0 bg-gray-50">Intervention</th>
                      <th className="p-2 font-black text-center">Recidivism</th>
                      <th className="p-2 font-black text-center">Diversion</th>
                      <th className="p-2 font-black text-center">Cultural</th>
                      <th className="p-2 font-black text-center">Education</th>
                      <th className="p-2 font-black text-center">Wellbeing</th>
                      <th className="p-2 font-black text-center">Safety</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.interventions?.map(i => {
                      const getCount = (outcomeType: string) => {
                        const match = data.intervention_outcome_matrix?.find(
                          m => m.intervention_type === i.type && m.outcome_type === outcomeType
                        );
                        return match?.link_count || 0;
                      };
                      const outcomes = [
                        'Reduced recidivism', 'Diversion from justice system',
                        'Cultural connection', 'Educational engagement',
                        'Mental health/wellbeing', 'Community safety'
                      ];
                      return (
                        <tr key={i.type} className="border-b border-gray-100">
                          <td className="p-2 font-bold sticky left-0 bg-white">{i.type}</td>
                          {outcomes.map(o => {
                            const c = getCount(o);
                            return (
                              <td key={o} className="p-2 text-center">
                                {c > 0 ? (
                                  <span className={`inline-block w-6 h-6 rounded-full text-white font-black text-[10px] leading-6 ${
                                    c >= 10 ? 'bg-emerald-600' : c >= 5 ? 'bg-emerald-400' : 'bg-emerald-200 text-emerald-800'
                                  }`}>
                                    {c}
                                  </span>
                                ) : (
                                  <span className="text-gray-200">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Each number represents the count of documented outcome links between an intervention type and an outcome category.
              Darker circles = stronger evidence base.
            </p>
          </div>
        </section>

        {/* Section 3c: The Infrastructure of Detention */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 3c</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              The infrastructure<br />of detention
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              {data.stats?.operational_facilities || 16} youth detention centres across Australia
              with {data.stats?.total_beds?.toLocaleString() || '1,000+'} beds holding{' '}
              <span className="font-black text-black">{data.stats?.total_current_population?.toLocaleString() || '874'} children tonight</span>.
              Average <span className="font-black text-red-600">{data.stats?.avg_indigenous_pct || 55}% Indigenous</span>.
              Every bed costs hundreds of thousands per year. Every bed is a policy choice.
            </p>

            {/* Facilities by state */}
            <div className="space-y-2">
              {Object.entries(
                (data.detention_facilities || []).reduce((acc, f) => {
                  if (!acc[f.state]) acc[f.state] = [];
                  acc[f.state].push(f);
                  return acc;
                }, {} as Record<string, typeof data.detention_facilities>)
              ).map(([state, facilities]) => (
                <div key={state} className="bg-white border-2 border-black rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm">{state}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400">
                        {facilities.reduce((s, f) => s + (f.operational_status === 'operational' ? (f.capacity_beds || 0) : 0), 0)} beds
                      </span>
                      <span className="text-xs font-bold text-red-600">
                        {facilities.reduce((s, f) => s + (f.operational_status === 'operational' ? ((f as Record<string, number>).current_population || 0) : 0), 0)} held
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {facilities.filter(f => f.operational_status === 'operational').map(f => {
                      const fData = f as Record<string, number | string>;
                      const pop = Number(fData.current_population) || 0;
                      const cap = Number(f.capacity_beds) || 1;
                      const indigPct = Number(fData.indigenous_population_percentage) || 0;
                      const occupancy = Math.round((pop / cap) * 100);
                      return (
                        <div key={f.name} className="flex items-center gap-2">
                          <span className="text-xs font-bold flex-1">{f.name}</span>
                          <div className="w-24 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${occupancy > 90 ? 'bg-red-600' : occupancy > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(occupancy, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold w-8 text-right">{pop}/{cap}</span>
                          {indigPct > 0 && (
                            <span className={`text-[10px] font-bold w-10 text-right ${indigPct > 60 ? 'text-red-600' : 'text-gray-500'}`}>
                              {indigPct}% FN
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {facilities.filter(f => f.operational_status !== 'operational').map(f => (
                      <span key={f.name} className="text-xs text-gray-400 line-through">{f.name} (closed)</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: The Alternative */}
        <section className="section-padding border-b-2 border-black bg-emerald-50">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 4</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              The alternative
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              What if we redirected just 20% of detention spending into community-based interventions?
              The data shows what's possible.
            </p>

            {/* The Redirect Model */}
            <div className="space-y-4 mb-10">
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <p className="font-black text-lg">
                      Redirect ${Math.round((detentionSpend?.aust || 427) * 0.2)}M from detention
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      20% of the current ${detentionSpend?.aust || 427}M detention budget —
                      enough to fund {Math.round(((detentionSpend?.aust || 427) * 0.2) / 0.5)} new community interventions
                      at $500K average.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <ArrowDown className="h-6 w-6 text-gray-300" />
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 font-black">
                    2
                  </div>
                  <div>
                    <p className="font-black text-lg">
                      Fund {totalInterventions.toLocaleString()} proven models — nationally
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ALMA has already identified the interventions. {data.interventions?.[0]?.count || 224} wraparound
                      support programs, {data.interventions?.[1]?.count || 136} cultural connection programs, {data.interventions?.[2]?.count || 111} prevention
                      programs. They exist. They work. They need funding.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <ArrowDown className="h-6 w-6 text-gray-300" />
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-black text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 font-black">
                    3
                  </div>
                  <div>
                    <p className="font-black text-lg">
                      A National Centre of Excellence to prove it
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Rigorous outcome tracking. Indigenous data sovereignty. Community-owned evidence.
                      Not anecdotes — longitudinal data on what reduces reoffending, what keeps families together,
                      and what makes communities safer. The infrastructure to end detention in a generation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Vision */}
            <div className="bg-black text-white rounded-lg p-8 border-2 border-black">
              <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-4">
                The 30-year vision
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                In 2056, there are no youth detention centres in Australia. Every young person
                who needs support gets it in their community, on their Country, surrounded by
                their people. Recidivism is below 10%. Indigenous young people thrive at the
                same rate as everyone else. The world studies Australia's model.
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                This isn't fantasy. It's what the evidence already supports. We have {totalInterventions.toLocaleString()} proven
                interventions. We have {(208).toLocaleString()} Indigenous-led organisations doing the work right now.
                We have the data to prove what works and the technology to track it.
              </p>
              <p className="text-white font-black text-lg">
                The only thing missing is the political will to redirect the funding.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4b: Case Studies */}
        {stories.length > 0 && (
          <section className="section-padding border-b-2 border-black bg-white">
            <div className="container-justice max-w-4xl">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5" />
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 4b</p>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
                The stories
              </h2>
              <p className="text-lg text-gray-500 mb-10 max-w-2xl">
                Behind every data point is a community, a family, a child. These case studies
                show what the numbers mean — and what&apos;s possible when we do things differently.
              </p>

              <div className="space-y-6">
                {stories.filter(s => s.featured).map((story) => (
                  <div key={story.title} className="border-2 border-black rounded-lg overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          story.story_type === 'case_study' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {story.story_type.replace(/_/g, ' ')}
                        </span>
                        {story.story_date && (
                          <span className="text-xs text-gray-400">{story.story_date.split('T')[0]}</span>
                        )}
                      </div>
                      <h3 className="text-xl font-black mb-3">{story.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{story.summary}</p>
                      {story.impact_areas && Object.keys(story.impact_areas).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {Object.entries(story.impact_areas).slice(0, 4).map(([key, val]) => (
                            <span key={key} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded">
                              {key.replace(/_/g, ' ')}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {stories.filter(s => !s.featured).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-black mb-4 text-gray-500">More case studies</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {stories.filter(s => !s.featured).map((story) => (
                      <div key={story.title} className="border border-gray-200 rounded-lg p-4">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          story.story_type === 'case_study' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {story.story_type.replace(/_/g, ' ')}
                        </span>
                        <p className="text-sm font-bold mt-2">{story.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{story.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 4c: Research Findings */}
        {research.length > 0 && (
          <section className="section-padding border-b-2 border-black bg-gray-50">
            <div className="container-justice max-w-4xl">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5" />
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 4c</p>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
                What the research says
              </h2>
              <p className="text-lg text-gray-500 mb-10 max-w-2xl">
                {research.length} validated research findings from evaluations, longitudinal studies,
                and program data. The evidence base for community-led alternatives is overwhelming.
              </p>

              <div className="space-y-3">
                {research.slice(0, 8).map((finding, i) => (
                  <div key={i} className="bg-white border-2 border-black rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs ${
                        finding.confidence >= 0.9 ? 'bg-emerald-600' : finding.confidence >= 0.8 ? 'bg-emerald-400' : 'bg-yellow-500'
                      }`}>
                        {Math.round(finding.confidence * 100)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{finding.content?.finding || JSON.stringify(finding.content).slice(0, 200)}</p>
                        {finding.sources && finding.sources.length > 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            Sources: {finding.sources.join(' | ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Inquiries & Reform Tracker */}
        {tracker && (
          <section className="section-padding border-b-2 border-black">
            <div className="container-justice max-w-4xl">
              <div className="flex items-center gap-3 mb-2">
                <Landmark className="h-5 w-5" />
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Part 5</p>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
                Inquiries &amp; reform
              </h2>
              <p className="text-lg text-gray-500 mb-10 max-w-2xl">
                {tracker.summary.total_inquiries} inquiries, royal commissions, and reviews.{' '}
                {tracker.summary.active_campaigns} active campaigns fighting for change.{' '}
                {tracker.summary.source_documents} key research documents.
              </p>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                <div className="border-2 border-black rounded-lg p-4 text-center">
                  <p className="text-3xl font-black">{tracker.summary.active_inquiries}</p>
                  <p className="text-xs font-bold text-gray-500">Active inquiries</p>
                </div>
                <div className="border-2 border-black rounded-lg p-4 text-center">
                  <p className="text-3xl font-black">{tracker.summary.completed_inquiries}</p>
                  <p className="text-xs font-bold text-gray-500">Completed</p>
                </div>
                <div className="border-2 border-black rounded-lg p-4 text-center">
                  <p className="text-3xl font-black">{tracker.summary.active_campaigns}</p>
                  <p className="text-xs font-bold text-gray-500">Active campaigns</p>
                </div>
                <div className="border-2 border-black rounded-lg p-4 text-center">
                  <p className="text-3xl font-black">{tracker.summary.source_documents}</p>
                  <p className="text-xs font-bold text-gray-500">Key documents</p>
                </div>
              </div>

              {/* Active Inquiries */}
              {tracker.active_inquiries.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    Active inquiries &amp; reviews
                  </h3>
                  <div className="space-y-3">
                    {tracker.active_inquiries.map((c) => (
                      <div key={c.case_citation} className="border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-black text-sm">{c.case_citation}</p>
                            <p className="text-xs text-gray-500 mt-1">{c.jurisdiction} | {c.year} | {c.court}</p>
                            <p className="text-sm text-gray-600 mt-2">{c.strategic_issue}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                            c.precedent_strength === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {c.precedent_strength}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reform Timeline */}
              <h3 className="text-lg font-black mb-4">Reform timeline</h3>
              <div className="relative mb-10">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-black" />
                <div className="space-y-4">
                  {tracker.timeline.slice(0, 15).map((event, i) => (
                    <div key={`${event.title}-${i}`} className="flex items-start gap-4 pl-10 relative">
                      <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-black ${
                        event.type === 'inquiry' ? 'bg-red-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-400">{event.year}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            event.type === 'inquiry' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-sm font-bold mt-0.5">{event.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Campaigns */}
              {tracker.campaigns.filter(c => c.is_ongoing).length > 0 && (
                <div className="mb-10">
                  <h3 className="text-lg font-black mb-4">Active campaigns</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {tracker.campaigns.filter(c => c.is_ongoing).map((c) => (
                      <div key={c.campaign_name} className="border-2 border-emerald-200 bg-emerald-50 rounded-lg p-4">
                        <p className="font-black text-sm">{c.campaign_name}</p>
                        <p className="text-xs text-gray-500 mt-1">Since {c.start_year} | {c.country_region}</p>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{c.goals}</p>
                        {c.outcome_status && (
                          <p className="text-xs font-bold text-emerald-700 mt-2">{c.outcome_status}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Documents */}
              {tracker.key_documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-black mb-4">Key research &amp; policy documents</h3>
                  <div className="space-y-2">
                    {tracker.key_documents.slice(0, 10).map((doc) => (
                      <div key={doc.title} className="flex items-start gap-3 border-b border-gray-100 pb-2">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold">{doc.title}</p>
                          <p className="text-xs text-gray-500">
                            {doc.source_organization} | {doc.publication_date?.split('T')[0]} | {doc.document_type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          doc.authority_level === 'government_official' ? 'bg-blue-50 text-blue-700' :
                          doc.authority_level === 'peer_reviewed' ? 'bg-purple-50 text-purple-700' :
                          doc.authority_level === 'primary_source' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {doc.authority_level?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 6: Download Reports */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <Download className="h-5 w-5" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Reports</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
              Research-quality data
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl">
              Access structured datasets mirroring the rigour of university research centres.
              All data is open, reproducible, and community-verified.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <a href="/api/analysis/report?type=case-for-change" target="_blank" rel="noopener noreferrer"
                 className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
                <FileText className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Case for Change Report</p>
                <p className="text-sm text-gray-500">
                  Full dataset: ROGS spending, Indigenous overrepresentation, interventions,
                  outcomes, inquiries, campaigns, and key documents.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  JSON <ExternalLink className="h-3 w-3" />
                </span>
              </a>
              <a href="/api/analysis/report?type=inquiry-tracker" target="_blank" rel="noopener noreferrer"
                 className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
                <Landmark className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Inquiry &amp; Reform Tracker</p>
                <p className="text-sm text-gray-500">
                  All Australian inquiries, royal commissions, campaigns, reform status,
                  and timeline of key events.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  JSON <ExternalLink className="h-3 w-3" />
                </span>
              </a>
              <a href="/api/analysis/report?type=intervention-landscape" target="_blank" rel="noopener noreferrer"
                 className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
                <Heart className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Intervention Landscape</p>
                <p className="text-sm text-gray-500">
                  826 interventions, 506 outcomes, evidence matrix, and what-works analysis
                  across all intervention types.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  JSON <ExternalLink className="h-3 w-3" />
                </span>
              </a>
              <a href="/api/analysis/report?type=funding-analysis" target="_blank" rel="noopener noreferrer"
                 className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
                <DollarSign className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Funding Analysis</p>
                <p className="text-sm text-gray-500">
                  ROGS spending across youth justice, police, courts, corrections.
                  Top recipients, political donations, funding flows.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  JSON <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </div>

            <div className="mt-6 p-4 bg-white border-2 border-black rounded-lg">
              <p className="text-sm font-bold mb-2">Jurisdiction-specific reports</p>
              <p className="text-xs text-gray-500 mb-3">
                Add <code className="bg-gray-100 px-1 py-0.5 rounded">?jurisdiction=QLD</code> to any report URL
                for state-level data. Available: QLD, NSW, VIC, WA, SA, NT, ACT, TAS.
              </p>
              <div className="flex flex-wrap gap-2">
                {['QLD', 'NSW', 'VIC', 'WA', 'SA', 'NT', 'ACT', 'TAS'].map(state => (
                  <a key={state} href={`/api/analysis/report?type=jurisdiction&jurisdiction=${state}`}
                     target="_blank" rel="noopener noreferrer"
                     className="text-xs font-bold px-3 py-1.5 border-2 border-black rounded hover:bg-black hover:text-white transition-colors">
                    {state}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: What You Can Do */}
        <section className="section-padding">
          <div className="container-justice max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-8">
              Use this data
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              <Link href="/sector-map" className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <BarChart3 className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Sector Map</p>
                <p className="text-sm text-gray-500">
                  Explore 102,000+ entities, funding flows, and the full landscape of who's doing what.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link href="/intelligence/interventions" className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <Heart className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Interventions Database</p>
                <p className="text-sm text-gray-500">
                  Search {totalInterventions.toLocaleString()} verified community-based interventions with evidence.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  Search <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link href="/justice-funding" className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <DollarSign className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">Justice Spending</p>
                <p className="text-sm text-gray-500">
                  Track where every dollar of justice funding goes, by state, by source, by recipient.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  Track <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link href="/for-funders" className="border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <TrendingUp className="h-5 w-5 mb-3" />
                <p className="font-black mb-1">For Funders</p>
                <p className="text-sm text-gray-500">
                  Invest in proven community solutions with Governed Proof place-based intelligence.
                </p>
                <span className="text-sm font-bold inline-flex items-center gap-1 mt-3">
                  Learn more <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>

            <div className="text-center border-t-2 border-black pt-8">
              <p className="text-sm text-gray-500 mb-4">
                All data is open. All analysis is reproducible. All evidence is community-verified.
              </p>
              <p className="text-xs text-gray-400">
                Sources: Productivity Commission ROGS {latestYear} | ALMA Intelligence |
                GrantScope Civic Graph | AusTender | ACNC | ORIC
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
