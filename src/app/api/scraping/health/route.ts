/**
 * Scraper Health Monitoring API
 * 
 * Provides health metrics and status for the AI scraping system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { checkAPIHealth } from '@/lib/api/config';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // Get system health metrics
    const healthChecks = await Promise.allSettled([
      checkAPIHealth(),
      getScrapingMetrics(),
      getDataQualityMetrics(),
      getJobStatusMetrics()
    ]);

    const [apiHealth, scrapingMetrics, qualityMetrics, jobMetrics] = healthChecks.map(
      result => result.status === 'fulfilled' ? result.value : null
    );

    // Calculate overall health score
    const healthScore = calculateOverallHealth(apiHealth, scrapingMetrics, qualityMetrics, jobMetrics);

    return NextResponse.json({
      overall_health: healthScore,
      timestamp: new Date().toISOString(),
      api_services: apiHealth,
      scraping_metrics: scrapingMetrics,
      data_quality: qualityMetrics,
      job_status: jobMetrics,
      alerts: await getActiveAlerts()
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        error: 'Health check failed',
        overall_health: 'critical',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function getScrapingMetrics() {
  const supabase = createSupabaseClient();
  
  // Get data source health
  const { data: sources } = await supabase
    .from('data_sources')
    .select('id, name, type, last_successful_scrape, active, reliability_score');

  // Get recent scraping activity
  const { data: recentJobs } = await supabase
    .from('processing_jobs')
    .select('status, completed_at, error_message')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Calculate metrics
  const activeSources = sources?.filter(s => s.active).length || 0;
  const staleThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleSources = sources?.filter(s => 
    s.active && (!s.last_successful_scrape || new Date(s.last_successful_scrape) < staleThreshold)
  ).length || 0;

  const jobStats = recentJobs?.reduce((acc: any, job: any) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const successRate = recentJobs?.length ? 
    ((jobStats.completed || 0) / recentJobs.length) * 100 : 100;

  return {
    active_sources: activeSources,
    stale_sources: staleSources,
    avg_reliability_score: sources?.reduce((sum, s) => sum + s.reliability_score, 0) / (sources?.length || 1),
    recent_job_stats: jobStats,
    success_rate_24h: Math.round(successRate * 100) / 100
  };
}

async function getDataQualityMetrics() {
  const supabase = createSupabaseClient();
  
  // Get recent quality metrics
  const { data: qualityData } = await supabase
    .from('data_quality_metrics')
    .select('metric_type, metric_value, organization_id')
    .gte('measurement_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (!qualityData || qualityData.length === 0) {
    return {
      avg_completeness: 0,
      avg_accuracy: 0,
      organizations_assessed: 0,
      quality_trend: 'stable'
    };
  }

  // Calculate average quality scores
  const completenessScores = qualityData
    .filter(d => d.metric_type === 'completeness')
    .map(d => d.metric_value);
  
  const accuracyScores = qualityData
    .filter(d => d.metric_type === 'accuracy')
    .map(d => d.metric_value);

  const avgCompleteness = completenessScores.length ? 
    completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length : 0;
  
  const avgAccuracy = accuracyScores.length ?
    accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length : 0;

  const uniqueOrganizations = new Set(qualityData.map(d => d.organization_id)).size;

  return {
    avg_completeness: Math.round(avgCompleteness * 100) / 100,
    avg_accuracy: Math.round(avgAccuracy * 100) / 100,
    organizations_assessed: uniqueOrganizations,
    quality_trend: 'stable' // Could be enhanced with trend analysis
  };
}

async function getJobStatusMetrics() {
  const supabase = createSupabaseClient();
  
  const timeRanges = {
    '1h': new Date(Date.now() - 60 * 60 * 1000),
    '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
    '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  };

  const metrics: any = {};

  for (const [period, since] of Object.entries(timeRanges)) {
    const { data: jobs } = await supabase
      .from('processing_jobs')
      .select('status, type, progress_percentage, processing_time_ms')
      .gte('created_at', since.toISOString());

    const statusCounts = jobs?.reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const avgProgress = jobs?.length ?
      jobs.reduce((sum, job) => sum + (job.progress_percentage || 0), 0) / jobs.length : 0;

    metrics[period] = {
      total_jobs: jobs?.length || 0,
      status_breakdown: statusCounts,
      avg_progress: Math.round(avgProgress * 100) / 100
    };
  }

  return metrics;
}

async function getActiveAlerts() {
  const supabase = createSupabaseClient();
  
  const { data: alerts } = await supabase
    .from('scraper_health_metrics')
    .select('*')
    .in('status', ['warning', 'critical'])
    .gte('measurement_timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('measurement_timestamp', { ascending: false })
    .limit(10);

  return alerts || [];
}

function calculateOverallHealth(
  apiHealth: any,
  scrapingMetrics: any,
  qualityMetrics: any,
  jobMetrics: any
): 'healthy' | 'warning' | 'critical' {
  
  let score = 100;
  
  // API health (30% weight)
  if (!apiHealth?.supabase) score -= 30;
  if (!apiHealth?.openai && !apiHealth?.anthropic) score -= 15;
  
  // Scraping metrics (25% weight)
  if (scrapingMetrics?.stale_sources > 0) score -= Math.min(20, scrapingMetrics.stale_sources * 5);
  if (scrapingMetrics?.success_rate_24h < 80) score -= 15;
  
  // Data quality (25% weight)
  if (qualityMetrics?.avg_completeness < 0.7) score -= 15;
  if (qualityMetrics?.avg_accuracy < 0.8) score -= 10;
  
  // Job processing (20% weight)
  const recent24h = jobMetrics?.['24h'];
  if (recent24h?.status_breakdown?.failed > (recent24h?.total_jobs * 0.2)) score -= 15;
  
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}