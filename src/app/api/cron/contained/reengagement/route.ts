import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

/**
 * GET /api/cron/contained/reengagement
 *
 * Runs daily at 10:00 UTC. Finds CONTAINED members who haven't had any
 * tracked action in 7+ days and tags them as inactive_7d in GHL
 * for re-engagement workflows.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const ghl = getGHLClient();

  if (!ghl.isConfigured()) {
    return NextResponse.json({ message: 'GHL not configured, skipping' });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get CONTAINED members with GHL contact IDs from public_profiles + profiles
  const { data: members, error } = await (supabase as any)
    .from('public_profiles')
    .select('user_id, role_tags, preferred_name, profiles!inner(metadata)')
    .filter('role_tags', 'cs', '{"contained_"}');

  if (error || !members) {
    console.error('[Reengagement] Failed to fetch members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  let tagged = 0;
  let skipped = 0;

  for (const member of members) {
    const ghlContactId = member.profiles?.metadata?.ghl_contact_id;
    if (!ghlContactId) { skipped++; continue; }

    // Check for recent actions
    const { count } = await (supabase as any)
      .from('member_actions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', member.user_id)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (count === 0) {
      // No actions in 7 days — tag as inactive
      await ghl.addTags(ghlContactId, [GHL_TAGS.INACTIVE_7D]);
      tagged++;
    } else {
      // Active — remove inactive tag if present
      await ghl.removeTags(ghlContactId, [GHL_TAGS.INACTIVE_7D]);
      skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    members_checked: members.length,
    tagged_inactive: tagged,
    still_active: skipped,
  });
}
