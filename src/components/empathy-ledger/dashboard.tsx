/**
 * Empathy Ledger Dashboard Component
 * 
 * Displays cross-project analytics and impact metrics from the Empathy Ledger system.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, TrendingUp, Users, BookOpen, Target } from 'lucide-react';

interface EmpathyLedgerDashboardProps {
  organizationId: string;
}

interface AnalyticsData {
  local: {
    total_stories: number;
    total_views: number;
    total_likes: number;
    stories_by_source: Record<string, number>;
    total_services: number;
    average_success_rate: number;
    total_opportunities: number;
    total_applications: number;
  };
  cross_project: {
    projects: string[];
    total_metrics: number;
    latest_metrics: Array<{
      project_name: string;
      metric_type: string;
      metric_value: number;
      metric_date: string;
    }>;
  };
  engagement: {
    stories_this_month: number;
    average_engagement_rate: number;
  };
}

interface ImpactData {
  total_stories: number;
  total_participants: number;
  average_success_rate: number;
  total_cost_savings: number;
  projects_count: number;
  organizations_count: number;
  engagement_metrics: {
    total_views: number;
    total_likes: number;
    total_shares: number;
    average_engagement_rate: number;
  };
}

export function EmpathyLedgerDashboard({ organizationId }: EmpathyLedgerDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchImpactMetrics();
  }, [organizationId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/empathy-ledger/analytics?organizationId=${organizationId}&type=overview`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }

      setAnalytics(data.analytics);
      setLastUpdated(new Date(data.generated_at));
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchImpactMetrics = async () => {
    try {
      const response = await fetch(`/api/empathy-ledger/analytics?organizationId=${organizationId}&type=impact`);
      const data = await response.json();

      if (response.ok && data.success) {
        setImpact(data.impact);
      }
    } catch (err) {
      console.error('Error fetching impact metrics:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/empathy-ledger/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          syncType: 'import',
          filters: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sync failed');
      }

      // Refresh analytics after successful sync
      await fetchAnalytics();
      await fetchImpactMetrics();

    } catch (err: any) {
      console.error('Error syncing:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/empathy-ledger/analytics?organizationId=${organizationId}&type=local&format=csv`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `empathy-ledger-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Empathy Ledger Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Empathy Ledger Dashboard</h2>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card variant="error">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Failed to load dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empathy Ledger Dashboard</h2>
          <p className="text-gray-600">
            Cross-project analytics and impact metrics
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated {lastUpdated.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Button
            onClick={handleExportData}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Card variant="warning">
          <CardContent className="p-4">
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Impact Overview */}
      {impact && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            value={impact.total_stories.toLocaleString()}
            label="Total Stories"
            description="Across all projects"
            trend="up"
            trendValue="+12% this month"
          />
          <MetricCard
            value={impact.total_participants.toLocaleString()}
            label="Total Participants"
            description="Young people supported"
            trend="up"
            trendValue="+8% this month"
          />
          <MetricCard
            value={`${impact.average_success_rate.toFixed(1)}%`}
            label="Average Success Rate"
            description="Across all programs"
            trend="up"
            trendValue="+2.3% this quarter"
          />
          <MetricCard
            value={`$${(impact.total_cost_savings / 1000000).toFixed(1)}M`}
            label="Cost Savings"
            description="Compared to detention"
            trend="up"
            trendValue="+15% this year"
          />
        </div>
      )}

      {/* Local vs Cross-Project Comparison */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Local Platform Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Stories</span>
                  <span className="font-bold">{analytics.local.total_stories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Views</span>
                  <span className="font-bold">{analytics.local.total_views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Likes</span>
                  <span className="font-bold">{analytics.local.total_likes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Services</span>
                  <span className="font-bold">{analytics.local.total_services}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="font-bold">{analytics.local.average_success_rate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Cross-Project Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connected Projects</span>
                  <span className="font-bold">{analytics.cross_project.projects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Metrics</span>
                  <span className="font-bold">{analytics.cross_project.total_metrics}</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Connected Projects:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analytics.cross_project.projects.map((project) => (
                      <span
                        key={project}
                        className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                      >
                        {project}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Story Sources Breakdown */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Story Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analytics.local.stories_by_source).map(([source, count]) => (
                <div key={source} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-sm font-medium capitalize">
                    {source.replace('_', ' ')} Stories
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Metrics */}
      {analytics && impact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Engagement Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Stories This Month</span>
                  <span className="font-bold">{analytics.engagement.stories_this_month}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Engagement Rate</span>
                  <span className="font-bold">{analytics.engagement.average_engagement_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cross-Project Views</span>
                  <span className="font-bold">{impact.engagement_metrics.total_views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cross-Project Likes</span>
                  <span className="font-bold">{impact.engagement_metrics.total_likes.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Network Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connected Organizations</span>
                  <span className="font-bold">{impact.organizations_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Projects</span>
                  <span className="font-bold">{impact.projects_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Network Engagement Rate</span>
                  <span className="font-bold">{impact.engagement_metrics.average_engagement_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Shares</span>
                  <span className="font-bold">{impact.engagement_metrics.total_shares.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Cross-Project Metrics */}
      {analytics && analytics.cross_project.latest_metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Cross-Project Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Project</th>
                    <th className="text-left py-2">Metric</th>
                    <th className="text-right py-2">Value</th>
                    <th className="text-right py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.cross_project.latest_metrics.slice(0, 10).map((metric, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{metric.project_name}</td>
                      <td className="py-2 capitalize">{metric.metric_type.replace('_', ' ')}</td>
                      <td className="py-2 text-right font-mono">
                        {metric.metric_type.includes('rate') || metric.metric_type.includes('percentage')
                          ? `${metric.metric_value.toFixed(1)}%`
                          : metric.metric_value.toLocaleString()
                        }
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {new Date(metric.metric_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}