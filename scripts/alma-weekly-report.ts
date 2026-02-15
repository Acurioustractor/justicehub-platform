#!/usr/bin/env npx tsx

/**
 * ALMA Weekly Intelligence Report Generator
 *
 * Generates comprehensive weekly reports for basecamps including:
 * - Funding opportunities overview
 * - Research highlights
 * - Sector movements
 * - Recommended actions
 *
 * Usage:
 *   npx tsx scripts/alma-weekly-report.ts [options]
 *
 * Options:
 *   --week-start <YYYY-MM-DD>  Specify week start date (default: current week Monday)
 *   --type <type>              Report type: comprehensive | funding | research (default: comprehensive)
 *   --org <id>                 Generate basecamp-specific report for organization
 *   --dry-run                  Preview without saving to database
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);

interface Options {
  weekStart: string | null;
  reportType: 'comprehensive' | 'funding' | 'research';
  organizationId: string | null;
  dryRun: boolean;
}

const options: Options = {
  weekStart: null,
  reportType: 'comprehensive',
  organizationId: null,
  dryRun: args.includes('--dry-run'),
};

const weekStartIndex = args.indexOf('--week-start');
if (weekStartIndex !== -1 && args[weekStartIndex + 1]) {
  options.weekStart = args[weekStartIndex + 1];
}

const typeIndex = args.indexOf('--type');
if (typeIndex !== -1 && args[typeIndex + 1]) {
  options.reportType = args[typeIndex + 1] as Options['reportType'];
}

const orgIndex = args.indexOf('--org');
if (orgIndex !== -1 && args[orgIndex + 1]) {
  options.organizationId = args[orgIndex + 1];
}

// Helpers
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number | null): string {
  if (!amount) return 'N/A';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Data fetching functions
async function fetchFundingData(weekStart: string) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // New opportunities this week
  const { data: newOpportunities } = await supabase
    .from('alma_funding_opportunities')
    .select('*')
    .gte('created_at', weekStart)
    .lt('created_at', weekEnd.toISOString())
    .in('status', ['open', 'closing_soon'])
    .order('relevance_score', { ascending: false })
    .limit(10);

  // Closing soon (within 14 days)
  const { data: closingSoon } = await supabase
    .from('alma_funding_opportunities')
    .select('*')
    .gt('deadline', new Date().toISOString())
    .lt('deadline', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
    .in('status', ['open', 'closing_soon'])
    .order('deadline', { ascending: true })
    .limit(10);

  // Total active
  const { count: activeCount } = await supabase
    .from('alma_funding_opportunities')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'closing_soon']);

  // Total available amount
  const { data: amounts } = await supabase
    .from('alma_funding_opportunities')
    .select('total_pool_amount')
    .in('status', ['open', 'closing_soon'])
    .not('total_pool_amount', 'is', null);

  const totalAvailable = amounts?.reduce((sum, a) => sum + (a.total_pool_amount || 0), 0) || 0;

  // By source type
  const { data: bySource } = await supabase
    .from('alma_funding_opportunities')
    .select('source_type')
    .in('status', ['open', 'closing_soon']);

  const sourceTypeCounts: Record<string, number> = {};
  bySource?.forEach((item) => {
    sourceTypeCounts[item.source_type] = (sourceTypeCounts[item.source_type] || 0) + 1;
  });

  return {
    new_opportunities: newOpportunities || [],
    closing_soon: closingSoon || [],
    total_active: activeCount || 0,
    total_available: totalAvailable,
    by_source: sourceTypeCounts,
  };
}

async function fetchResearchData(weekStart: string) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // New evidence this week
  const { data: newEvidence } = await supabase
    .from('alma_evidence')
    .select('*')
    .gte('created_at', weekStart)
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  // Total evidence count
  const { count: totalEvidence } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true });

  return {
    new_evidence: newEvidence || [],
    total_evidence: totalEvidence || 0,
  };
}

async function fetchStatsSnapshot() {
  const [
    { count: services },
    { count: interventions },
    { count: organizations },
    { count: evidence },
  ] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('alma_evidence').select('*', { count: 'exact', head: true }),
  ]);

  // Services by state
  const { data: servicesByState } = await supabase
    .from('services')
    .select('state')
    .eq('status', 'active')
    .not('state', 'is', null);

  const stateDistribution: Record<string, number> = {};
  servicesByState?.forEach((s) => {
    stateDistribution[s.state || 'Unknown'] = (stateDistribution[s.state || 'Unknown'] || 0) + 1;
  });

  return {
    total_services: services || 0,
    total_interventions: interventions || 0,
    total_organizations: organizations || 0,
    total_evidence: evidence || 0,
    services_by_state: stateDistribution,
  };
}

// Report generation
interface FundingOpportunity {
  id: string;
  name: string;
  funder_name: string;
  max_grant_amount?: number;
  deadline?: string;
  relevance_score?: number;
  source_type: string;
  jurisdictions?: string[];
}

function generateExecutiveSummary(
  fundingData: Awaited<ReturnType<typeof fetchFundingData>>,
  researchData: Awaited<ReturnType<typeof fetchResearchData>>,
  stats: Awaited<ReturnType<typeof fetchStatsSnapshot>>
): string {
  const parts: string[] = [];

  // Funding summary
  if (fundingData.new_opportunities.length > 0) {
    parts.push(`${fundingData.new_opportunities.length} new funding opportunities identified this week`);
  }
  if (fundingData.closing_soon.length > 0) {
    parts.push(`${fundingData.closing_soon.length} opportunities closing within 14 days`);
  }
  if (fundingData.total_available > 0) {
    parts.push(`Total available funding pool: ${formatCurrency(fundingData.total_available)}`);
  }

  // Research summary
  if (researchData.new_evidence.length > 0) {
    parts.push(`${researchData.new_evidence.length} new research items indexed`);
  }

  // Coverage summary
  parts.push(`Platform coverage: ${stats.total_services} services across ${Object.keys(stats.services_by_state).length} jurisdictions`);

  return parts.join('. ') + '.';
}

function generateHighlights(fundingData: Awaited<ReturnType<typeof fetchFundingData>>): string[] {
  const highlights: string[] = [];

  if (fundingData.new_opportunities.length > 0) {
    highlights.push(`${fundingData.new_opportunities.length} new funding opportunities added to the pipeline`);

    // Highlight top opportunity
    const topOpp = fundingData.new_opportunities[0] as FundingOpportunity;
    if (topOpp) {
      highlights.push(
        `Notable: ${topOpp.name} from ${topOpp.funder_name}${
          topOpp.max_grant_amount ? ` (up to ${formatCurrency(topOpp.max_grant_amount)})` : ''
        }`
      );
    }
  }

  // Source type breakdown
  const sourceBreakdown = Object.entries(fundingData.by_source)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');
  if (sourceBreakdown) {
    highlights.push(`Active opportunities by source: ${sourceBreakdown}`);
  }

  return highlights;
}

function generateAlerts(fundingData: Awaited<ReturnType<typeof fetchFundingData>>): string[] {
  const alerts: string[] = [];

  if (fundingData.closing_soon.length > 0) {
    alerts.push(`ACTION REQUIRED: ${fundingData.closing_soon.length} funding opportunities closing within 14 days`);

    // List closing opportunities
    fundingData.closing_soon.slice(0, 5).forEach((opp) => {
      const opportunity = opp as FundingOpportunity;
      const deadline = opportunity.deadline ? new Date(opportunity.deadline) : null;
      const daysLeft = deadline
        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      alerts.push(
        `• ${opportunity.name} (${opportunity.funder_name}): ${
          daysLeft !== null ? `${daysLeft} days remaining` : 'deadline approaching'
        }`
      );
    });
  }

  return alerts;
}

function generateRecommendedActions(
  fundingData: Awaited<ReturnType<typeof fetchFundingData>>,
  researchData: Awaited<ReturnType<typeof fetchResearchData>>
): string[] {
  const actions: string[] = [];

  if (fundingData.closing_soon.length > 0) {
    actions.push('Review closing-soon opportunities and prioritize applications');
  }

  if (fundingData.new_opportunities.length > 0) {
    actions.push('Assess new opportunities for basecamp alignment');
  }

  // High relevance opportunities
  const highRelevance = fundingData.new_opportunities.filter(
    (o) => (o as FundingOpportunity).relevance_score && (o as FundingOpportunity).relevance_score! >= 70
  );
  if (highRelevance.length > 0) {
    actions.push(`${highRelevance.length} high-relevance opportunities identified - review for immediate action`);
  }

  actions.push('Share relevant opportunities with partner organizations');

  if (researchData.new_evidence.length > 0) {
    actions.push('Review new evidence library additions for program development insights');
  }

  return actions;
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('ALMA Weekly Intelligence Report Generator');
  console.log('='.repeat(60));
  console.log(`Options: ${JSON.stringify(options)}`);
  console.log('');

  const weekStart = options.weekStart || getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  console.log(`Report Period: ${formatDate(weekStart)} - ${formatDate(weekEnd.toISOString())}`);
  console.log('');

  // Fetch all data
  console.log('Fetching data...');
  const [fundingData, researchData, statsSnapshot] = await Promise.all([
    fetchFundingData(weekStart),
    fetchResearchData(weekStart),
    fetchStatsSnapshot(),
  ]);

  console.log(`  - Funding: ${fundingData.total_active} active opportunities`);
  console.log(`  - Research: ${researchData.total_evidence} total evidence items`);
  console.log(`  - Platform: ${statsSnapshot.total_services} services`);
  console.log('');

  // Generate report content
  const executiveSummary = generateExecutiveSummary(fundingData, researchData, statsSnapshot);
  const highlights = generateHighlights(fundingData);
  const alerts = generateAlerts(fundingData);
  const actions = generateRecommendedActions(fundingData, researchData);

  // Create report object
  const report = {
    week_start: weekStart,
    week_end: weekEnd.toISOString().split('T')[0],
    report_type: options.reportType,
    organization_id: options.organizationId,
    title: `ALMA Weekly Intelligence - Week of ${formatDate(weekStart)}`,
    executive_summary: executiveSummary,
    funding_section: {
      new_opportunities: fundingData.new_opportunities.map((o) => ({
        id: (o as FundingOpportunity).id,
        name: (o as FundingOpportunity).name,
        funder: (o as FundingOpportunity).funder_name,
        amount: (o as FundingOpportunity).max_grant_amount,
        deadline: (o as FundingOpportunity).deadline,
        relevance: (o as FundingOpportunity).relevance_score,
      })),
      closing_soon: fundingData.closing_soon.map((o) => ({
        id: (o as FundingOpportunity).id,
        name: (o as FundingOpportunity).name,
        funder: (o as FundingOpportunity).funder_name,
        deadline: (o as FundingOpportunity).deadline,
      })),
      total_active: fundingData.total_active,
      total_available: fundingData.total_available,
      by_source: fundingData.by_source,
    },
    research_section: {
      new_evidence: researchData.new_evidence.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.evidence_type,
      })),
      total_evidence: researchData.total_evidence,
    },
    stats_snapshot: statsSnapshot,
    highlights,
    alerts,
    recommended_actions: actions,
    data_sources_used: ['alma_funding_opportunities', 'alma_evidence', 'services', 'organizations'],
    status: 'draft' as const,
  };

  // Print report preview
  console.log('='.repeat(60));
  console.log('REPORT PREVIEW');
  console.log('='.repeat(60));
  console.log('');
  console.log(`# ${report.title}`);
  console.log('');
  console.log('## Executive Summary');
  console.log(executiveSummary);
  console.log('');

  console.log('## Highlights');
  highlights.forEach((h) => console.log(`• ${h}`));
  console.log('');

  if (alerts.length > 0) {
    console.log('## Alerts');
    alerts.forEach((a) => console.log(a));
    console.log('');
  }

  console.log('## Recommended Actions');
  actions.forEach((a, i) => console.log(`${i + 1}. ${a}`));
  console.log('');

  console.log('## Statistics Snapshot');
  console.log(`• Services: ${statsSnapshot.total_services}`);
  console.log(`• Interventions: ${statsSnapshot.total_interventions}`);
  console.log(`• Organizations: ${statsSnapshot.total_organizations}`);
  console.log(`• Evidence Records: ${statsSnapshot.total_evidence}`);
  console.log('');

  if (options.dryRun) {
    console.log('DRY RUN - Report not saved to database');
    return;
  }

  // Save to database
  console.log('Saving report to database...');
  const { data: savedReport, error } = await supabase
    .from('alma_weekly_reports')
    .upsert([report], { onConflict: 'week_start,report_type,organization_id' })
    .select()
    .single();

  if (error) {
    console.error('Failed to save report:', error.message);
    process.exit(1);
  }

  console.log(`Report saved with ID: ${savedReport.id}`);
  console.log('');
  console.log('='.repeat(60));
  console.log('Report generation complete!');
  console.log(`View at: https://justicehub.org.au/admin/funding/reports/${savedReport.id}`);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
