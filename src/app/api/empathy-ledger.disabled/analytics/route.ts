/**
 * Empathy Ledger Analytics API Endpoint
 * 
 * Provides cross-project analytics and impact metrics from the Empathy Ledger system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { empathyLedgerService } from '@/lib/empathy-ledger/service';
import { EmpathyLedgerClient } from '@/lib/empathy-ledger/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type') || 'overview';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const projectNames = searchParams.get('projectNames')?.split(',');
    const metricTypes = searchParams.get('metricTypes')?.split(',');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Get user role and check permissions
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the organization
    if (user.role !== 'platform_admin') {
      const { data: membership, error: membershipError } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('organization_id', organizationId)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'You do not have permission to view this organization' },
          { status: 403 }
        );
      }
    }

    // Handle different analytics types
    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(organizationId, supabase);
        
      case 'cross_project':
        return await getCrossProjectAnalytics(organizationId, {
          dateFrom,
          dateTo,
          projectNames,
          metricTypes
        });
        
      case 'impact':
        return await getImpactMetrics(organizationId);
        
      case 'local':
        return await getLocalAnalytics(organizationId, supabase, {
          dateFrom,
          dateTo
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Must be: overview, cross_project, impact, or local' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get overview analytics combining local and cross-project data
 */
async function getOverviewAnalytics(organizationId: string, supabase: any) {
  try {
    // Get local metrics
    const { data: localStories } = await supabase
      .from('stories')
      .select('id, view_count, like_count, created_at, source')
      .eq('organization_id', organizationId)
      .eq('status', 'published');

    const { data: localServices } = await supabase
      .from('services')
      .select('id, success_rate')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const { data: localOpportunities } = await supabase
      .from('opportunities')
      .select('id, application_count')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // Get cross-project metrics
    const { data: crossProjectMetrics } = await supabase
      .from('cross_project_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Calculate overview metrics
    const overview = {
      local: {
        total_stories: localStories?.length || 0,
        total_views: localStories?.reduce((sum, story) => sum + (story.view_count || 0), 0) || 0,
        total_likes: localStories?.reduce((sum, story) => sum + (story.like_count || 0), 0) || 0,
        stories_by_source: {
          local: localStories?.filter(s => s.source === 'local').length || 0,
          airtable: localStories?.filter(s => s.source === 'airtable').length || 0,
          empathy_ledger: localStories?.filter(s => s.source === 'empathy_ledger').length || 0
        },
        total_services: localServices?.length || 0,
        average_success_rate: localServices?.length 
          ? localServices.reduce((sum, service) => sum + (service.success_rate || 0), 0) / localServices.length
          : 0,
        total_opportunities: localOpportunities?.length || 0,
        total_applications: localOpportunities?.reduce((sum, opp) => sum + (opp.application_count || 0), 0) || 0
      },
      cross_project: {
        projects: [...new Set(crossProjectMetrics?.map(m => m.project_name) || [])],
        total_metrics: crossProjectMetrics?.length || 0,
        latest_metrics: crossProjectMetrics?.slice(0, 10) || []
      },
      engagement: {
        stories_this_month: localStories?.filter(s => 
          new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length || 0,
        average_engagement_rate: localStories?.length 
          ? (localStories.reduce((sum, story) => sum + (story.like_count || 0), 0) / 
             localStories.reduce((sum, story) => sum + (story.view_count || 1), 0)) * 100
          : 0
      }
    };

    return NextResponse.json({
      success: true,
      analytics: overview,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    throw new Error(`Failed to get overview analytics: ${error.message}`);
  }
}

/**
 * Get cross-project analytics from Empathy Ledger
 */
async function getCrossProjectAnalytics(organizationId: string, filters: {
  dateFrom?: string | null;
  dateTo?: string | null;
  projectNames?: string[] | null;
  metricTypes?: string[] | null;
}) {
  try {
    const config = await empathyLedgerService.getOrganizationConfig(organizationId);
    if (!config) {
      return NextResponse.json({
        success: false,
        message: 'No Empathy Ledger configuration found for this organization'
      });
    }

    const client = new EmpathyLedgerClient(config);
    const analyticsResult = await client.getAnalytics({
      project_names: filters.projectNames || undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      metric_types: filters.metricTypes || undefined
    });

    return NextResponse.json({
      success: analyticsResult.success,
      analytics: analyticsResult.metrics,
      message: analyticsResult.message,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    throw new Error(`Failed to get cross-project analytics: ${error.message}`);
  }
}

/**
 * Get impact metrics from Empathy Ledger
 */
async function getImpactMetrics(organizationId: string) {
  try {
    const config = await empathyLedgerService.getOrganizationConfig(organizationId);
    if (!config) {
      return NextResponse.json({
        success: false,
        message: 'No Empathy Ledger configuration found for this organization'
      });
    }

    const client = new EmpathyLedgerClient(config);
    const impactResult = await client.getImpactMetrics();

    return NextResponse.json({
      success: impactResult.success,
      impact: impactResult.impact,
      message: impactResult.message,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    throw new Error(`Failed to get impact metrics: ${error.message}`);
  }
}

/**
 * Get local analytics from JusticeHub database
 */
async function getLocalAnalytics(organizationId: string, supabase: any, filters: {
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  try {
    let dateFilter = '';
    if (filters.dateFrom) {
      dateFilter += ` AND created_at >= '${filters.dateFrom}'`;
    }
    if (filters.dateTo) {
      dateFilter += ` AND created_at <= '${filters.dateTo}'`;
    }

    // Get detailed story analytics
    const { data: storyAnalytics } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        story_type,
        source,
        view_count,
        like_count,
        created_at,
        published_at,
        tags
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'published');

    // Get story interactions
    const { data: interactions } = await supabase
      .from('story_interactions')
      .select(`
        interaction_type,
        created_at,
        stories!inner(organization_id)
      `)
      .eq('stories.organization_id', organizationId);

    // Get mentorship analytics
    const { data: mentorships } = await supabase
      .from('mentorships')
      .select(`
        status,
        created_at,
        youth_profiles!inner(
          users!inner(
            org_memberships!inner(organization_id)
          )
        )
      `)
      .eq('youth_profiles.users.org_memberships.organization_id', organizationId);

    // Calculate analytics
    const analytics = {
      stories: {
        total: storyAnalytics?.length || 0,
        by_type: storyAnalytics?.reduce((acc, story) => {
          acc[story.story_type] = (acc[story.story_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        by_source: storyAnalytics?.reduce((acc, story) => {
          acc[story.source] = (acc[story.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        total_views: storyAnalytics?.reduce((sum, story) => sum + (story.view_count || 0), 0) || 0,
        total_likes: storyAnalytics?.reduce((sum, story) => sum + (story.like_count || 0), 0) || 0,
        most_viewed: storyAnalytics?.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5) || [],
        most_liked: storyAnalytics?.sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 5) || []
      },
      interactions: {
        total: interactions?.length || 0,
        by_type: interactions?.reduce((acc, interaction) => {
          acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      },
      mentorships: {
        total: mentorships?.length || 0,
        by_status: mentorships?.reduce((acc, mentorship) => {
          acc[mentorship.status] = (acc[mentorship.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      }
    };

    return NextResponse.json({
      success: true,
      analytics,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    throw new Error(`Failed to get local analytics: ${error.message}`);
  }
}