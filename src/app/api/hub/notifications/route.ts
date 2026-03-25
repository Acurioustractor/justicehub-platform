import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

interface Notification {
  id: string;
  type: 'new_member' | 'org_claimed' | 'media_coverage' | 'milestone' | 'action';
  message: string;
  detail?: string;
  state?: string;
  created_at: string;
}

/**
 * GET /api/hub/notifications
 *
 * Generates cross-role notifications from recent platform activity.
 * Personalized to the user's state/role where possible.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  // Get user's profile for personalization
  const { data: profile } = await service
    .from('public_profiles')
    .select('location, role_tags')
    .eq('user_id', user.id)
    .single();

  const userState = profile?.location || '';
  const roleTags: string[] = (profile as any)?.role_tags || [];
  const memberType = roleTags.find((t: string) => t.startsWith('contained_'))?.replace('contained_', '') || '';

  const notifications: Notification[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. New members who joined recently (cross-role visibility)
  const { data: recentMembers } = await service
    .from('public_profiles')
    .select('id, role_tags, location, created_at')
    .not('role_tags', 'is', null)
    .gte('created_at', thirtyDaysAgo)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentMembers) {
    // Aggregate by role+state for concise notifications
    const roleStateMap: Record<string, { count: number; latest: string }> = {};

    for (const m of recentMembers) {
      const tags: string[] = (m as any).role_tags || [];
      const containedTag = tags.find((t: string) => t.startsWith('contained_'));
      if (!containedTag) continue;

      const role = containedTag.replace('contained_', '');
      const loc = (m as any).location || 'unknown';
      const key = `${role}:${loc}`;

      if (!roleStateMap[key]) {
        roleStateMap[key] = { count: 0, latest: (m as any).created_at };
      }
      roleStateMap[key].count++;
    }

    const ROLE_LABELS: Record<string, string> = {
      organization: 'organisation rep',
      media: 'media contact',
      supporter: 'supporter',
      funder: 'funder',
      lived_experience: 'lived experience voice',
    };

    for (const [key, { count, latest }] of Object.entries(roleStateMap)) {
      const [role, loc] = key.split(':');
      const roleLabel = ROLE_LABELS[role] || role;
      const isLocal = loc === userState;

      // Prioritize local notifications
      if (count === 1) {
        notifications.push({
          id: `member-${key}`,
          type: 'new_member',
          message: `A new ${roleLabel} joined${loc !== 'unknown' ? ` in ${loc}` : ''}`,
          detail: isLocal ? 'In your region' : undefined,
          state: loc !== 'unknown' ? loc : undefined,
          created_at: latest,
        });
      } else {
        notifications.push({
          id: `member-${key}`,
          type: 'new_member',
          message: `${count} new ${roleLabel}${count > 1 ? 's' : ''} joined${loc !== 'unknown' ? ` in ${loc}` : ''}`,
          detail: isLocal ? 'In your region' : undefined,
          state: loc !== 'unknown' ? loc : undefined,
          created_at: latest,
        });
      }
    }
  }

  // 2. Recent org claims
  const { data: recentClaims } = await (service as any)
    .from('organization_members')
    .select('joined_at, organizations(name, state)')
    .gte('joined_at', thirtyDaysAgo)
    .neq('user_id', user.id)
    .in('status', ['active', 'pending'])
    .order('joined_at', { ascending: false })
    .limit(10);

  if (recentClaims) {
    for (const claim of recentClaims) {
      const org = (claim as any).organizations;
      if (!org?.name) continue;
      notifications.push({
        id: `claim-${org.name}`,
        type: 'org_claimed',
        message: `${org.name} joined the network`,
        state: org.state || undefined,
        detail: org.state === userState ? 'In your region' : undefined,
        created_at: (claim as any).joined_at,
      });
    }
  }

  // 3. Recent media coverage
  const { data: recentMedia } = await (service as any)
    .from('alma_media_articles')
    .select('id, headline, source_name, published_date')
    .gte('published_date', thirtyDaysAgo)
    .order('published_date', { ascending: false })
    .limit(5);

  if (recentMedia) {
    for (const article of recentMedia) {
      notifications.push({
        id: `media-${(article as any).id}`,
        type: 'media_coverage',
        message: (article as any).headline,
        detail: (article as any).source_name,
        created_at: (article as any).published_date,
      });
    }
  }

  // 4. Community milestones (total members, total actions)
  const { count: totalMembers } = await service
    .from('public_profiles')
    .select('id', { count: 'exact', head: true })
    .not('role_tags', 'is', null);

  const { count: totalActions } = await (service as any)
    .from('member_actions')
    .select('id', { count: 'exact', head: true });

  if (totalMembers && totalMembers > 0) {
    // Find milestone thresholds
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    const reachedMilestone = milestones.filter(m => totalMembers >= m).pop();
    if (reachedMilestone) {
      notifications.push({
        id: `milestone-members-${reachedMilestone}`,
        type: 'milestone',
        message: `${totalMembers} people have joined the movement`,
        detail: `${reachedMilestone}+ milestone reached`,
        created_at: new Date().toISOString(),
      });
    }
  }

  if (totalActions && totalActions >= 5) {
    notifications.push({
      id: `milestone-actions-${totalActions}`,
      type: 'milestone',
      message: `${totalActions} actions taken across the network`,
      detail: 'MP letters, shares, registrations',
      created_at: new Date().toISOString(),
    });
  }

  // Sort: local first, then by date
  notifications.sort((a, b) => {
    const aLocal = a.state === userState ? 1 : 0;
    const bLocal = b.state === userState ? 1 : 0;
    if (aLocal !== bLocal) return bLocal - aLocal;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({
    notifications: notifications.slice(0, 15),
    total: notifications.length,
  });
}
