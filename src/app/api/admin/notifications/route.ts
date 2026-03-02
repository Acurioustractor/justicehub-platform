import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  fetchNotificationTargets,
  generateClosingSoonNotifications,
  generateFundingAlertNotifications,
  persistFundingNotifications,
  type BasecampNotificationTarget,
  type NotificationPayload,
} from '@/lib/funding/notification-engine';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

// POST - Send notifications to basecamps
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const supabase = getServiceClient();
    const body = await request.json();
    const { type, organization_ids, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'notification type is required' },
        { status: 400 }
      );
    }

    const targetOrgs = await fetchNotificationTargets(
      supabase,
      Array.isArray(organization_ids) ? organization_ids : undefined
    );

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
          ...(await generateFundingAlertNotifications(supabase, targetOrgs))
        );
        break;

      case 'closing_soon':
        notifications.push(
          ...(await generateClosingSoonNotifications(supabase, targetOrgs))
        );
        break;

      case 'research_digest':
        notifications.push(
          ...(await generateResearchDigests(supabase, targetOrgs, data))
        );
        break;

      case 'weekly_report':
        notifications.push(
          ...(await generateWeeklyReports(supabase, targetOrgs))
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    const persisted = await persistFundingNotifications(supabase, notifications, {
      source: 'funding_notifications_admin',
      requestedBy: user.id,
    });

    let deliveriesStored = 0;
    const reportId = typeof data?.report_id === 'string' ? data.report_id : null;
    if (type === 'weekly_report' && reportId) {
      const { error: deliveryError } = await supabase
        .from('alma_report_deliveries')
        .insert(
          notifications.map(() => ({
            report_id: reportId,
            delivery_method: 'dashboard',
            status: 'sent',
            sent_at: new Date().toISOString(),
          }))
        );

      if (deliveryError) {
        console.error('Error storing report deliveries:', deliveryError);
      } else {
        deliveriesStored = notifications.length;
      }
    }

    return NextResponse.json({
      message: `${notifications.length} notifications generated`,
      notifications_sent: notifications.length,
      notifications_stored: persisted.stored,
      report_deliveries_stored: deliveriesStored,
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
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const supabase = getServiceClient();

    // Get recent notification stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      { count: totalDeliveries },
      { count: recentDeliveries },
      { count: totalFundingNotifications },
      { count: recentFundingNotifications },
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
        .from('agent_task_queue')
        .select('*', { count: 'exact', head: true })
        .in('source', ['funding_notifications_admin', 'funding_notifications_system0'])
        .eq('task_type', 'funding_notification'),
      supabase
        .from('agent_task_queue')
        .select('*', { count: 'exact', head: true })
        .in('source', ['funding_notifications_admin', 'funding_notifications_system0'])
        .eq('task_type', 'funding_notification')
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
        total_funding_notifications: totalFundingNotifications || 0,
        funding_notifications_last_7_days: recentFundingNotifications || 0,
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

// Helper: Generate research digests
async function generateResearchDigests(
  supabase: any,
  orgs: BasecampNotificationTarget[],
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
    const matched = evidence.filter((item: any) => {
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
          new_evidence: matched.slice(0, 10).map((item: any) => ({
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
  supabase: any,
  orgs: BasecampNotificationTarget[]
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
