import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BasecampMatch {
  organization_id: string;
  organization_name: string;
  jurisdictions: string[];
  focus_areas: string[];
}

interface NotificationPayload {
  type: 'funding_alert' | 'research_digest' | 'closing_soon' | 'weekly_report';
  organization_id?: string;
  data: Record<string, unknown>;
}

// POST - Send notifications to basecamps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, organization_ids, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'notification type is required' },
        { status: 400 }
      );
    }

    // Get target organizations
    let targetOrgs: BasecampMatch[] = [];

    if (organization_ids && organization_ids.length > 0) {
      // Specific organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, metadata')
        .in('id', organization_ids);

      if (error) throw error;

      targetOrgs = (orgs || []).map((org) => ({
        organization_id: org.id,
        organization_name: org.name,
        jurisdictions: org.metadata?.jurisdictions || [],
        focus_areas: org.metadata?.focus_areas || [],
      }));
    } else {
      // All basecamps (partner_tier = 'basecamp')
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, metadata')
        .eq('partner_tier', 'basecamp');

      if (error) throw error;

      targetOrgs = (orgs || []).map((org) => ({
        organization_id: org.id,
        organization_name: org.name,
        jurisdictions: org.metadata?.jurisdictions || [],
        focus_areas: org.metadata?.focus_areas || [],
      }));
    }

    if (targetOrgs.length === 0) {
      return NextResponse.json({
        message: 'No target organizations found',
        notifications_sent: 0,
      });
    }

    // Generate notifications based on type
    const notifications: NotificationPayload[] = [];

    switch (type) {
      case 'funding_alert':
        notifications.push(
          ...(await generateFundingAlerts(targetOrgs, data))
        );
        break;

      case 'closing_soon':
        notifications.push(
          ...(await generateClosingSoonAlerts(targetOrgs))
        );
        break;

      case 'research_digest':
        notifications.push(
          ...(await generateResearchDigests(targetOrgs, data))
        );
        break;

      case 'weekly_report':
        notifications.push(
          ...(await generateWeeklyReports(targetOrgs))
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    // Store notifications (for in-app display)
    const { error: insertError } = await supabase
      .from('alma_report_deliveries')
      .insert(
        notifications.map((n) => ({
          report_id: data?.report_id || null,
          delivery_method: 'dashboard',
          status: 'sent',
          sent_at: new Date().toISOString(),
        }))
      );

    if (insertError) {
      console.error('Error storing notifications:', insertError);
    }

    return NextResponse.json({
      message: `${notifications.length} notifications generated`,
      notifications_sent: notifications.length,
      target_organizations: targetOrgs.length,
      type,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

// GET - Get notification stats
export async function GET() {
  try {
    // Get recent notification stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      { count: totalDeliveries },
      { count: recentDeliveries },
      { data: basecamps },
    ] = await Promise.all([
      supabase
        .from('alma_report_deliveries')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('alma_report_deliveries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase
        .from('organizations')
        .select('id, name')
        .eq('partner_tier', 'basecamp'),
    ]);

    return NextResponse.json({
      stats: {
        total_deliveries: totalDeliveries || 0,
        deliveries_last_7_days: recentDeliveries || 0,
        active_basecamps: basecamps?.length || 0,
      },
      basecamps: basecamps || [],
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification stats' },
      { status: 500 }
    );
  }
}

// Helper: Generate funding alerts for matched opportunities
async function generateFundingAlerts(
  orgs: BasecampMatch[],
  data?: Record<string, unknown>
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];

  // Get recent high-relevance funding opportunities
  const { data: opportunities } = await supabase
    .from('alma_funding_opportunities')
    .select('*')
    .in('status', ['open', 'closing_soon'])
    .gte('relevance_score', 50)
    .order('relevance_score', { ascending: false })
    .limit(20);

  if (!opportunities || opportunities.length === 0) {
    return notifications;
  }

  for (const org of orgs) {
    // Find opportunities matching this org's jurisdictions
    const matchedOpps = opportunities.filter((opp) => {
      const oppJurisdictions = opp.jurisdictions || [];
      const hasJurisdictionMatch =
        oppJurisdictions.includes('National') ||
        oppJurisdictions.some((j: string) => org.jurisdictions.includes(j));

      // Check focus area overlap
      const oppFocusAreas = opp.focus_areas || [];
      const hasFocusMatch = oppFocusAreas.some((f: string) =>
        org.focus_areas.includes(f)
      );

      return hasJurisdictionMatch || hasFocusMatch;
    });

    if (matchedOpps.length > 0) {
      notifications.push({
        type: 'funding_alert',
        organization_id: org.organization_id,
        data: {
          organization_name: org.organization_name,
          matched_opportunities: matchedOpps.slice(0, 5).map((opp) => ({
            id: opp.id,
            name: opp.name,
            funder: opp.funder_name,
            amount: opp.max_grant_amount,
            deadline: opp.deadline,
            relevance: opp.relevance_score,
          })),
          total_matches: matchedOpps.length,
        },
      });
    }
  }

  return notifications;
}

// Helper: Generate closing soon alerts
async function generateClosingSoonAlerts(
  orgs: BasecampMatch[]
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];

  // Get opportunities closing in next 14 days
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  const { data: closingSoon } = await supabase
    .from('alma_funding_opportunities')
    .select('*')
    .in('status', ['open', 'closing_soon'])
    .gt('deadline', new Date().toISOString())
    .lt('deadline', futureDate.toISOString())
    .order('deadline', { ascending: true });

  if (!closingSoon || closingSoon.length === 0) {
    return notifications;
  }

  for (const org of orgs) {
    const matched = closingSoon.filter((opp) => {
      const oppJurisdictions = opp.jurisdictions || [];
      return (
        oppJurisdictions.includes('National') ||
        oppJurisdictions.some((j: string) => org.jurisdictions.includes(j))
      );
    });

    if (matched.length > 0) {
      notifications.push({
        type: 'closing_soon',
        organization_id: org.organization_id,
        data: {
          organization_name: org.organization_name,
          closing_soon: matched.map((opp) => ({
            id: opp.id,
            name: opp.name,
            funder: opp.funder_name,
            deadline: opp.deadline,
            days_left: Math.ceil(
              (new Date(opp.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            ),
          })),
        },
      });
    }
  }

  return notifications;
}

// Helper: Generate research digests
async function generateResearchDigests(
  orgs: BasecampMatch[],
  data?: Record<string, unknown>
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];
  const periodDays = (data?.period_days as number) || 7;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get recent evidence
  const { data: evidence } = await supabase
    .from('alma_evidence')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (!evidence || evidence.length === 0) {
    return notifications;
  }

  for (const org of orgs) {
    // Filter evidence relevant to this org
    const matched = evidence.filter((item) => {
      const jurisdictions = item.metadata?.jurisdictions || [];
      const topics = item.metadata?.topics || [];

      const hasJurisdictionMatch =
        jurisdictions.includes('National') ||
        jurisdictions.some((j: string) => org.jurisdictions.includes(j));

      const hasTopicMatch = topics.some((t: string) =>
        org.focus_areas.includes(t)
      );

      return hasJurisdictionMatch || hasTopicMatch;
    });

    if (matched.length > 0) {
      notifications.push({
        type: 'research_digest',
        organization_id: org.organization_id,
        data: {
          organization_name: org.organization_name,
          period_days: periodDays,
          new_evidence: matched.slice(0, 10).map((item) => ({
            id: item.id,
            title: item.title,
            type: item.evidence_type,
            summary: item.findings?.substring(0, 200),
          })),
          total_new: matched.length,
        },
      });
    }
  }

  return notifications;
}

// Helper: Generate weekly reports
async function generateWeeklyReports(
  orgs: BasecampMatch[]
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];

  // Get latest weekly report
  const { data: latestReport } = await supabase
    .from('alma_weekly_reports')
    .select('*')
    .eq('report_type', 'comprehensive')
    .eq('status', 'published')
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (!latestReport) {
    return notifications;
  }

  for (const org of orgs) {
    notifications.push({
      type: 'weekly_report',
      organization_id: org.organization_id,
      data: {
        organization_name: org.organization_name,
        report_id: latestReport.id,
        report_title: latestReport.title,
        executive_summary: latestReport.executive_summary,
        highlights: latestReport.highlights,
        alerts: latestReport.alerts,
      },
    });
  }

  return notifications;
}
